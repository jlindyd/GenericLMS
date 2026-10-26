const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file, imports = {}) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(n => imports[n] || require(n), m, m.exports); return m.exports; }
(async () => {
  const config = load('platform/config.js'), server = load('platform/server.js', { './config.js': config });
  const fixtures = load('platform/fixtures.js', { './server.js': server });
  const session = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtures });
  const execution = load('platform/execution.js', { './config.js': config, './server.js': server, './session.js': session });
  const course = { id: 1, type: 'SelfPaced', progress: 0.2, lessons: [{ id: 2, tasks: [{ id: 3, type: 'Video', isEnabled: true }] }] };
  const video = { id: 3, provider: 'AzureBlobStorage', status: 'InProgress', progress: 0.3, assignedTo: 'Trainee' };
  const reads = [], calls = [];
  const read = async (token, service, path) => { reads.push(path); return path.includes('/courses/') ? course : video; };
  const result = await execution.loadVideoExecution('t', 1, 2, 3, read);
  assert.equal(result.legacy, false);
  assert.deepEqual(reads, ['api/trainee/courses/1', 'api/trainee/video/3']);
  assert.equal(execution.taskHref(1, 2, 3, 'Video', 'fr', true), '/trainee/courses/1/lessons/2/tasks/3/video?lang=fr');
  for (const invalid of [NaN, Infinity, -1, 1.1, '0.5', null]) assert.throws(() => execution.videoProgress(invalid));
  for (const valid of [0, 0.5, 1]) assert.equal(execution.videoProgress(valid), valid);
  await assert.rejects(() => execution.loadVideoExecution('t', 1, 99, 3, read), /does not belong/);
  await assert.rejects(() => execution.loadVideoExecution('t', 1, 2, 3, async (...args) => args[2].includes('/courses/') ? course : { ...video, id: 99 }), /did not match/);
  const vimeo = await execution.loadVideoExecution('t', 1, 2, 3, async (...args) => args[2].includes('/courses/') ? course : { ...video, provider: 'Vimeo' });
  assert.equal(vimeo.legacy, true);
  const locked = { ...course, lessons: [{ id: 2, tasks: [{ id: 3, type: 'Video', isEnabled: false }] }] };
  await assert.rejects(() => execution.loadVideoExecution('t', 1, 2, 3, async () => locked), /locked/);
  await session.sendAs('token', 'learning', execution.videoProgressPath(3), 'PUT', { body: 0.5, fetcher: async (url, init) => { calls.push({ url, init }); return { ok: true }; } });
  assert.equal(calls[0].url, config.connection.learning + '/api/trainee/video/3/progress');
  assert.equal(calls[0].init.body, '0.5'); // JSON number, not an object or percent.
  assert.equal(calls[0].init.headers.Authorization, 'Bearer token');
  await assert.rejects(() => session.sendAs('t', 'learning', 'api/trainee/video/3', 'PUT'), /Invalid/);
  const route = load('pages/api/execution/video-progress.js', {
    '../../../platform/server': server,
    '../../../platform/session': { ...session, sendAs: async (...args) => calls.push(args), readAs: read },
    '../../../platform/execution': { ...execution, loadVideoExecution: (...args) => execution.loadVideoExecution(...args, read) },
  }).default;
  const run = async req => { const out = {}; const res = { setHeader() {}, status(code) { out.status = code; return this; }, json(body) { out.body = body; } }; await route(req, res); return out; };
  const req = { method: 'PUT', headers: { origin: 'https://learner.test', host: 'learner.test' }, cookies: { dydBearer: 'token' }, body: { courseId: 1, lessonId: 2, taskId: 3, progress: 0.7 } };
  assert.equal((await run(req)).status, 200); assert.equal(calls[1][2], 'api/trainee/video/3/progress'); assert.equal(calls[1][4].body, 0.7);
  assert.equal((await run(req)).body.status, 'InProgress'); // Never infer Finished from the submitted fraction.
  const before = calls.length;
  assert.equal((await run({ ...req, body: { ...req.body, progress: '1' } })).status, 400);
  assert.equal((await run({ ...req, body: { ...req.body, lessonId: 99 } })).status, 404);
  assert.equal((await run({ ...req, cookies: {} })).status, 401);
  assert.equal((await run({ ...req, method: 'POST' })).status, 405);
  assert.equal((await run({ ...req, headers: { ...req.headers, origin: 'https://other.test' } })).status, 403);
  assert.equal(calls.length, before);
  video.status = 'Finished'; await run(req); assert.equal(calls.length, before);
  console.log('Video membership, locking, provider scope, progress fraction, exact PUT contract, authoritative status and route guards passed. No real progress writes.');
})().catch(error => { console.error(error); process.exit(1); });
