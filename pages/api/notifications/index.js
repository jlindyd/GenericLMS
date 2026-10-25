import { noStore, serviceFailure } from '../../../platform/server';
import { cookieNames, isSameOrigin, readAs, sendAs } from '../../../platform/session';

// The signed-in visitor's notifications (the bell): GET lists them, DELETE clears all of them.
export default async function handler(req, res) {
  noStore(res);
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    if (req.method === 'GET') return res.json(await readAs(token, 'notifications', 'Notifications?page=0&resultsPerPage=1000'));
    if (req.method === 'DELETE') {
      if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
      await sendAs(token, 'notifications', 'Notifications', 'DELETE');
      return res.status(204).end();
    }
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) { return serviceFailure(res, error); }
}
