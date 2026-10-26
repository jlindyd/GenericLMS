const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file, imports = {}) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(n => imports[n] || require(n), m, m.exports); return m.exports; }
(async () => {
  const config = load('platform/config.js'), server = load('platform/server.js', { './config.js': config });
  const fixtures = load('platform/fixtures.js', { './server.js': server, './fixture-forms.js': load('platform/fixture-forms.js') });
  const session = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtures });
  const execution = load('platform/execution.js', { './config.js': config, './server.js': server, './session.js': session });
  const course = { id: 1, type: 'SelfPaced', progress: 0, lessons: [{ id: 2, isEnabled: true, tasks: [{ id: 3, type: 'Content', isEnabled: true, status: 'NotStarted' }, { id: 4, type: 'Quiz', isEnabled: false }] }] };
  const content = { id: 3, body: '<p>Learning content 中文 العربية</p>', status: 'NotStarted', assignedTo: 'Trainee' };
  assert.equal(execution.taskHref(1, 2, 3, 'Content', 'ar', true), '/trainee/courses/1/lessons/2/tasks/3/content?lang=ar');
  assert.equal(execution.taskHref(1, 2, 3, 'Assignment', 'en', true), config.connection.reference + '/trainee/courses/1/lessons/2/tasks/3/assignment');
  for (const kind of ['Quiz', 'Survey', 'EditableForm']) assert.equal(execution.taskHref(1, 2, 3, kind, 'en', true), `/trainee/courses/1/lessons/2/tasks/3/${kind.toLowerCase()}`);
  assert.throws(() => execution.taskHref('../1', 2, 3, 'Content'));
  assert.throws(() => execution.taskInCourse(course, 2, 4), /locked/);
  assert.throws(() => execution.taskInCourse(course, 99, 3), /does not belong/);
  assert.equal(execution.legacyContentRequired({ body: '<iframe src="https://example.test"></iframe>' }), true);
  assert.equal(execution.legacyContentRequired({ body: '<p onclick="x()">Text</p>' }), true);
  assert.equal(execution.legacyContentRequired(content), false);
  assert.equal(execution.canValidateContent({ ...content, status: 'Finished' }), false);
  assert.equal(execution.canValidateContent({ ...content, status: 'WaitingForCoachApproval' }), false);
  let reads = [];
  const read = async (token, service, path) => { reads.push(path); return path.includes('/courses/') ? course : content; };
  const result = await execution.loadContentExecution('t', 1, 2, 3, read);
  assert.equal(result.legacy, false); assert.deepEqual(reads, ['api/trainee/courses/1', 'api/trainee/content/3']);
  reads = []; await assert.rejects(() => execution.loadContentExecution('t', 1, 9, 3, read), /does not belong/); assert.equal(reads.length, 1);
  const coached = await execution.loadContentExecution('t', 1, 2, 3, async () => ({ ...course, type: 'CoachAssisted' })); assert.equal(coached.legacy, true);
  reads = []; await execution.loadContentExecution('t', 1, 2, 3, async (token, service, path) => { reads.push(path); return path.includes('/courses/') ? course : { ...content, isAutoValidationEnabled: true, status: 'Finished' }; }); assert.equal(reads.length, 3);
  const calls = [];
  await session.sendAs('token', 'learning', 'api/trainee/content/3/validate', 'POST', { body: {}, fetcher: async (url, init) => { calls.push({ url, init }); return { ok: true }; } });
  assert.equal(calls[0].url, config.connection.learning + '/api/trainee/content/3/validate'); assert.equal(calls[0].init.body, '{}');
  await assert.rejects(() => session.sendAs('t', 'learning', 'api/trainee/assignment/3', 'POST', { body: {} }), /Invalid/);
  const route = load('pages/api/execution/complete.js', {
    '../../../platform/server': server, '../../../platform/session': { ...session, sendAs: async (...args) => calls.push(args) },
    '../../../platform/execution': { ...execution, loadContentExecution: async () => ({ ...result, content }) },
  }).default;
  const run = async req => { const out = {}; const res = { setHeader() {}, status(code) { out.status = code; return this; }, json(body) { out.body = body; }, end() {} }; await route(req, res); return out; };
  const req = { method: 'POST', headers: { origin: 'https://learner.test', host: 'learner.test' }, cookies: { dydBearer: 'token' }, body: { courseId: 1, lessonId: 2, taskId: 3 } };
  assert.equal((await run(req)).status, 204); assert.equal(calls[1][2], 'api/trainee/content/3/validate');
  assert.equal((await run({ ...req, cookies: {} })).status, 401);
  assert.equal((await run({ ...req, headers: { ...req.headers, origin: 'https://other.test' } })).status, 403);
  assert.equal((await run({ ...req, method: 'DELETE' })).status, 405);
  console.log('Execution navigation, self-paced scope, locking, membership, auto validation, legacy fallbacks and unchanged completion contract passed. No real progress writes.');
})().catch(error => { console.error(error); process.exit(1); });
