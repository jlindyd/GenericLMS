import { rejectWrite, noStore, serviceFailure } from '../../platform/server';
import { cookieNames, isSameOrigin, readAs, sendAs } from '../../platform/session';

// GET: the signed-in visitor's basic details (name for the header). DELETE: deletes their account ("Request account deletion").
export default async function handler(req, res) {
  noStore(res);
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    if (req.method === 'DELETE') {
      if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
      await sendAs(token, 'identity', 'api/Account', 'DELETE');
      return res.status(204).end();
    }
    if (rejectWrite(req, res)) return;
    return res.json(await readAs(token, 'identity', 'api/account/userinfo'));
  } catch (error) { return serviceFailure(res, error); }
}
