const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
const { Readable, PassThrough } = require('node:stream');
function load(file, imports = {}) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(n => imports[n] || require(n), m, m.exports); return m.exports; }
const tick = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const config = load('platform/config.js'), server = load('platform/server.js', { './config.js': config });
  const activity = load('platform/activity.js', { './config.js': config, './server.js': server });
  assert.deepEqual(activity.activityUser({ sub: 'learner-uuid', preferred_username: 'Learner' }), { uuid: 'learner-uuid', nickName: 'Learner' });
  assert.throws(() => activity.activityUser({ uuid: 'wrong-shape' }), /missing/);
  const course = { id: 1, type: 'SelfPaced', progress: 0.5, lessons: [{ id: 2, tasks: [{ id: 3, type: 'XApiActivity', isEnabled: true }] }] };
  const task = { id: 3, status: 'InProgress', url: 'https://review.blob.core.windows.net/course/package/scormdriver/index.html?sig=example', scormSupportEnabled: true };
  const reads = [], writes = [];
  const read = async (token, service, path) => { reads.push(path); return path.includes('/courses/') ? course : task; };
  const fixtureModule = load('platform/fixtures.js', { './server.js': server, './fixture-forms.js': load('platform/fixture-forms.js') });
  const realSession = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtureModule });
  const session = { ...realSession, readAs: read, isSameOrigin: req => !req.headers.origin || req.headers.origin === 'https://learner.test' };
  const execution = load('platform/execution.js', { './config.js': config, './server.js': server, './session.js': session });
  assert.equal((await execution.loadActivityExecution('session', 1, 2, 3)).legacy, false);
  await assert.rejects(() => execution.loadActivityExecution('session', 1, 99, 3), /does not belong/);
  const locked = structuredClone(course); locked.lessons[0].tasks[0].isEnabled = false;
  await assert.rejects(() => execution.loadActivityExecution('s', 1, 2, 3, async () => locked), /locked/);
  const coached = await execution.loadActivityExecution('s', 1, 2, 3, async () => ({ ...course, type: 'CoachAssisted' })); assert.equal(coached.legacy, true);
  assert.equal(execution.taskHref(1, 2, 3, 'XApiActivity', 'en', true), '/trainee/courses/1/lessons/2/tasks/3/xapiactivity');
  const resumedCourse = structuredClone(course); resumedCourse.lessons[0].tasks[0].status = 'Completed'; resumedCourse.lessons[0].tasks.push({ id: 4, type: 'Content', status: 'NotStarted' });
  const start = load('pages/trainee/courses/[courseId]/index.jsx', {
    '../../../../platform/config': config,
    '../../../../platform/session': { ...session, withSessionRecovery: async (context, operation) => operation('session'), readAs: async () => resumedCourse },
    '../../../../platform/execution': execution,
  });
  assert.equal((await start.getServerSideProps({ query: {}, params: { courseId: '1' }, req: { cookies: {} }, res: { setHeader() {} } })).redirect.destination, '/trainee/courses/1/lessons/2/tasks/4/content');
  const base = activity.activityBase(1, 2, 3);
  const launch = new URL(activity.activityLaunch(task, { uuid: 'learner-uuid' }, base, 'https://learner.test'), 'https://learner.test');
  assert.equal(launch.pathname, base + '/assets/scormdriver/index.html');
  assert.equal(launch.searchParams.get('auth'), 'Bearer session');
  assert.equal(launch.searchParams.get('endpoint'), 'https://learner.test' + base + '/xapi');
  assert.equal(JSON.parse(launch.searchParams.get('actor')).openid, config.connection.identity + '/users/learner-uuid');
  assert.equal(activity.packageResource(task, ['scormcontent', 'image name.png']).href, 'https://review.blob.core.windows.net/course/package/scormcontent/image%20name.png?sig=example');
  for (const parts of [['..', 'secret'], ['%2e%2e'], ['//evil.test'], ['file?x'], ['a\\b']]) assert.throws(() => activity.packageResource(task, parts));
  for (const url of ['http://review.blob.core.windows.net/a', 'https://127.0.0.1/a', 'https://evil.test/a', 'https://user:pass@review.blob.core.windows.net/a']) assert.throws(() => activity.packageLocation({ url }));
  assert.equal(activity.xapiResource(3, ['activities', 'state'], 'PUT', { stateId: 'a&b', auth: 'secret', path: ['ignored'] }), 'api/trainee/xApiActivity/3/activities/state?stateId=a%26b');
  assert.throws(() => activity.xapiResource(3, ['../account'], 'GET'));
  assert.throws(() => activity.xapiResource(3, ['activities', 'state'], 'PUT'));
  const route = load('pages/api/execution/activity/[courseId]/[lessonId]/[taskId]/[...path].js', {
    '../../../../../../../platform/config': config, '../../../../../../../platform/server': server,
    '../../../../../../../platform/session': session, '../../../../../../../platform/execution': execution,
    '../../../../../../../platform/activity': activity,
  }).default;
  const savedFetch = global.fetch;
  let rejectOnce = false;
  global.fetch = async (url, init) => {
    writes.push({ url, init });
    if (url.endsWith('/api/refresh')) return new Response('{}', { status: 200, headers: { 'Set-Cookie': 'dydBearer=renewed-activity; Path=/; Secure' } });
    if (rejectOnce && url.includes('/xApiActivity/')) { rejectOnce = false; return new Response(null, { status: 401 }); }
    return new Response(init.method === 'GET' ? '<html>package</html>' : null, { status: init.method === 'GET' ? 200 : 204, headers: { 'Content-Type': 'text/html' } });
  };
  async function run({ method = 'GET', path = ['status'], body = '', cookies = { dydBearer: 'session' }, headers = {}, query = {} } = {}) {
    const req = Readable.from([Buffer.from(body)]); Object.assign(req, { method, headers, cookies, query: { courseId: '1', lessonId: '2', taskId: '3', path, ...query } });
    const res = new PassThrough(); res.statusCode = 200; const chunks = []; res.on('data', chunk => chunks.push(chunk));
    res.setHeader = () => {}; res.removeListener = res.removeListener.bind(res);
    res.status = code => { res.statusCode = code; return res; }; res.json = value => res.end(JSON.stringify(value));
    await route(req, res); return { status: res.statusCode, body: Buffer.concat(chunks).toString() };
  }
  try {
    assert.equal((await run()).status, 200); assert.equal(writes.length, 0);
    assert.equal((await run({ path: ['assets', 'scormdriver', 'index.html'], query: { auth: 'never-forward-this' } })).body, '<html>package</html>');
    assert.equal(writes[0].init.headers.Authorization, undefined); assert.equal(writes[0].init.redirect, 'error'); assert.equal(writes[0].url.includes('never-forward'), false);
    const rawState = '{"suspend":"原文 العربية"}';
    assert.equal((await run({ method: 'PUT', path: ['xapi', 'activities', 'state'], query: { stateId: 'suspend' }, body: rawState, headers: { 'content-type': 'application/json' } })).status, 204);
    assert.equal(writes[1].init.body.toString(), rawState); assert.equal(writes[1].init.headers.Authorization, 'Bearer session');
    assert.equal(writes[1].url, config.connection.learning + '/api/trainee/xApiActivity/3/activities/state?stateId=suspend');
    const before = writes.length;
    assert.equal((await run({ cookies: {} })).status, 401);
    assert.equal((await run({ headers: { origin: 'https://evil.test' } })).status, 403);
    assert.equal((await run({ query: { lessonId: '99' } })).status, 404);
    assert.equal((await run({ method: 'POST', path: ['assets', 'file'] })).status, 405);
    assert.equal(writes.length, before);
    rejectOnce = true;
    const replayBefore = writes.length;
    assert.equal((await run({ method: 'PUT', path: ['xapi', 'activities', 'state'], query: { stateId: 'resume' }, cookies: { dydBearer: 'rejected-activity', dydBearerRefresh: 'activity-refresh' }, body: rawState, headers: { 'content-type': 'application/json' } })).status, 204);
    const replay = writes.slice(replayBefore).filter(write => write.url.includes('/xApiActivity/'));
    assert.equal(replay.length, 2); assert.equal(replay[0].init.body.toString(), rawState); assert.equal(replay[1].init.body.toString(), rawState);
    assert.equal(replay[1].init.headers.Authorization, 'Bearer renewed-activity');
  } finally { global.fetch = savedFetch; }
  const { createScormApi } = load('platform/scorm.js');
  const requests = [], errors = []; let reject = false;
  const api = createScormApi({ endpoint: '/statements', stateEndpoint: '/state', activityId: '3', studentId: 'learner', studentName: 'Name', initialStates: [{ stateId: 'cmi.suspend_data', content: JSON.stringify({ content: 'saved resume' }) }], onError: e => errors.push(e), fetcher: async (url, init) => { requests.push({ url, init }); return { ok: !reject }; } });
  assert.equal(api.LMSGetValue('cmi.suspend_data'), ''); assert.equal(api.LMSGetLastError(), '301');
  assert.equal(api.LMSInitialize(), 'true'); assert.equal(api.LMSGetValue('cmi.suspend_data'), 'saved resume'); assert.equal(api.LMSGetValue('cmi.core.entry'), 'resume');
  api.LMSSetValue('cmi.suspend_data', 'latest'); api.LMSSetValue('cmi.core.lesson_location', 'page 4'); api.LMSSetValue('cmi.core.score.raw', '95'); api.LMSSetValue('cmi.core.lesson_status', 'passed'); api.LMSCommit();
  await tick(); await tick();
  assert(requests.some(r => r.url === '/state?stateId=cmi.suspend_data' && JSON.parse(r.init.body).content === 'latest'));
  assert(requests.some(r => r.url === '/state?stateId=cmi.core.lesson_location'));
  assert(requests.some(r => r.url === '/statements' && JSON.parse(r.init.body)[0].verb.id.endsWith('/resumed')));
  assert(requests.some(r => r.url === '/statements' && JSON.parse(r.init.body)[0].result?.score.raw === 95));
  reject = true; api.LMSSetValue('cmi.core.lesson_location', 'page 5'); api.LMSCommit(); await tick(); assert.equal(api.LMSGetLastError(), '101');
  reject = false; api._retry(); await tick(); assert.equal(errors.at(-1), '');
  api.LMSSetValue('cmi.suspend_data', 'unload resume'); api._finishWithKeepalive(); await tick();
  assert(requests.some(r => r.init.keepalive && r.url === '/state?stateId=cmi.suspend_data' && JSON.parse(r.init.body).content === 'unload resume'));
  assert.equal(api.LMSSetValue('cmi.core.lesson_location', 'too late'), 'false');
  console.log('Activity membership, guarded package proxy, unchanged xAPI requests, token-free launch, SCORM resume/score/completion/retry/unload passed. No real learner writes.');
})().catch(error => { console.error(error); process.exit(1); });
