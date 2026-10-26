import { noStore, serviceFailure, ServiceError } from '../../../platform/server';
import { withApiSession, isSameOrigin, sendFileAs, readAs } from '../../../platform/session';
import { courseExecutionPath } from '../../../platform/execution';
import { assignmentExecutionPath, assignmentFilesPath, canUpload, cleanAssignment, fileProblem, loadAssignmentExecution, problemMessages, sizeLimit } from '../../../platform/assignments';

// The file arrives as raw bytes (name and ids in the address) so it can be checked against the assignment's own limits before it is
// passed on to the learning service as a form, the way the existing player sends it.
export const config = { api: { bodyParser: false } };

async function readBody(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) { req.destroy?.(); throw new ServiceError(problemMessages.size, 413); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  try {
    await withApiSession(req, res, async token => {
      const { courseId, lessonId, taskId, name } = req.query || {};
      const data = await loadAssignmentExecution(token, courseId, lessonId, taskId);
      if (data.legacy) throw new ServiceError('Continue this task in the existing course player.', 409);
      if (!canUpload(data.assignment)) throw new ServiceError('A file cannot be added to this assignment now.', 409);
      const declared = Number(req.headers['content-length']);
      if (Number.isFinite(declared) && declared > sizeLimit(data.assignment)) throw new ServiceError(problemMessages.size, 413);
      const body = await readBody(req, sizeLimit(data.assignment));
      const problem = fileProblem(data.assignment, String(name ?? ''), body.length);
      if (problem) throw new ServiceError(problemMessages[problem], problem === 'size' ? 413 : 400);
      await sendFileAs(token, assignmentFilesPath(taskId), { name: String(name), type: String(req.headers['content-type'] || ''), data: body });
      const assignment = await readAs(token, 'learning', assignmentExecutionPath(taskId));
      const course = await readAs(token, 'learning', courseExecutionPath(courseId));
      res.status(200).json({ status: assignment.status, progress: course.progress, lessons: course.lessons, assignment: cleanAssignment(assignment) });
    });
  } catch (error) { serviceFailure(res, error); }
}
