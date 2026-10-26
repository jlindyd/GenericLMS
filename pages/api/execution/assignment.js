import { noStore, serviceFailure, ServiceError } from '../../../platform/server';
import { withApiSession, isSameOrigin, sendAs, readAs } from '../../../platform/session';
import { courseExecutionPath } from '../../../platform/execution';
import { assignmentExecutionPath, assignmentFilePath, canRemove, canSubmit, cleanAssignment, loadAssignmentExecution } from '../../../platform/assignments';

// Submit the learner's file for grading, or remove it. The result is read back from the API: the browser never decides the status.
export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  try {
    await withApiSession(req, res, async token => {
      const { courseId, lessonId, taskId, op, fileName } = req.body || {};
      const data = await loadAssignmentExecution(token, courseId, lessonId, taskId);
      if (data.legacy) throw new ServiceError('Continue this task in the existing course player.', 409);
      if (op === 'submit') {
        if (!canSubmit(data.assignment)) throw new ServiceError('Upload a file before submitting, and submit only once.', 409);
        await sendAs(token, 'learning', assignmentExecutionPath(taskId), 'POST', { body: {} });
      } else if (op === 'remove') {
        if (!canRemove(data.assignment)) throw new ServiceError('This file can no longer be removed.', 409);
        const stored = data.assignment.files.find(file => file.name === fileName);
        if (!stored) throw new ServiceError('That file is not part of this assignment.', 404);
        await sendAs(token, 'learning', assignmentFilePath(taskId, stored.name), 'DELETE');
      } else throw new ServiceError('Choose submit or remove.', 400);
      const assignment = await readAs(token, 'learning', assignmentExecutionPath(taskId));
      const course = await readAs(token, 'learning', courseExecutionPath(courseId));
      res.status(200).json({ status: assignment.status, progress: course.progress, lessons: course.lessons, assignment: cleanAssignment(assignment) });
    });
  } catch (error) { serviceFailure(res, error); }
}
