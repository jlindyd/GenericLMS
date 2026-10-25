import { noStore, serviceFailure, ServiceError } from '../../platform/server';
import { cookieNames, isSameOrigin, sendAs } from '../../platform/session';

// Changes the signed-in visitor's password (when they send the old one) or creates a first password (when they do not). The new password
// is checked by the Identity API; this route only passes it on and never stores or logs it.
export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body || {};
    const text = value => typeof value === 'string' && value.length > 0 && value.length <= 256;
    if (!text(newPassword) || !text(confirmPassword) || (oldPassword !== undefined && !text(oldPassword))) throw new ServiceError('Enter the passwords.', 400);
    if (oldPassword === undefined) await sendAs(token, 'identity', 'api/account/setPassword', 'POST', { body: { newPassword, confirmPassword } });
    else await sendAs(token, 'identity', 'api/account/changepassword', 'POST', { body: { OldPassword: oldPassword, NewPassword: newPassword, ConfirmPassword: confirmPassword } });
    return res.status(204).end();
  } catch (error) { return serviceFailure(res, error); }
}
