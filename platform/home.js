import { cmsFeeds, resolveLocale } from './config.js';
import { feedPath, pagePath, readService } from './server.js';
import { cleanPage } from './sanitize.js';
import { categoriesPath, categoryItem, coursesPath, latestCourseCard, myCoachCoursesPath, myCourseCard, myTraineeCoursesPath, readLearning } from './learning.js';
import { readAs } from './session.js';

// What the signed-in home shows, read in parallel. Each block is optional except the visitor's own courses: if that read is
// rejected the visitor is sent back through sign-in (the caller decides), anything else just leaves its block out.
const soft = promise => promise.catch(() => null);

export async function loadSignedInHome(token, localeValue) {
  const locale = resolveLocale(localeValue);
  const [user, mine, coach, latest, banners, categories] = await Promise.all([
    soft(readAs(token, 'identity', 'api/account/userinfo')),
    readAs(token, 'learning', myTraineeCoursesPath()),
    soft(readAs(token, 'learning', myCoachCoursesPath())),
    soft(readAs(token, 'learning', coursesPath({ page: 0, resultsPerPage: 10, sortBy: 'newest', language: locale }))),
    soft(loadBanners(locale)),
    soft(readLearning(categoriesPath(locale))),
  ]);
  return {
    locale,
    userName: user?.preferred_username || user?.name || '',
    myCourses: (mine.results || []).map(myCourseCard),
    coachCourses: ((coach && coach.results) || []).map(c => ({ ...myCourseCard(c), groupName: c.group?.name ?? null })),
    latestCourses: ((latest && latest.results) || []).map(latestCourseCard),
    banners: banners || [],
    categories: (Array.isArray(categories) ? categories : []).map(categoryItem),
  };
}

// The "news" slides shown after sign-in: CMS pages listed by the feature scope; a slide that fails is skipped.
async function loadBanners(locale) {
  const feed = await readService('cms', feedPath(cmsFeeds.bannersAfterLogin, locale, 0, 10));
  const pages = await Promise.all((feed.results || []).map(item => soft(readService('cms', pagePath(item.path, locale)).then(cleanPage)).then(page => page && { path: item.path, ...page })));
  return pages.filter(Boolean);
}
