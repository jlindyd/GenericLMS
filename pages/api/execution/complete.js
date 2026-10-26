import { noStore, serviceFailure, ServiceError } from '../../../platform/server';
import { cookieNames, isSameOrigin, sendAs } from '../../../platform/session';
import { canValidateContent, loadContentExecution } from '../../../platform/execution';

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  const token = req.cookies?.[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    const { courseId, lessonId, taskId } = req.body || {};
    const data = await loadContentExecution(token, courseId, lessonId, taskId);
    if (data.legacy) throw new ServiceError('Continue this task in the existing course player.', 409);
    if (canValidateContent(data.content)) await sendAs(token, 'learning', `api/trainee/content/${data.content.id}/validate`, 'POST', { body: {} });
    res.status(204).end();
  } catch (error) { serviceFailure(res, error); }
}
