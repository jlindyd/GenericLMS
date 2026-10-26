const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(require, m, m.exports); return m.exports; }
const tick = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const { createProgressSaver } = load('platform/progress-saver.js');
  const calls = [], saved = [], failures = [];
  let clock = 100000, answer = async () => ({ ok: true, json: async () => ({ status: 'InProgress', progress: 0.1 }) });
  const make = (extra = {}) => createProgressSaver({ courseId: 1, lessonId: 2, taskId: 3, initial: 0.2, onSaved: body => saved.push(body), onFailure: message => failures.push(message), fetcher: async (url, init) => { calls.push({ url, init }); return answer(); }, now: () => clock, ...extra });

  // The request is the existing one: a PUT of the fraction with the course, lesson and task.
  let saver = make();
  saver.save(0.5); await tick();
  assert.equal(calls.length, 1); assert.equal(calls[0].url, '/api/execution/video-progress'); assert.equal(calls[0].init.method, 'PUT'); assert.equal(calls[0].init.keepalive, true);
  assert.deepEqual(JSON.parse(calls[0].init.body), { courseId: 1, lessonId: 2, taskId: 3, progress: 0.5 }); assert.equal(saved.length, 1);

  // Only the furthest point is sent, and not more often than every two seconds unless forced.
  saver.save(0.4); saver.save(0.5); await tick(); assert.equal(calls.length, 1); // nothing new
  clock += 500; saver.save(0.6); await tick(); assert.equal(calls.length, 1); // too soon
  saver.save(0.7, true); await tick(); assert.equal(calls.length, 2); assert.equal(JSON.parse(calls[1].init.body).progress, 0.7); // forced, and it carries the furthest value
  clock += 2500; saver.save(0.8); await tick(); assert.equal(calls.length, 3);
  saver.save(2, true); await tick(); assert.equal(JSON.parse(calls[3].init.body).progress, 1); // never above one
  for (const bad of [NaN, Infinity, undefined, 'x']) saver.save(bad, true); await tick(); assert.equal(calls.length, 4);

  // One request at a time: a value that arrives meanwhile is sent after the first finishes.
  calls.length = 0; saved.length = 0; clock += 5000;
  let release; answer = () => new Promise(resolve => { release = () => resolve({ ok: true, json: async () => ({ status: 'InProgress' }) }); });
  saver = make({ initial: 0 });
  saver.save(0.3, true); await tick(); saver.save(0.4, true); saver.save(0.5, true); await tick(); assert.equal(calls.length, 1);
  release(); await tick(); await tick(); await tick(); assert.equal(calls.length, 2); assert.equal(JSON.parse(calls[1].init.body).progress, 0.5);
  release(); await tick(); await tick();

  // A failed save is reported and can be retried with the furthest value.
  calls.length = 0; failures.length = 0; saved.length = 0;
  answer = async () => ({ ok: false, json: async () => ({ message: 'Try again later.' }) });
  saver = make({ initial: 0 }); saver.save(0.3, true); await tick(); await tick();
  assert.deepEqual(failures, ['Try again later.']); assert.equal(saved.length, 0);
  answer = async () => ({ ok: true, json: async () => ({ status: 'InProgress' }) });
  saver.retry(); await tick(); await tick(); assert.equal(calls.length, 2); assert.equal(JSON.parse(calls[1].init.body).progress, 0.3); assert.equal(saved.length, 1);
  saver.retry(); await tick(); assert.equal(calls.length, 2); // nothing left to retry
  answer = async () => { throw new TypeError('offline'); };
  saver.save(0.6, true); await tick(); await tick(); assert.equal(failures.at(-1), 'offline');

  // A finished video sends nothing, and a disposed saver stops reporting.
  calls.length = 0; failures.length = 0; saved.length = 0; answer = async () => ({ ok: true, json: async () => ({}) });
  make({ finished: true }).save(1, true); await tick(); assert.equal(calls.length, 0);
  saver = make({ initial: 0 }); saver.save(0.2, true); saver.dispose(); await tick(); await tick(); assert.equal(calls.length, 1); assert.equal(saved.length, 0);
  console.log('Video progress saving: exact request, furthest point only, throttling, one at a time, retry, finished and disposed behaviour passed. No real progress writes.');
})().catch(error => { console.error(error); process.exit(1); });
