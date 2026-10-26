import { positiveId, ServiceError } from './server.js';
import { courseExecutionPath, taskInCourse } from './execution.js';
import { readAs } from './session.js';
import { cleanHtml } from './sanitize.js';
import { files } from './assignment-rules.js';
export * from './assignment-rules.js';

// An assignment is a file the learner turns in and a coach grades. Paths and rules follow the existing player (LMSEXECUTION
// AssignmentPage and AssignmentHelpers): upload one file, remove it, submit it, then wait for the grade. Only self-paced assignments
// assigned to the learner are handled here.
export const assignmentExecutionPath = id => `api/trainee/assignment/${positiveId(id)}`;
export const assignmentFilesPath = id => `${assignmentExecutionPath(id)}/files`;
export const assignmentFilePath = (id, name) => `${assignmentFilesPath(id)}/${safeFileName(name)}`;

// The service's own names for stored files are used in addresses, so only plain file names are accepted.
export function safeFileName(name) {
  const value = String(name ?? '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(value) || value.includes('..')) throw new ServiceError('Unknown file.', 400);
  return value;
}

export const legacyAssignmentRequired = assignment => String(assignment.assignedTo || '').toLowerCase() !== 'trainee';

export async function loadAssignmentExecution(token, courseId, lessonId, taskId, read = readAs) {
  const course = await read(token, 'learning', courseExecutionPath(courseId));
  const selected = taskInCourse(course, lessonId, taskId);
  if (course.type !== 'SelfPaced' || String(selected.task.type).toLowerCase() !== 'assignment') return { course, selected, legacy: true };
  const assignment = await read(token, 'learning', assignmentExecutionPath(taskId));
  if (assignment.id !== positiveId(taskId)) throw new ServiceError('The task response did not match this task.', 502);
  return { course, selected, assignment, legacy: legacyAssignmentRequired(assignment) };
}

// What the browser receives: authored HTML cleaned, the grader's comment as plain text, and only links the learner can follow safely.
const safeLink = url => (/^https:\/\//i.test(String(url || '')) ? String(url) : '');
export function cleanAssignment(assignment) {
  return JSON.parse(JSON.stringify({
    id: assignment.id, name: assignment.name, type: assignment.type, status: assignment.status, body: cleanHtml(assignment.body || ''), isEnabled: assignment.isEnabled, assignedTo: assignment.assignedTo,
    minPassingScore: assignment.minPassingScore, score: assignment.score, feedback: typeof assignment.feedback === 'string' ? assignment.feedback : undefined,
    maxFileSize: assignment.maxFileSize, maxFileCount: assignment.maxFileCount, allowedFileExtensions: assignment.allowedFileExtensions,
    files: files(assignment).map(file => ({ name: file.name, originalName: file.originalName, size: file.size, uploadDate: file.uploadDate, url: safeLink(file.url) })),
  }));
}
