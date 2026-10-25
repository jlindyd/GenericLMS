import { resolveLocale } from './config.js';
import { positiveId, readService, ServiceError } from './server.js';

// Public reads of the Learning API (same calls the existing learner site makes before sign-in).
// Query strings are built the way the existing site's qs.stringify does for these simple values.
const q = values => new URLSearchParams(Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString();

export const RESULTS_PER_PAGE = 12;

export const categoriesPath = locale => `api/categories?${q({ language: resolveLocale(locale), hideEmpty: 'true' })}`;
export const categoryPath = (id, locale) => `api/categories/${positiveId(id)}?${q({ language: resolveLocale(locale) })}`;
export function coursesPath({ page = 0, resultsPerPage = RESULTS_PER_PAGE, language, categoryId, sortBy, search, allLanguages = false } = {}) {
  const p = Number(page);
  if (!Number.isSafeInteger(p) || p < 0) throw new ServiceError('Invalid page.', 400);
  return `api/marketplace/courses?${q({ page: p, resultsPerPage, ...(allLanguages ? {} : { language: resolveLocale(language) }), categoryId: categoryId ? positiveId(categoryId) : undefined, sortBy: sortBy === 'newest' || sortBy === 'mostPopular' ? sortBy : undefined, search: search ? String(search).slice(0, 200) : undefined })}`;
}
export const coursePath = id => `api/Marketplace/courses/${positiveId(id)}`;
export const similarCoursesPath = (id, locale) => `api/marketplace/courses/${positiveId(id)}/suggestedSimilarCourses?${q({ language: resolveLocale(locale) })}`;

// "414-business-email" style address pieces, as the existing site builds them.
export function slugFromIdAndName(id, name) {
  return `${id}-${String(name ?? '')
    .replace('/-+/', ' ').replace('–', ' ').replace(':', '').replace(/\s&/g, ' and ').replace(/\s+/g, '-').replace(/\//g, '-').toLowerCase()}`;
}
export function idFromSlug(slug) {
  const match = /^(\d+)(?:-|$)/.exec(String(slug ?? ''));
  if (!match) throw new ServiceError('This course was not found.', 404);
  return Number(match[1]);
}

export const readLearning = path => readService('learning', path);

// What the pages need from a course list row, nothing more (rows go to the browser as page data).
export const courseCard = c => ({ id: c.id, name: c.name ?? '', description: c.description ?? null, imageUrl: c.imageUrl ?? null, categoryId: c.categoryId ?? null, traineeCount: c.traineeCount ?? 0, offline: Array.isArray(c.books) && c.books.length > 0 });
export const categoryItem = c => ({ id: c.id, name: c.name, imageUrl: c.imageUrl ?? null });

// ---- Signed-in reads (need the visitor's token) ----
// The existing site sends list filters the way qs.stringify does: courseStatus[0]=Draft&courseStatus[1]=Published...
export const ACTIVE_COURSE_STATUSES = Object.freeze(['Draft', 'Published', 'Test']);
// Lists of the visitor's courses. A value that is a list is sent as name[0]=..&name[1]=.., a single value as name=..
const listQuery = ({ courseStatus = ACTIVE_COURSE_STATUSES, traineeStatus, search, page, resultsPerPage, type } = {}) => {
  const params = [];
  const add = (name, value) => { if (Array.isArray(value)) value.forEach((v, i) => params.push([`${name}[${i}]`, v])); else if (value !== undefined && value !== null && value !== '') params.push([name, String(value)]); };
  add('search', search); add('page', page); add('resultsPerPage', resultsPerPage); add('type', type); add('courseStatus', courseStatus); add('traineeStatus', traineeStatus);
  return new URLSearchParams(params).toString();
};
export const myTraineeCoursesPath = (options = {}) => `api/myTraineeCourses?${listQuery({ traineeStatus: ['inprogress', 'notstarted'], ...options })}`;
export const myCoachCoursesPath = (options = {}) => `api/myCoachCourses?${listQuery(options)}`;

// A course of the visitor's: what the cards show and decide on. Progress from "my courses" lists is 0..1 and shown as a percentage;
// lists from the course search (latest courses) are used as the API sends them, as the existing site does.
export const myCourseCard = c => ({
  id: c.id, name: c.name ?? '', description: c.description ?? null, imageUrl: c.imageUrl ?? null, categoryId: c.categoryId ?? null, type: c.type ?? null,
  startDate: c.startDate ?? null, finishDate: c.finishDate ?? null, progress: c.progress ? c.progress * 100 : (c.progress ?? 0),
  hasCertificate: !!c.hasCertificate, certificateId: c.certificateId ?? null, status: c.status ?? null, enrollmentStatus: c.enrollmentStatus ?? null,
  groupName: c.group?.name ?? null, offline: Array.isArray(c.books) && c.books.length > 0,
  lastLessonId: c.lastLessonId ?? null, lastTaskId: c.lastTaskId ?? null, lastTaskType: c.lastTaskType ?? null,
});
export const latestCourseCard = c => ({ ...courseCard(c), progress: c.progress ?? 0, traineeEnrollmentStatus: c.traineeEnrollmentStatus ?? null, hasCertificate: !!c.hasCertificate, startDate: c.startDate ?? null, finishDate: c.finishDate ?? null, groupName: c.group?.name ?? null });

// The status the card shows (the existing site's useCourseCardStatus / useCourseStatusBadge), for a signed-in visitor.
export function cardStatus(course, { isCoach = false } = {}) {
  if (isCoach) return 'coach';
  const enrolled = (course.enrollmentStatus ?? course.traineeEnrollmentStatus) === 'Enrolled';
  const progress = course.progress ?? 0;
  if (enrolled) {
    if (progress === 0) return 'notStarted';
    if (progress === 100) return course.hasCertificate ? 'completedWithCertificate' : 'completedWithoutCertificate';
    return 'inProgress';
  }
  if ((course.enrollmentStatus ?? course.traineeEnrollmentStatus) === 'Pending') return 'pending';
  return 'canEnroll';
}
