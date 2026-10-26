const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file, imports = {}) { const m = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.React } }).outputText)(n => imports[n] || require(n), m, m.exports); return m.exports; }
const originalFlags = { review: process.env.NEXT_PUBLIC_REVIEW_MODE, fixtures: process.env.GENERIC_LMS_FIXTURES, origin: process.env.NEXT_PUBLIC_LEARNER_ORIGIN };
const restore = () => { for (const [name, key] of [['review', 'NEXT_PUBLIC_REVIEW_MODE'], ['fixtures', 'GENERIC_LMS_FIXTURES'], ['origin', 'NEXT_PUBLIC_LEARNER_ORIGIN']]) { if (originalFlags[name] === undefined) delete process.env[key]; else process.env[key] = originalFlags[name]; } };
try {
  // Normal builds: sign-in goes to the HP LIFE sign-in site and returns to the learner address, exactly as before.
  delete process.env.NEXT_PUBLIC_REVIEW_MODE; process.env.NEXT_PUBLIC_LEARNER_ORIGIN = 'https://learn.hplife-test.dyd.solutions';
  let config = load('platform/config.js');
  assert.equal(config.reviewMode, false);
  assert.equal(config.signInHref('en', '/'), 'https://auth.hplife-test.dyd.solutions/en/login?continue=' + encodeURIComponent('https://learn.hplife-test.dyd.solutions/'));
  assert.equal(config.signInHref('fr', '/course/x?lang=fr'), 'https://auth.hplife-test.dyd.solutions/fr/login?continue=' + encodeURIComponent('https://learn.hplife-test.dyd.solutions/course/x?lang=fr'));
  assert.equal(config.signUpHref('es'), 'https://auth.hplife-test.dyd.solutions/es/signup');

  // Review builds: everything stays on this site.
  process.env.NEXT_PUBLIC_REVIEW_MODE = '1';
  config = load('platform/config.js');
  assert.equal(config.reviewMode, true);
  assert.equal(config.signInHref('en', '/course/x?lang=en'), '/review-signin?next=' + encodeURIComponent('/course/x?lang=en'));
  assert.equal(config.signUpHref('en'), '/review-signin?next=%2Fdashboard');

  // The review sign-in and sign-out pages work only when the server is in fixture mode, and only go to local pages.
  const signIn = load('pages/review-signin.jsx'), signOut = load('pages/review-signout.jsx');
  const run = (page, query) => { const headers = {}; const result = page.getServerSideProps({ query, res: { setHeader: (k, v) => { headers[k] = v; } } }); return { result, headers }; };
  delete process.env.GENERIC_LMS_FIXTURES;
  assert.deepEqual(run(signIn, { next: '/dashboard' }).result, { notFound: true }); assert.deepEqual(run(signOut, {}).result, { notFound: true });
  assert.equal(run(signIn, {}).headers['Set-Cookie'], undefined); // nothing is set when review mode is off
  process.env.GENERIC_LMS_FIXTURES = '1';
  let out = run(signIn, { next: '/trainee/courses/1' });
  assert.equal(out.result.redirect.destination, '/trainee/courses/1'); assert.match(out.headers['Set-Cookie'], /^dydBearer=fixture; Path=\/; SameSite=Lax$/);
  assert.equal(run(signIn, { next: '/' }).result.redirect.destination, '/dashboard'); assert.equal(run(signIn, {}).result.redirect.destination, '/dashboard');
  for (const next of ['//evil.test', 'https://evil.test', 'javascript:alert(1)', '/a\\b']) assert.equal(run(signIn, { next }).result.redirect.destination, '/dashboard', next);
  out = run(signOut, {}); assert.equal(out.result.redirect.destination, '/'); assert.match(out.headers['Set-Cookie'], /^dydBearer=; Path=\/; Max-Age=0/);

  // The sign-in redirect for protected pages follows the same switch.
  const server = load('platform/server.js', { './config.js': config });
  const fixtures = load('platform/fixtures.js', { './server.js': server, './fixture-forms.js': load('platform/fixture-forms.js') });
  let session = load('platform/session.js', { './config.js': config, './server.js': server, './fixtures.js': fixtures });
  assert.deepEqual(session.signInRedirect('/dashboard', 'en'), { redirect: { destination: '/review-signin?next=%2Fdashboard', permanent: false } });
  delete process.env.NEXT_PUBLIC_REVIEW_MODE; config = load('platform/config.js');
  session = load('platform/session.js', { './config.js': config, './server.js': load('platform/server.js', { './config.js': config }), './fixtures.js': fixtures });
  assert.match(session.signInRedirect('/dashboard', 'en').redirect.destination, /^https:\/\/auth\.hplife-test\.dyd\.solutions\/api\/logout\?/);

  // The review launcher turns review mode on; the ordinary start script does not.
  assert.match(fs.readFileSync(__dirname + '/scripts/serve-with-fixtures.cjs', 'utf8'), /NEXT_PUBLIC_REVIEW_MODE: '1'/);
  assert.doesNotMatch(fs.readFileSync(__dirname + '/package.json', 'utf8'), /REVIEW_MODE/);
  console.log('Review mode: normal sign-in links unchanged, review links stay local, review pages work only in fixture mode and only to local pages. Nothing is signed in for real.');
} finally { restore(); }
