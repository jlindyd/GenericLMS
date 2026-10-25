import { noStore, serviceFailure } from '../../platform/server';
import { cookieNames, isSameOrigin, sendAs } from '../../platform/session';

// "Resend email": asks the Identity API to send the visitor another message to confirm their email address.
export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  try { await sendAs(token, 'identity', 'api/account/sendconfirmemailmessage', 'POST'); return res.status(204).end(); } catch (error) { return serviceFailure(res, error); }
}
