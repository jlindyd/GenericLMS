const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file, imports = {}) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(n => imports[n] || require(n), m, m.exports); return m.exports; }
(async () => {
  const config = load('platform/config.js'), server = load('platform/server.js', { './config.js': config });
  const fixtures = load('platform/fixtures.js', { './server.js': server, './fixture-forms.js': load('platform/fixture-forms.js') });
  const session = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtures });
  const execution = load('platform/execution.js', { './config.js': config, './server.js': server, './session.js': session });
  const forms = load('platform/forms.js', { './server.js': server, './execution.js': execution, './session.js': session });
  const sanitize = load('platform/sanitize.js');
  const view = load('platform/form-view.js', { './sanitize.js': sanitize });
  const text = load('platform/form-text.js', { './form-translations.json': require('./platform/form-translations.json'), './execution-translations.json': require('./platform/execution-translations.json') }).formText;

  const q = [
    { id: 1, type: 'SingleLineText', isRequired: true, actualAnswer: 'hi' },
    { id: 2, type: 'RadioBox', isRequired: true, options: [{ id: 21 }, { id: 22 }], selectedOptions: [22], expectedOptions: [21] },
    { id: 3, type: 'CheckBox', isRequired: false, options: [{ id: 31 }, { id: 32 }, { id: 33 }], selectedOptions: [31], minSelectionCount: 1, maxSelectionCount: 2 },
    { id: 4, type: 'RadioBoxGrid', isRequired: true, options: [{ id: 41 }, { id: 42 }], subQuestions: [{ id: 401, selectedOptions: [41] }, { id: 402 }] },
    { id: 5, type: 'CheckBoxGrid', isRequired: false, options: [{ id: 51 }], subQuestions: [{ id: 501, selectedOptions: [51] }] },
    { id: 6, type: 'LinearScale', isRequired: true, minValue: 1, maxValue: 5, actualAnswer: 3 },
    { id: 7, type: 'Date', actualAnswer: '2026-03-04T00:00:00Z' }, { id: 8, type: 'DateTime', actualAnswer: '2026-03-04T05:06:00Z' }, { id: 9, type: 'Time', actualAnswer: '2026-03-04T14:30:00Z' },
    { id: 10, type: 'DropDown', options: [{ id: 101 }], selectedOptions: [101] }, { id: 11, type: 'Description' }, { id: 12, type: 'MultiLineText', actualAnswer: null },
  ];
  const course = { id: 1, type: 'SelfPaced', lessons: [{ id: 2, tasks: [{ id: 3, type: 'Survey', isEnabled: true }, { id: 4, type: 'Content', isEnabled: true }] }] };
  const form = { id: 3, type: 'Survey', status: 'NotStarted', assignedTo: 'Trainee', isEnabled: true, questions: q };

  // Loading: self-paced tasks of the right kind, for the learner, with known question types.
  const reads = [];
  const read = async (token, service, path) => { reads.push(path); return path.includes('/courses/') ? course : form; };
  const loaded = await forms.loadFormExecution('t', 1, 2, 3, read);
  assert.equal(loaded.legacy, false); assert.deepEqual(reads, ['api/trainee/courses/1', 'api/trainee/form/3']);
  assert.equal((await forms.loadFormExecution('t', 1, 2, 4, read)).legacy, true); // a Content task is not a form
  assert.equal((await forms.loadFormExecution('t', 1, 2, 3, async (...a) => a[2].includes('/courses/') ? { ...course, type: 'CoachAssisted' } : form)).legacy, true);
  assert.equal((await forms.loadFormExecution('t', 1, 2, 3, async (...a) => a[2].includes('/courses/') ? course : { ...form, assignedTo: 'Coach' })).legacy, true);
  assert.equal((await forms.loadFormExecution('t', 1, 2, 3, async (...a) => a[2].includes('/courses/') ? course : { ...form, questions: [{ id: 1, type: 'Hologram' }] })).legacy, true);
  await assert.rejects(() => forms.loadFormExecution('t', 1, 9, 3, read), /does not belong/);
  await assert.rejects(() => forms.loadFormExecution('t', 1, 2, 3, async (...a) => a[2].includes('/courses/') ? course : { ...form, id: 99 }), /did not match/);
  await assert.rejects(() => forms.loadFormExecution('t', 1, 2, 3, async () => ({ ...course, lessons: [{ id: 2, tasks: [{ id: 3, type: 'Survey', isEnabled: false }] }] })), /locked/);

  // Who may still answer.
  const answerable = (type, status, extra = {}) => forms.formAnswerable({ type, status, isEnabled: true, ...extra });
  assert.equal(answerable('Survey', 'NotStarted'), true); assert.equal(answerable('Survey', 'Saved'), true); assert.equal(answerable('Survey', 'Finished'), false);
  assert.equal(answerable('Quiz', 'Failed'), true); assert.equal(answerable('Quiz', 'Passed'), false); assert.equal(answerable('EditableForm', 'Finished'), true); assert.equal(answerable('Quiz', 'NotStarted', { isEnabled: false }), false);

  // Answers as they are edited and sent.
  const saved = forms.savedAnswers(q);
  assert.deepEqual(saved, { 1: 'hi', 2: 22, 3: [31], 4: { 401: 41, 402: undefined }, 5: { 501: [51] }, 6: 3, 7: '2026-03-04', 8: '2026-03-04T05:06', 9: '2026-03-04T14:30:00Z', 10: 101, 11: undefined, 12: '' });
  assert.equal(forms.timeText('2026-03-04T14:30:00Z'), '14:30'); assert.equal(forms.timeAnswer('09:05', new Date('2026-10-26T20:00:00Z')), '2026-10-26T09:05:00Z'); assert.equal(forms.timeAnswer(''), undefined); assert.equal(forms.timeAnswer('25:00'), undefined);
  const by = id => q.find(x => x.id === id);
  assert.deepEqual(forms.changeAnswer({ 3: [31] }, by(3), 32)[3], [31, 32]); assert.deepEqual(forms.changeAnswer({ 3: [31] }, by(3), 31)[3], []);
  assert.deepEqual(forms.changeAnswer({ 4: { 401: 41 } }, by(4), 42, 402)[4], { 401: 41, 402: 42 }); assert.deepEqual(forms.changeAnswer({}, by(5), 51, 501)[5], { 501: [51] }); assert.equal(forms.changeAnswer({}, by(2), 21)[2], 21);
  assert.deepEqual(forms.missingRequired(q, { ...saved, 1: '', 6: undefined }), [1, 4, 6]); // the grid has an unanswered row
  assert.deepEqual(forms.missingRequired(q, { ...saved, 4: { 401: 41, 402: 42 } }), []); assert.deepEqual(forms.missingRequired(q, { ...saved, 4: { 401: 41, 402: 42 }, 2: undefined }), [2]);
  assert.deepEqual(forms.selectionErrors(q, { 3: [] }), { 3: { key: 'minSelection', count: 1 } }); assert.deepEqual(forms.selectionErrors(q, { 3: [31, 32, 33] }), { 3: { key: 'maxSelection', count: 2 } }); assert.deepEqual(forms.selectionErrors(q, { 3: [31] }), {});

  // What is sent: checked against the form itself.
  const full = { ...saved, 4: { 401: 41, 402: 42 }, 9: '2026-03-04T14:30:00Z' };
  const sent = forms.submission(form, 'submit', full);
  assert.equal(sent.op, 'submit'); assert.deepEqual(Object.keys(sent.answers).sort(), ['1', '10', '12', '2', '3', '4', '5', '6', '7', '8', '9'].sort()); assert.equal(sent.answers[12], '');
  assert.deepEqual(forms.submission(form, 'save', { 1: '' }), { op: 'save', answers: { 1: '' } }); // saving needs no complete answers
  const bad = (op, answers, pattern) => assert.throws(() => forms.submission(form, op, answers), pattern);
  bad('delete', {}, /save or submit/); bad('save', null, /missing/); bad('save', [], /missing/); bad('save', { 99: 'x' }, /does not belong/); bad('save', { 11: 'x' }, /does not belong/);
  bad('save', { 2: 999 }, /right form/); bad('save', { 2: '21' }, /right form/); bad('save', { 3: 'x' }, /right form/); bad('save', { 3: [31, 999] }, /right form/); bad('save', { 4: { 999: 41 } }, /right form/); bad('save', { 4: { 401: 999 } }, /right form/); bad('save', { 5: { 501: 51 } }, /right form/);
  bad('save', { 6: 9 }, /right form/); bad('save', { 6: 2.5 }, /right form/); bad('save', { 7: '2026-13-45x' }, /right form/); bad('save', { 8: '2026-03-04' }, /right form/); bad('save', { 9: '14:30' }, /right form/); bad('save', { 1: { a: 1 } }, /right form/); bad('save', { 1: 'x'.repeat(20001) }, /right form/);
  bad('submit', { ...full, 1: '' }, /required/); bad('submit', { ...full, 3: [31, 32, 33] }, /ticked/);
  assert.deepEqual(forms.submission(form, 'save', { 3: [31, 31, 32] }).answers[3], [31, 32]);

  // The page's copy of the form: authored HTML cleaned; correct answers hidden until answered; no coach feedback.
  const dirty = { ...form, body: '<p onclick="x()">Hi</p><script>bad()</script>', questions: [{ ...q[1], body: '<img src=x onerror=bad()>Q', feedbacks: [{ message: 'private' }], options: [{ id: 21, body: '<b>A</b>', expectedAnswer: 'secret' }, { id: 22, body: 'B' }] }, { ...q[3], subQuestions: [{ id: 401, body: 's', expectedOptions: [41] }] }] };
  const open = view.cleanForm(dirty);
  assert.doesNotMatch(JSON.stringify(open), /script|onclick|onerror|private|secret|expectedOptions|expectedAnswer/);
  const done = view.cleanForm({ ...dirty, status: 'Passed' });
  assert.deepEqual(done.questions[0].expectedOptions, [21]); assert.equal(done.questions[0].options[0].expectedAnswer, 'secret'); assert.deepEqual(done.questions[1].subQuestions[0].expectedOptions, [41]); assert.doesNotMatch(JSON.stringify(done), /private|onerror/);

  // The only change allowed is the exact POST to this task.
  const calls = [];
  const fetcher = async (url, init) => { calls.push({ url, init }); return { ok: true }; };
  await session.sendAs('token', 'learning', 'api/trainee/form/3', 'POST', { body: { op: 'save', answers: { 1: 'a' } }, fetcher });
  assert.equal(calls[0].url, config.connection.learning + '/api/trainee/form/3'); assert.equal(calls[0].init.body, '{"op":"save","answers":{"1":"a"}}'); assert.equal(calls[0].init.headers.Authorization, 'Bearer token');
  for (const [method, path] of [['PUT', 'api/trainee/form/3'], ['POST', 'api/trainee/form/0'], ['POST', 'api/trainee/form/3/extra'], ['POST', 'api/trainee/form/x'], ['DELETE', 'api/trainee/form/3']]) await assert.rejects(() => session.sendAs('t', 'learning', path, method, { body: {}, fetcher }), /Invalid/);
  assert.equal(calls.length, 1);

  // The route: guards first, then the write, then the status is read back from the service.
  const writes = [];
  const stored = { ...form };
  const route = load('pages/api/execution/form.js', {
    '../../../platform/server': server,
    '../../../platform/session': { ...session, sendAs: async (...args) => { writes.push(args); stored.status = args[4].body.op === 'submit' ? 'Finished' : 'Saved'; }, readAs: async (token, service, path) => path.includes('/courses/') ? { ...course, progress: 0.5 } : stored },
    '../../../platform/execution': execution, '../../../platform/forms': { ...forms, loadFormExecution: (...args) => forms.loadFormExecution(...args, async (token, service, path) => path.includes('/courses/') ? course : stored) },
    '../../../platform/form-view': view,
  }).default;
  const run = async req => { const out = {}; const res = { setHeader() {}, status(code) { out.status = code; return this; }, json(body) { out.body = body; }, end() {} }; await route(req, res); return out; };
  const req = { method: 'POST', headers: { origin: 'https://learner.test', host: 'learner.test' }, cookies: { dydBearer: 'token' }, body: { courseId: 1, lessonId: 2, taskId: 3, op: 'save', answers: { 1: 'draft' } } };
  let out = await run(req);
  assert.equal(out.status, 200); assert.equal(out.body.status, 'Saved'); assert.equal(out.body.progress, 0.5); assert.equal(writes[0][2], 'api/trainee/form/3'); assert.deepEqual(writes[0][4].body, { op: 'save', answers: { 1: 'draft' } });
  out = await run({ ...req, body: { ...req.body, op: 'submit', answers: full } });
  assert.equal(out.body.status, 'Finished'); assert.equal(writes.length, 2);
  const before = writes.length;
  assert.equal((await run(req)).status, 409); // finished surveys are closed
  stored.status = 'Saved';
  for (const [patch, status] of [[{ op: 'submit', answers: { 1: '' } }, 400], [{ answers: { 99: 'x' } }, 400], [{ lessonId: 99 }, 404], [{ taskId: 4 }, 409]]) assert.equal((await run({ ...req, body: { ...req.body, ...patch } })).status, status);
  assert.equal((await run({ ...req, cookies: {} })).status, 401); assert.equal((await run({ ...req, method: 'GET' })).status, 405); assert.equal((await run({ ...req, headers: { ...req.headers, origin: 'https://other.test' } })).status, 403);
  assert.equal(writes.length, before);

  // Words: eight languages, falling back to English, with counts.
  assert.equal(text('en', 'SurveyFeedback.taskCompleted'), 'Survey Completed'); assert.equal(text('fr', 'saveBtn'), require('./platform/execution-translations.json').fr.saveBtn);
  assert.equal(text('ar', 'QuizFeedback.quizPassed'), 'Congratulations! You passed.'); // missing in Arabic, English is used
  assert.equal(text('en', 'validation.minSelection', { count: 1 }), 'Please select at least 1 option'); assert.equal(text('en', 'validation.maxSelection', { count: 3 }), 'Please select no more than 3 options'); assert.equal(text('en', 'nonsense.key'), 'nonsense.key');
  assert.equal(execution.taskHref(1, 2, 3, 'Survey', 'es', true), '/trainee/courses/1/lessons/2/tasks/3/survey?lang=es');
  console.log('Form tasks: loading and scope, who may answer, answer shapes, validation, tampered answers, hidden correct answers, exact POST contract, route guards and labels passed. No real answers were sent.');
})().catch(error => { console.error(error); process.exit(1); });
