import { connection, resolveLocale } from './config.js';
import { positiveId, ServiceError } from './server.js';
import { readAs } from './session.js';

export const executionEnabled = process.env.NEXT_PUBLIC_COURSE_EXECUTION === '1';
const types = ['content', 'meeting', 'editableform', 'quiz', 'survey', 'assignment', 'video', 'test', 'xapiactivity'];
export function taskHref(courseId, lessonId, taskId, type, locale = 'en', local = executionEnabled) {
  const kind = String(type).toLowerCase();
  if (!types.includes(kind)) throw new ServiceError('Unknown task type.', 400);
  const path = `/trainee/courses/${positiveId(courseId)}/lessons/${positiveId(lessonId)}/tasks/${positiveId(taskId)}/${kind}`;
  const query = resolveLocale(locale) === 'en' ? '' : `?lang=${resolveLocale(locale)}`;
  return `${local && ['content', 'video', 'xapiactivity', 'survey', 'editableform', 'quiz', 'assignment'].includes(kind) ? '' : connection.reference}${path}${query}`;
}
export const courseExecutionPath = id => `api/trainee/courses/${positiveId(id)}`;
export const contentExecutionPath = id => `api/trainee/content/${positiveId(id)}`;
export const activityExecutionPath = id => `api/trainee/task/${positiveId(id)}`;
export async function loadActivityExecution(token, courseId, lessonId, taskId, read = readAs) {
  const course = await read(token, 'learning', courseExecutionPath(courseId));
  const selected = taskInCourse(course, lessonId, taskId);
  if (course.type !== 'SelfPaced' || String(selected.task.type).toLowerCase() !== 'xapiactivity') return { course, selected, legacy: true };
  const activity = await read(token, 'learning', activityExecutionPath(taskId));
  if (activity.id !== positiveId(taskId)) throw new ServiceError('The task response did not match this task.', 502);
  return { course, selected, activity, legacy: String(activity.assignedTo || '').toLowerCase() === 'coach' };
}
// Azure Blob Storage videos (also when the provider is not stated) and Vimeo videos with a Vimeo player address are played here.
export const vimeoPlayerUrl = url => /^https:\/\/player\.vimeo\.com\/video\/[0-9]+(?:\?[A-Za-z0-9=&_%.-]*)?$/.test(String(url || ''));
export const videoProviderSupported = video => !video.provider || video.provider === 'AzureBlobStorage' || (video.provider === 'Vimeo' && vimeoPlayerUrl(video.url));
export const videoExecutionPath = id => `api/trainee/video/${positiveId(id)}`;
export const videoProgressPath = id => `${videoExecutionPath(id)}/progress`;
export function videoProgress(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new ServiceError('Video progress must be between zero and one.', 400);
  return value;
}
export async function loadVideoExecution(token, courseId, lessonId, taskId, read = readAs) {
  const course = await read(token, 'learning', courseExecutionPath(courseId));
  const selected = taskInCourse(course, lessonId, taskId);
  if (course.type !== 'SelfPaced' || String(selected.task.type).toLowerCase() !== 'video') return { course, selected, legacy: true };
  const video = await read(token, 'learning', videoExecutionPath(taskId));
  if (video.id !== positiveId(taskId)) throw new ServiceError('The task response did not match this task.', 502);
  return { course, selected, video, legacy: String(video.assignedTo || '').toLowerCase() === 'coach' || !videoProviderSupported(video) };
}
export function courseTasks(course) {
  return (course.lessons || []).flatMap(lesson => (lesson.tasks || []).map(task => ({ lesson, task })));
}
export function taskInCourse(course, lessonId, taskId) {
  const selected = courseTasks(course).find(item => item.lesson.id === positiveId(lessonId) && item.task.id === positiveId(taskId));
  if (!selected) throw new ServiceError('This task does not belong to the selected course and lesson.', 404);
  if (selected.lesson.isEnabled === false || selected.task.isEnabled === false) throw new ServiceError('This task is locked.', 403);
  return selected;
}
export function legacyContentRequired(content) {
  return String(content.assignedTo || '').toLowerCase() === 'coach' || /<(?:iframe|script|object|embed)\b|\bon\w+\s*=|javascript:/i.test(content.body || '');
}
export const canValidateContent = content => !['Finished', 'WaitingForCoachApproval'].includes(content.status) && String(content.assignedTo || '').toLowerCase() !== 'coach';
export async function loadContentExecution(token, courseId, lessonId, taskId, read = readAs) {
  const course = await read(token, 'learning', courseExecutionPath(courseId));
  const selected = taskInCourse(course, lessonId, taskId);
  if (course.type !== 'SelfPaced') return { course, selected, legacy: true };
  if (String(selected.task.type).toLowerCase() !== 'content') return { course, selected, legacy: true };
  const content = await read(token, 'learning', contentExecutionPath(taskId));
  if (content.id !== positiveId(taskId)) throw new ServiceError('The task response did not match this task.', 502);
  if (legacyContentRequired(content)) return { course, selected, content, legacy: true };
  const freshCourse = content.isAutoValidationEnabled ? await read(token, 'learning', courseExecutionPath(courseId)) : course;
  return { course: freshCourse, selected, content, legacy: false };
}
