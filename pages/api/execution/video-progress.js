import { noStore, serviceFailure, ServiceError } from '../../../platform/server';
import { cookieNames, isSameOrigin, sendAs, readAs } from '../../../platform/session';
import { loadVideoExecution, videoProgress, videoProgressPath, videoExecutionPath, courseExecutionPath } from '../../../platform/execution';

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'PUT') { res.setHeader('Allow', 'PUT'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  const token = req.cookies?.[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    const { courseId, lessonId, taskId, progress } = req.body || {};
    const value = videoProgress(progress);
    const data = await loadVideoExecution(token, courseId, lessonId, taskId);
    if (data.legacy) throw new ServiceError('This video is not yet supported in the new player.', 409);
    if (data.video.status !== 'Finished') await sendAs(token, 'learning', videoProgressPath(taskId), 'PUT', { body: value });
    // The API, rather than the browser's playback event, determines completion and unlocking.
    const video = await readAs(token, 'learning', videoExecutionPath(taskId));
    const course = await readAs(token, 'learning', courseExecutionPath(courseId));
    res.status(200).json({ status: video.status, progress: course.progress, lessons: course.lessons });
  } catch (error) { serviceFailure(res, error); }
}
