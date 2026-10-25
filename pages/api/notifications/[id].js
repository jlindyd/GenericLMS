import { noStore, positiveId, serviceFailure } from '../../../platform/server';
import { cookieNames, isSameOrigin, sendAs } from '../../../platform/session';

// One notification: POST marks it as read, DELETE dismisses it.
export default async function handler(req, res) {
  noStore(res);
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  if (!['POST', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'POST, DELETE'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  try {
    const id = positiveId(req.query.id);
    await sendAs(token, 'notifications', req.method === 'POST' ? `Notifications/${id}/read` : `Notifications/${id}`, req.method);
    return res.status(204).end();
  } catch (error) { return serviceFailure(res, error); }
}
