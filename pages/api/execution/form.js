import { noStore, serviceFailure, ServiceError } from '../../../platform/server';
import { withApiSession, isSameOrigin, sendAs, readAs } from '../../../platform/session';
import { courseExecutionPath } from '../../../platform/execution';
import { formAnswerable, formExecutionPath, loadFormExecution, submission } from '../../../platform/forms';
import { cleanForm } from '../../../platform/form-view';

// Save or submit the learner's answers to a survey, editable form or quiz. The answers are checked against the form's own questions,
// the same address and body as the existing player are used, and the result is read back from the API: the browser never decides
// whether a task is finished, passed or what unlocks next.
export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  try {
    await withApiSession(req, res, async token => {
      const { courseId, lessonId, taskId, op, answers } = req.body || {};
      const data = await loadFormExecution(token, courseId, lessonId, taskId);
      if (data.legacy) throw new ServiceError('Continue this task in the existing course player.', 409);
      if (!formAnswerable(data.form)) throw new ServiceError('This task can no longer be answered.', 409);
      const body = submission(data.form, op, answers);
      await sendAs(token, 'learning', formExecutionPath(taskId), 'POST', { body });
      const form = await readAs(token, 'learning', formExecutionPath(taskId));
      const course = await readAs(token, 'learning', courseExecutionPath(courseId));
      res.status(200).json({ status: form.status, progress: course.progress, lessons: course.lessons, form: cleanForm(form) });
    });
  } catch (error) { serviceFailure(res, error); }
}
