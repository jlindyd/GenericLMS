const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
function load(file, reqs = {}) {
  const m = { exports: {} };
  new Function('require', 'module', 'exports', compile(file))(n => reqs[n] || require(n), m, m.exports);
  return m.exports;
}
(async () => {
  delete process.env.NEXT_PUBLIC_APP_ENV; delete process.env.GENERIC_LMS_FIXTURES;
  const config = load('platform/config.js');
  const server = load('platform/server.js', { './config.js': config });
  const fixtures = load('platform/fixtures.js', { './server.js': server });
  const session = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtures });
  const learning = load('platform/learning.js', { './config.js': config, './server.js': server });
  const dates = load('platform/dates.js');
  const dashboard = load('platform/dashboard.js', { './config.js': config, './learning.js': learning, './session.js': session });

  // Cookies of the sign-in site: names, and reading a refreshed pair from Set-Cookie lines.
  assert.deepEqual({ ...session.cookieNames }, { access: 'dydBearer', refresh: 'dydBearerRefresh' });
  assert.deepEqual(session.cookiesFromSetCookie(['dydBearer=abc.def; Domain=.x.test; Path=/; HttpOnly', 'dydBearerRefresh=zzz; Path=/']), { dydBearer: 'abc.def', dydBearerRefresh: 'zzz' });
  assert.deepEqual(session.cookiesFromSetCookie(['=bad', 'noequals']), {});

  // A visitor who is not signed in goes through the sign-in site's logout address and comes back to the same page.
  const redirect = session.signInRedirect('/dashboard?page=1', 'fr');
  const target = new URL(redirect.redirect.destination);
  assert.equal(target.origin + target.pathname, 'https://auth.hplife-test.dyd.solutions/api/logout');
  assert.equal(target.searchParams.get('continue'), 'https://www.hplife-test.dyd.solutions/dashboard?page=1'); assert.equal(target.searchParams.get('locale'), 'fr');
  assert.equal(redirect.redirect.permanent, false);

  // requireSession: access cookie is used as is; otherwise one refresh with the refresh cookie; otherwise sign-in.
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; } };
  assert.deepEqual(await session.requireSession({ req: { cookies: { dydBearer: 'tok' } }, res, resolvedUrl: '/', query: {} }), { token: 'tok' });
  const calls = [];
  const fetcher = async (url, init) => { calls.push([url, init]); return { ok: true, headers: { getSetCookie: () => ['dydBearer=fresh; Path=/', 'dydBearerRefresh=next; Path=/'] } }; };
  const refreshed = await session.requireSession({ req: { cookies: { dydBearerRefresh: 'r1' } }, res, resolvedUrl: '/', query: {} }, { fetcher });
  assert.deepEqual(refreshed, { token: 'fresh' }); assert.equal(calls[0][0], 'https://auth.hplife-test.dyd.solutions/api/refresh'); assert.equal(calls[0][1].method, 'POST'); assert.equal(calls[0][1].headers.Cookie, 'dydBearerRefresh=r1');
  assert.equal(res.headers['Set-Cookie'].length, 2);
  const failing = await session.requireSession({ req: { cookies: { dydBearerRefresh: 'r1' } }, res, resolvedUrl: '/dashboard', query: { lang: 'es' } }, { fetcher: async () => ({ ok: false, headers: { getSetCookie: () => [] } }) });
  assert.ok(failing.redirect.destination.includes('/api/logout')); assert.ok(failing.redirect.destination.includes('locale=es'));
  assert.ok((await session.requireSession({ req: { cookies: {} }, res, resolvedUrl: '/', query: {} })).redirect);

  // Changes through this site: only notifications, only POST/DELETE, never a path that leaves the service; same-origin only.
  const sent = [];
  const sender = async (url, init) => { sent.push([url, init.method, init.headers.Authorization]); return { ok: true }; };
  await session.sendAs('t', 'notifications', 'Notifications/5/read', 'POST', { fetcher: sender });
  await session.sendAs('t', 'notifications', 'Notifications', 'DELETE', { fetcher: sender });
  assert.deepEqual(sent.map(s => s.slice(1)), [['POST', 'Bearer t'], ['DELETE', 'Bearer t']]);
  assert.equal(sent[0][0], 'https://api.hplife-test.dyd.solutions/notifications/Notifications/5/read');
  for (const bad of [['learning', 'x', 'POST'], ['notifications', '../x', 'POST'], ['notifications', '/x', 'POST'], ['notifications', 'x', 'PUT'], ['notifications', 'https://evil.test', 'DELETE']]) await assert.rejects(() => session.sendAs('t', ...bad, { fetcher: sender }), /Invalid service request/);
  assert.equal(session.isSameOrigin({ headers: { host: 'a.test' } }), true);
  assert.equal(session.isSameOrigin({ headers: { origin: 'https://a.test', host: 'a.test' } }), true);
  assert.equal(session.isSameOrigin({ headers: { origin: 'https://evil.test', host: 'a.test' } }), false);
  assert.equal(session.downloadName('Business: Email/1'), 'Business Email1.pdf'); assert.equal(session.downloadName('', 'certificate'), 'certificate.pdf');
  await assert.rejects(() => session.readFileAs('t', 'identity', 'x'), /Invalid service request/);

  // The fixture stand-in is off unless asked for and only answers to the word "fixture".
  assert.equal(fixtures.fixturesEnabled('fixture'), false);
  process.env.GENERIC_LMS_FIXTURES = '1';
  assert.equal(fixtures.fixturesEnabled('fixture'), true); assert.equal(fixtures.fixturesEnabled('real-token'), false);
  delete process.env.GENERIC_LMS_FIXTURES;

  // Course lists of the visitor: the filters go out as the existing site sends them.
  const inProgress = learning.myTraineeCoursesPath();
  assert.ok(inProgress.startsWith('api/myTraineeCourses?')); assert.ok(inProgress.includes('courseStatus%5B0%5D=Draft') && inProgress.includes('courseStatus%5B2%5D=Test')); assert.ok(inProgress.includes('traineeStatus%5B0%5D=inprogress') && inProgress.includes('traineeStatus%5B1%5D=notstarted'));
  const finished = learning.myTraineeCoursesPath({ traineeStatus: 'finished', search: 'a b', page: 2, resultsPerPage: 12, type: 'SelfPaced' });
  assert.ok(finished.includes('traineeStatus=finished') && finished.includes('search=a+b') && finished.includes('page=2') && finished.includes('resultsPerPage=12') && finished.includes('type=SelfPaced'));
  assert.ok(learning.myCoachCoursesPath({ courseStatus: ['Archived'] }).includes('courseStatus%5B0%5D=Archived'));
  const mine = learning.myCourseCard({ id: 1, name: 'A', progress: 0.6, certificateId: 'c', secret: 'x', group: { name: 'G' }, books: [{}] });
  assert.equal(mine.progress, 60); assert.equal(mine.offline, true); assert.equal(mine.groupName, 'G'); assert.equal('secret' in mine, false);
  assert.equal(learning.myCourseCard({ id: 2, progress: 0 }).progress, 0);
  assert.equal(learning.latestCourseCard({ id: 3, progress: 0.5 }).progress, 0.5); // the course search is used as the API sends it, as on the existing site

  // The status behind the badge and the buttons of a card.
  assert.equal(learning.cardStatus({ enrollmentStatus: 'Enrolled', progress: 0 }), 'notStarted');
  assert.equal(learning.cardStatus({ enrollmentStatus: 'Enrolled', progress: 40 }), 'inProgress');
  assert.equal(learning.cardStatus({ enrollmentStatus: 'Enrolled', progress: 100, hasCertificate: true }), 'completedWithCertificate');
  assert.equal(learning.cardStatus({ traineeEnrollmentStatus: 'Enrolled', progress: 100 }), 'completedWithoutCertificate');
  assert.equal(learning.cardStatus({ traineeEnrollmentStatus: 'NotEnrolled' }), 'canEnroll'); assert.equal(learning.cardStatus({}, { isCoach: true }), 'coach');

  // Short dates on cards, in each language's order, in UTC.
  assert.equal(dates.formatShortDate('2026-07-29T00:00:00Z', 'en'), '7/29/2026'); assert.equal(dates.formatShortDate('2026-07-05T23:59:00Z', 'fr'), '05/07/2026');
  assert.equal(dates.formatShortDate('2026-07-05T00:00:00Z', 'zh-Hans'), '2026/7/5'); assert.equal(dates.formatShortDate('', 'en'), ''); assert.equal(dates.formatShortDate('nope', 'en'), '');

  // Dashboard: which tab an address asks for, and safe page numbers.
  assert.equal(dashboard.selectedTab({}), 'inProgress'); assert.equal(dashboard.selectedTab({ traineeStatus: 'finished' }), 'completed');
  assert.equal(dashboard.selectedTab({ courseFilter: 'coachCourses' }), 'coach'); assert.equal(dashboard.selectedTab({ courseStatus: 'Archived' }), 'archived'); assert.equal(dashboard.selectedTab({ showBadges: 'true' }), 'badges');
  assert.equal(dashboard.selectedTab({ traineeStatus: ['finished', 'x'] }), 'completed');
  assert.equal(dashboard.pageNumber('4'), 4); for (const bad of ['0', '-1', 'x', undefined]) assert.equal(dashboard.pageNumber(bad), 1);

  // Dashboard data from stand-in answers: counts, the tab's list and the type filter rule.
  process.env.GENERIC_LMS_FIXTURES = '1';
  const board = load('platform/dashboard.js', { './config.js': config, './learning.js': learning, './session.js': { readAs: async (token, service, path) => {
    if (service === 'rewards') return [];
    if (path.includes('Archived')) return { resultsCount: 0, results: [] };
    if (path.startsWith('api/myCoachCourses')) return { resultsCount: 0, results: [] };
    if (path.includes('traineeStatus=finished')) return { resultsCount: 1, results: [{ id: 9, name: 'Done', progress: 1, hasCertificate: true, certificateId: 'c-1', type: 'SelfPaced' }] };
    return { resultsCount: 2, results: [{ id: 1, name: 'A', progress: 0.5, type: 'SelfPaced' }, { id: 2, name: 'B', progress: 0, type: 'CoachAssisted' }] };
  } } });
  const inProgressTab = await board.loadDashboard('t', {}, 'en');
  assert.equal(inProgressTab.tab, 'inProgress'); assert.equal(inProgressTab.courses.length, 2); assert.equal(inProgressTab.courses[0].progress, 50); assert.equal(inProgressTab.total, 2);
  assert.equal(inProgressTab.showTypeFilter, true); assert.equal(inProgressTab.completedExist, true); assert.equal(inProgressTab.hasArchived, false);
  const completedTab = await board.loadDashboard('t', { traineeStatus: 'finished', page: '1' }, 'en');
  assert.equal(completedTab.courses[0].certificateId, 'c-1'); assert.equal(completedTab.total, 1);
  const filtered = await board.loadDashboard('t', { type: 'SelfPaced' }, 'en'); assert.equal(filtered.type, 'SelfPaced'); assert.equal(filtered.showTypeFilter, true);
  assert.equal((await board.loadDashboard('t', { type: '<script>' }, 'en')).type, null);
  delete process.env.GENERIC_LMS_FIXTURES;
  console.log('Sign-in cookies, redirects, token refresh, own-data changes, course lists, card status, short dates and dashboard checks passed. No real requests issued.');
})().catch(e => { console.error(e); process.exit(1); });
