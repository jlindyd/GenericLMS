import { noStore, serviceFailure, ServiceError } from '../../../platform/server';
import { cookieNames, downloadName, readFileAs } from '../../../platform/session';

// A certificate of the signed-in visitor as a PDF download (the existing site fetches it from the Learning API the same way).
export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ message: 'Method not allowed.' }); }
  const token = req.cookies[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    const id = String(req.query.id || '');
    if (!/^[0-9a-f-]{8,64}$/i.test(id)) throw new ServiceError('This file was not found.', 404);
    const file = await readFileAs(token, 'learning', `api/certificates/${id}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName(req.query.name, 'certificate')}"`);
    return res.send(file.body);
  } catch (error) { return serviceFailure(res, error); }
}
