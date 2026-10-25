import { resolveLocale } from './config.js';
import { myCoachCoursesPath, myCourseCard, myTraineeCoursesPath } from './learning.js';
import { readAs } from './session.js';

// "My dashboard": the visitor's courses by tab, read the way the existing site's dashboard does (see LMSUI initialProps/dashboard).
export const TABS = Object.freeze({ inProgress: 'inProgress', completed: 'completed', coach: 'coach', archived: 'archived', badges: 'badges' });
const one = value => (Array.isArray(value) ? value[0] : value);

export const pageNumber = value => { const n = parseInt(one(value), 10); return Number.isSafeInteger(n) && n > 0 && n < 100000 ? n : 1; };

// Which tab the address asks for, from its filters (as the existing site decides it).
export function selectedTab(query) {
  if (one(query.traineeStatus) === 'finished') return TABS.completed;
  if (one(query.courseFilter) === 'coachCourses') return TABS.coach;
  if (one(query.courseStatus) === 'Archived') return TABS.archived;
  if (one(query.showBadges) === 'true') return TABS.badges;
  return TABS.inProgress;
}

const soft = promise => promise.catch(() => null);

export async function loadDashboard(token, query, localeValue) {
  const locale = resolveLocale(localeValue);
  const tab = selectedTab(query);
  const archivedTab = tab === TABS.archived;
  const page = pageNumber(query.page);
  const search = String(one(query.searchText) || '').slice(0, 200);
  const type = ['SelfPaced', 'CoachAssisted'].includes(one(query.type)) ? one(query.type) : undefined;
  const base = { search, page: page - 1, resultsPerPage: archivedTab ? 50 : 12 };
  const archived = { courseStatus: ['Archived'] };
  const [inProgress, coach, completed, archivedTrainee0, archivedCoach0, archivedTrainee, archivedCoach, badges] = await Promise.all([
    readAs(token, 'learning', myTraineeCoursesPath({ ...base, type })),
    readAs(token, 'learning', myCoachCoursesPath(base)),
    readAs(token, 'learning', myTraineeCoursesPath({ ...base, traineeStatus: 'finished' })),
    readAs(token, 'learning', myTraineeCoursesPath({ ...base, ...archived, page: undefined })),
    readAs(token, 'learning', myCoachCoursesPath({ ...base, ...archived, page: undefined })),
    readAs(token, 'learning', myTraineeCoursesPath({ ...base, ...archived })),
    readAs(token, 'learning', myCoachCoursesPath({ ...base, ...archived })),
    tab === TABS.badges ? soft(readAs(token, 'rewards', 'MyBadges')) : Promise.resolve([]),
  ]);
  const archivedAny = [...(archivedTrainee0.results || []), ...(archivedCoach0.results || [])];
  const rows = {
    [TABS.inProgress]: inProgress, [TABS.completed]: completed, [TABS.coach]: coach,
    [TABS.archived]: { results: [...(archivedTrainee.results || []), ...(archivedCoach.results || [])], resultsCount: (archivedTrainee.resultsCount || 0) + (archivedCoach.resultsCount || 0) },
  }[tab];
  const list = rows ? (rows.results || []).map(c => ({ ...myCourseCard(c), isCoach: tab === TABS.coach })) : [];
  return {
    locale, tab, page, search, type: type || null,
    courses: tab === TABS.coach ? list.map(c => ({ ...c, progress: null })) : list,
    total: rows ? rows.resultsCount || 0 : 0,
    badges: tab === TABS.badges ? (Array.isArray(badges) ? badges.map(b => ({ id: b.id ?? null, name: b.name ?? '', description: b.description ?? '', imageUrl: b.imageUrl ?? null, issueDate: b.issueDate ?? null })) : []) : [],
    counts: { inProgress: inProgress.resultsCount || 0, completed: completed.resultsCount || 0, coach: coach.resultsCount || 0 },
    hasArchived: archivedAny.length > 0,
    completedExist: (completed.results || []).length > 0 || archivedAny.some(c => c.progress === 1 || c.progress === 100),
    // The type filter only shows when the visitor has both kinds of course in progress (or has already chosen one).
    showTypeFilter: Boolean(type) || ((inProgress.results || []).some(c => c.type === 'SelfPaced') && (inProgress.results || []).some(c => c.type === 'CoachAssisted')),
  };
}
