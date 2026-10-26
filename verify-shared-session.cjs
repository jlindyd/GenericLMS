const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file, imports = {}) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(n => imports[n] || require(n), m, m.exports); return m.exports; }
(async () => {
  const previous = process.env.NEXT_PUBLIC_LEARNER_ORIGIN;
  try {
    delete process.env.NEXT_PUBLIC_LEARNER_ORIGIN;
    const defaults = load('platform/config.js');
    assert.equal(defaults.learnerOrigin, 'https://www.hplife-test.dyd.solutions');
    for (const address of ['http://127.0.0.1:3020', 'https://outside.example', 'https://hplife-test.dyd.solutions.evil.test', 'https://user:password@www.hplife-test.dyd.solutions', 'https://www.hplife-test.dyd.solutions/path', 'https://www.hplife-test.dyd.solutions?next=x']) assert.throws(() => defaults.validateLearnerOrigin(address));
    for (const path of ['https://outside.example', '//outside.example', '/\\outside.example']) assert.throws(() => defaults.learnerUrl(path));
    process.env.NEXT_PUBLIC_LEARNER_ORIGIN = 'https://generic-review.hplife-test.dyd.solutions';
    const config = load('platform/config.js');
    const server = load('platform/server.js', { './config.js': config });
    const fixtures = load('platform/fixtures.js', { './server.js': server });
    const session = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtures });
    const path = '/trainee/courses/1/lessons/2/tasks/3/content?lang=ar';
    const destination = new URL(session.signInRedirect(path, 'ar').redirect.destination);
    assert.equal(destination.origin, 'https://auth.hplife-test.dyd.solutions');
    assert.equal(destination.searchParams.get('continue'), config.learnerOrigin + path);
    assert.deepEqual(session.cookieNames, { access: 'dydBearer', refresh: 'dydBearerRefresh' });
    const res = { setHeader() {} };
    assert.deepEqual(await session.requireSession({ req: { cookies: { dydBearer: 'same-session' } }, res, resolvedUrl: path, query: {} }), { token: 'same-session' });
    const noSession = await session.requireSession({ req: { cookies: { NEXT_LOCALE: 'ar' } }, res, resolvedUrl: path, query: {} });
    assert.equal(new URL(noSession.redirect.destination).searchParams.get('locale'), 'ar');
    let call;
    const refreshed = await session.requireSession({ req: { cookies: { dydBearerRefresh: 'refresh' } }, res, resolvedUrl: path, query: {} }, { fetcher: async (url, options) => { call = { url, options }; return { ok: true, headers: { getSetCookie: () => ['dydBearer=fresh; Domain=.hplife-test.dyd.solutions; Path=/; Secure; HttpOnly'] } }; } });
    assert.equal(refreshed.token, 'fresh'); assert.equal(call.url, 'https://auth.hplife-test.dyd.solutions/api/refresh'); assert.equal(call.options.headers.Cookie, 'dydBearerRefresh=refresh');
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_LEARNER_ORIGIN; else process.env.NEXT_PUBLIC_LEARNER_ORIGIN = previous; }
  console.log('Shared cookie/refresh contract, canonical return paths, locale and rejected external destinations passed. No real sign-in requests.');
})().catch(error => { console.error(error); process.exit(1); });
