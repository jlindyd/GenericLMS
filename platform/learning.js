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
