import { noStore, serviceFailure } from '../../platform/server';
import { cookieNames, readFileAs } from '../../platform/session';

// The visitor's transcript of completed courses as a PDF download.
export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ message: 'Method not allowed.' }); }
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    const file = await readFileAs(token, 'learning', 'api/transcript');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="transcript.pdf"');
    return res.send(file.body);
  } catch (error) { return serviceFailure(res, error); }
}
