import { cmsBindings, resolveLocale } from './config.js';
import { pagePath, readService, ServiceError } from './server.js';
import { cleanPage } from './sanitize.js';
import { categoriesPath, categoryItem, categoryPath, courseCard, coursesPath, readLearning, RESULTS_PER_PAGE } from './learning.js';

// Data for the catalogue pages (All courses, one category, search). All reads are public.
export const pageNumber = value => { const n = parseInt(Array.isArray(value) ? value[0] : value, 10); return Number.isSafeInteger(n) && n > 0 && n < 100000 ? n : 1; };
const one = v => (Array.isArray(v) ? v[0] : v);

export const loadCategories = locale => readLearning(categoriesPath(locale)).then(list => (Array.isArray(list) ? list : []).map(categoryItem));

export async function loadAllCourses(query) {
  const locale = resolveLocale(one(query.lang));
  const page = pageNumber(query.page);
  const categoryId = Number(one(query.categoryId)) > 0 ? Number(one(query.categoryId)) : null;
  const sortBy = one(query.sortBy) === 'newest' || one(query.sortBy) === 'mostPopular' ? one(query.sortBy) : null;
  const [courses, cms, categories] = await Promise.all([
    readLearning(coursesPath({ page: page - 1, language: locale, categoryId, sortBy })),
    readService('cms', pagePath(cmsBindings.allCourses, locale)).then(cleanPage).catch(() => null),
    loadCategories(locale),
  ]);
  return { locale, page, categoryId, sortBy, cms, categories, courses: (courses.results || []).map(courseCard), total: courses.resultsCount ?? 0 };
}

export async function loadCategoryCourses(id, query) {
  const locale = resolveLocale(one(query.lang));
  const page = pageNumber(query.page);
  const [courses, category, categories] = await Promise.all([
    readLearning(coursesPath({ page: page - 1, language: locale, categoryId: id })),
    readLearning(categoryPath(id, locale)),
    loadCategories(locale),
  ]);
  return { locale, page, category: { id: category.id, name: category.name, description: category.description ?? '', seo: { title: category.seo?.title ?? null, description: category.seo?.description ?? null, keywords: category.seo?.keywords ?? null } }, categories, courses: (courses.results || []).map(courseCard), total: courses.resultsCount ?? 0 };
}

export async function loadSearch(query) {
  const locale = resolveLocale(one(query.lang));
  const page = pageNumber(query.page);
  const search = String(one(query.search) ?? '').slice(0, 200);
  const [courses, categories] = await Promise.all([
    readLearning(coursesPath({ page: page - 1, language: locale, search, resultsPerPage: 10 })),
    loadCategories(locale),
  ]);
  return { locale, page, search, categories, courses: (courses.results || []).map(courseCard), total: courses.resultsCount ?? 0 };
}

export const failureProps = (error, extra = {}) => ({ locale: 'en', message: error instanceof ServiceError ? error.message : 'The learning service is unavailable. Please retry.', ...extra });
export { RESULTS_PER_PAGE };
