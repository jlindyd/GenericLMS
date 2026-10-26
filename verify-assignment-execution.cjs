const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file, imports = {}) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(n => imports[n] || require(n), m, m.exports); return m.exports; }
(async () => {
  const config = load('platform/config.js'), server = load('platform/server.js', { './config.js': config });
  const fixtures = load('platform/fixtures.js', { './server.js': server, './fixture-forms.js': load('platform/fixture-forms.js') });
  const session = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtures });
  const execution = load('platform/execution.js', { './config.js': config, './server.js': server, './session.js': session });
  const rules = load('platform/assignment-rules.js');
  const sanitize = load('platform/sanitize.js');
  const a = load('platform/assignments.js', { './server.js': server, './execution.js': execution, './session.js': session, './sanitize.js': sanitize, './assignment-rules.js': rules });
  const text = load('platform/form-text.js', { './form-translations.json': require('./platform/form-translations.json'), './execution-translations.json': require('./platform/execution-translations.json') }).formText;

  const course = { id: 1, type: 'SelfPaced', lessons: [{ id: 2, tasks: [{ id: 3, type: 'Assignment', isEnabled: true }, { id: 4, type: 'Content', isEnabled: true }] }] };
  const base = { id: 3, type: 'Assignment', status: 'NotStarted', assignedTo: 'Trainee', isEnabled: true, maxFileSize: 1048576, maxFileCount: 1, allowedFileExtensions: '.doc,.docx,.zip', files: [] };
  const withFile = status => ({ ...base, status, files: [{ name: 'f-1.docx', originalName: 'Plan.docx', size: 10, url: 'https://files.test/f-1.docx' }] });

  // Loading: self-paced assignments of the learner only.
  const reads = [];
  const read = (assignment, c = course) => async (token, service, path) => { reads.push(path); return path.includes('/courses/') ? c : assignment; };
  const loaded = await a.loadAssignmentExecution('t', 1, 2, 3, read(base));
  assert.equal(loaded.legacy, false); assert.deepEqual(reads, ['api/trainee/courses/1', 'api/trainee/assignment/3']);
  assert.equal((await a.loadAssignmentExecution('t', 1, 2, 4, read(base))).legacy, true);
  assert.equal((await a.loadAssignmentExecution('t', 1, 2, 3, read(base, { ...course, type: 'CoachAssisted' }))).legacy, true);
  assert.equal((await a.loadAssignmentExecution('t', 1, 2, 3, read({ ...base, assignedTo: 'Coach' }))).legacy, true);
  await assert.rejects(() => a.loadAssignmentExecution('t', 1, 9, 3, read(base)), /does not belong/);
  await assert.rejects(() => a.loadAssignmentExecution('t', 1, 2, 3, read({ ...base, id: 99 })), /did not match/);

  // What can be done in each status.
  assert.deepEqual([a.canUpload(base), a.canSubmit(base), a.canRemove(base)], [true, false, false]);
  assert.deepEqual([a.canUpload(withFile('Saved')), a.canSubmit(withFile('Saved')), a.canRemove(withFile('Saved'))], [false, true, true]);
  assert.deepEqual([a.canUpload({ ...base, status: 'Saved' }), a.canSubmit({ ...base, status: 'Saved' })], [true, false]);
  assert.deepEqual([a.canUpload(withFile('WaitingForGrading')), a.canSubmit(withFile('WaitingForGrading')), a.canRemove(withFile('WaitingForGrading'))], [false, false, false]);
  assert.deepEqual([a.canSubmit(withFile('Passed')), a.canRemove(withFile('Passed')), a.canRemove(withFile('Failed'))], [false, false, true]);
  assert.equal(a.canUpload({ ...base, isEnabled: false }), false);

  // Files are checked before they are sent.
  assert.equal(a.fileProblem(base, 'Plan.docx', 1000), null); assert.equal(a.fileProblem(base, 'PLAN.ZIP', 1000), null);
  assert.equal(a.fileProblem(base, 'plan.exe', 1000), 'type'); assert.equal(a.fileProblem(base, 'plan', 1000), 'type'); assert.equal(a.fileProblem(base, 'plan.docx', 0), 'empty'); assert.equal(a.fileProblem(base, 'plan.docx', 1048577), 'size');
  assert.equal(a.fileProblem(base, '../plan.docx', 10), 'invalid'); assert.equal(a.fileProblem(base, 'a\\b.docx', 10), 'invalid'); assert.equal(a.fileProblem(base, '', 10), 'invalid'); assert.equal(a.fileProblem(base, 'x'.repeat(200) + '.docx', 10), 'invalid');
  assert.equal(a.fileProblem({ ...base, files: [{ name: 'x' }] }, 'plan.docx', 10), 'count');
  assert.deepEqual(a.allowedExtensions({}), ['.doc', '.docx', '.zip', '.rar', '.7zip']); assert.deepEqual(a.allowedExtensions({ allowedFileExtensions: 'PDF; .txt' }), ['.pdf', '.txt']);
  assert.equal(a.sizeLimit({}), 104857600); assert.equal(a.sizeLimit({ maxFileSize: 999999999999 }), 104857600); assert.equal(a.sizeLimit({ maxFileSize: 5 }), 5);

  // Stored file names in addresses.
  assert.equal(a.assignmentFilePath(3, 'f-1.docx'), 'api/trainee/assignment/3/files/f-1.docx');
  for (const bad of ['../x', 'a/b', '', '.hidden', 'a..b', 'x y', '%2e%2e']) assert.throws(() => a.assignmentFilePath(3, bad), /Unknown file/);

  // The page's copy: HTML cleaned, only https links, plain-text comment.
  const view = a.cleanAssignment({ ...withFile('Failed'), body: '<p onclick="x()">Hi</p><script>bad()</script>', feedback: '<b>Try</b> again', score: 0.4, files: [{ name: 'f-1.docx', originalName: 'Plan.docx', url: 'javascript:alert(1)' }, { name: 'f-2.docx', url: 'http://insecure.test/f' }, { name: 'f-3.docx', url: 'https://ok.test/f' }], secretField: 'x' });
  assert.doesNotMatch(JSON.stringify(view), /<script|onclick|secretField/); assert.deepEqual(view.files.map(f => f.url), ['', '', 'https://ok.test/f']); assert.equal(view.feedback, '<b>Try</b> again'); // shown as text by the page, never as HTML

  // Only these exact changes are allowed.
  const calls = [];
  const fetcher = async (url, init) => { calls.push({ url, init }); return { ok: true }; };
  await session.sendAs('token', 'learning', 'api/trainee/assignment/3', 'POST', { body: {}, fetcher });
  await session.sendAs('token', 'learning', 'api/trainee/assignment/3/files/f-1.docx', 'DELETE', { fetcher });
  assert.equal(calls[0].url, config.connection.learning + '/api/trainee/assignment/3'); assert.equal(calls[0].init.body, '{}'); assert.equal(calls[1].init.method, 'DELETE'); assert.equal(calls[1].url, config.connection.learning + '/api/trainee/assignment/3/files/f-1.docx');
  for (const [method, path] of [['PUT', 'api/trainee/assignment/3'], ['POST', 'api/trainee/assignment/0'], ['DELETE', 'api/trainee/assignment/3'], ['DELETE', 'api/trainee/assignment/3/files/../x'], ['DELETE', 'api/trainee/assignment/3/files/a/b'], ['POST', 'api/trainee/assignment/3/files']]) await assert.rejects(() => session.sendAs('t', 'learning', path, method, { body: {}, fetcher }), /Invalid/);
  await session.sendFileAs('token', 'api/trainee/assignment/3/files', { name: 'Plan.docx', type: 'application/msword', data: Buffer.from('hello') }, { fetcher });
  assert.equal(calls[2].url, config.connection.learning + '/api/trainee/assignment/3/files'); assert.equal(calls[2].init.method, 'POST'); assert.equal(calls[2].init.body.get('files').name, 'Plan.docx'); assert.equal(calls[2].init.headers.Authorization, 'Bearer token'); assert.equal(calls[2].init.headers['Content-Type'], undefined);
  for (const path of ['api/trainee/assignment/3', 'api/trainee/assignment/3/files/x', 'api/trainee/form/3/files', 'api/trainee/assignment/0/files']) await assert.rejects(() => session.sendFileAs('t', path, { name: 'a.docx', data: Buffer.from('x') }, { fetcher }), /Invalid/);
  assert.equal(calls.length, 3);

  // The routes: guards first, checks next, then the write, then the status is read back.
  const writes = [], uploads = [];
  let stored = { ...base };
  const sessionMock = { ...session,
    sendAs: async (...args) => { writes.push(args); if (args[3] === 'DELETE') stored = { ...stored, files: [], status: 'Saved' }; else stored = { ...stored, status: 'WaitingForGrading' }; },
    sendFileAs: async (token, path, file) => { uploads.push([path, file]); stored = withFile('Saved'); },
    readAs: async (token, service, path) => path.includes('/courses/') ? { ...course, progress: 0.4 } : stored };
  const loadMock = { ...a, loadAssignmentExecution: (...args) => a.loadAssignmentExecution(...args, async (token, service, path) => path.includes('/courses/') ? course : stored) };
  const mocks = { '../../../platform/server': server, '../../../platform/session': sessionMock, '../../../platform/execution': execution, '../../../platform/assignments': loadMock };
  const submitRoute = load('pages/api/execution/assignment.js', mocks).default;
  const fileRoute = load('pages/api/execution/assignment-file.js', mocks);
  const run = async (route, req) => { const out = {}; const res = { setHeader() {}, status(code) { out.status = code; return this; }, json(body) { out.body = body; } }; await route(req, res); return out; };
  const stream = bytes => { const chunks = [Buffer.from(bytes)]; return { [Symbol.asyncIterator]: async function* () { for (const c of chunks) yield c; }, destroy() {} }; };
  const headers = { origin: 'https://learner.test', host: 'learner.test' };
  const upload = (extra = {}, bytes = 'hello') => ({ ...stream(bytes), method: 'POST', headers: { ...headers, 'content-type': 'application/msword', 'content-length': String(bytes.length) }, cookies: { dydBearer: 'token' }, query: { courseId: '1', lessonId: '2', taskId: '3', name: 'Plan.docx' }, ...extra });
  const named = name => ({ query: { courseId: '1', lessonId: '2', taskId: '3', name } });

  let out = await run(fileRoute.default, upload());
  assert.equal(out.status, 200); assert.equal(out.body.status, 'Saved'); assert.equal(uploads[0][0], 'api/trainee/assignment/3/files'); assert.equal(uploads[0][1].name, 'Plan.docx'); assert.equal(uploads[0][1].data.toString(), 'hello'); assert.equal(out.body.assignment.files[0].url, 'https://files.test/f-1.docx');
  assert.equal(fileRoute.config.api.bodyParser, false);
  assert.equal((await run(fileRoute.default, upload())).status, 409); // a file is already there
  stored = { ...base };
  const beforeUploads = uploads.length;
  assert.equal((await run(fileRoute.default, upload(named('virus.exe')))).status, 400);
  assert.equal((await run(fileRoute.default, upload(named('../x.docx')))).status, 400);
  assert.equal((await run(fileRoute.default, upload({}, ''))).status, 400);
  assert.equal((await run(fileRoute.default, upload({ headers: { ...headers, 'content-length': '2000000' } }, 'x'))).status, 413);
  assert.equal((await run(fileRoute.default, upload({}, 'x'.repeat(1048577)))).status, 413);
  assert.equal((await run(fileRoute.default, upload({ query: { courseId: '1', lessonId: '99', taskId: '3', name: 'a.docx' } }))).status, 404);
  assert.equal((await run(fileRoute.default, upload({ cookies: {} }))).status, 401); assert.equal((await run(fileRoute.default, upload({ method: 'GET' }))).status, 405); assert.equal((await run(fileRoute.default, upload({ headers: { origin: 'https://other.test', host: 'learner.test', 'content-length': '5' } }))).status, 403);
  assert.equal(uploads.length, beforeUploads);

  const post = (body, extra = {}) => ({ method: 'POST', headers, cookies: { dydBearer: 'token' }, body: { courseId: 1, lessonId: 2, taskId: 3, ...body }, ...extra });
  stored = withFile('Saved');
  out = await run(submitRoute, post({ op: 'submit' }));
  assert.equal(out.status, 200); assert.equal(out.body.status, 'WaitingForGrading'); assert.equal(writes.at(-1)[2], 'api/trainee/assignment/3'); assert.equal(writes.at(-1)[3], 'POST'); assert.deepEqual(writes.at(-1)[4], { body: {} });
  assert.equal((await run(submitRoute, post({ op: 'submit' }))).status, 409); // already submitted
  stored = withFile('Saved');
  const w = writes.length;
  assert.equal((await run(submitRoute, post({ op: 'remove', fileName: 'other.docx' }))).status, 404); assert.equal((await run(submitRoute, post({ op: 'remove', fileName: '../x' }))).status, 404); assert.equal((await run(submitRoute, post({ op: 'burn' }))).status, 400); assert.equal(writes.length, w);
  out = await run(submitRoute, post({ op: 'remove', fileName: 'f-1.docx' }));
  assert.equal(out.status, 200); assert.equal(writes.at(-1)[2], 'api/trainee/assignment/3/files/f-1.docx'); assert.equal(writes.at(-1)[3], 'DELETE'); assert.equal(out.body.assignment.files.length, 0);
  assert.equal((await run(submitRoute, post({ op: 'submit' }))).status, 409); // nothing to submit
  assert.equal((await run(submitRoute, post({ op: 'submit' }, { cookies: {} }))).status, 401); assert.equal((await run(submitRoute, post({ op: 'submit' }, { method: 'GET' }))).status, 405); assert.equal((await run(submitRoute, post({ op: 'submit' }, { headers: { origin: 'https://other.test', host: 'learner.test' } }))).status, 403);

  // Words.
  assert.equal(text('en', 'Assignment.Approved'), 'Assignment has been approved'); assert.equal(text('en', 'Assignment.FileSizeValidation', { maxfileSize: '1.00' }), 'File must be smaller than 1.00 MB.');
  assert.equal(execution.taskHref(1, 2, 3, 'Assignment', 'fr', true), '/trainee/courses/1/lessons/2/tasks/3/assignment?lang=fr');
  console.log('Assignments: loading and scope, status rules, file checks, safe file names, cleaned copy, exact POST/DELETE/upload contracts, route guards and labels passed. No real files were sent.');
})().catch(error => { console.error(error); process.exit(1); });
