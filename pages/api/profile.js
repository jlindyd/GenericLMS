import { locales } from '../../platform/config';
import { noStore, serviceFailure, ServiceError } from '../../platform/server';
import { cookieNames, isSameOrigin, sendAs } from '../../platform/session';
import { countries, timeZones } from '../../platform/profile-lists';

// Saves the signed-in visitor's profile (the existing site's "Edit profile"): the Identity profile and, when the visitor chose, the
// newsletter setting. Every value is checked here against the same lists the form offers.
const genders = ['Male', 'Female', 'PreferNotToAnswer'];
export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'PUT') { res.setHeader('Allow', 'PUT'); return res.status(405).json({ message: 'Method not allowed.' }); }
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  try {
    const { fullName, language, timeZone, country, gender, isSubscribed } = req.body || {};
    const name = typeof fullName === 'string' ? fullName.trim() : '';
    if (!name || name.length > 200) throw new ServiceError('Enter your name.', 400);
    if (!locales.includes(language) || !timeZones.includes(timeZone) || !Object.hasOwn(countries, country) || (gender && !genders.includes(gender))) throw new ServiceError('Check the values you chose.', 400);
    await sendAs(token, 'identity', 'api/account/profile', 'PUT', { body: { fullName: name, preferredName: name, language, timeZone, phoneNumber: '000000', country, ...(gender ? { gender } : {}) } });
    if (typeof isSubscribed === 'boolean') await sendAs(token, 'emailmarketing', 'Account/settings', 'PUT', { body: { isSubscribed } });
    return res.status(204).end();
  } catch (error) { return serviceFailure(res, error); }
}
