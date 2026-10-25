const fs = require('fs'), assert = require('node:assert/strict'), ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
function load(file, reqs = {}) {
  const m = { exports: {} };
  new Function('require', 'module', 'exports', compile(file))(n => reqs[n] || require(n), m, m.exports);
  return m.exports;
}
(async () => {
  delete process.env.NEXT_PUBLIC_APP_ENV;
  const config = load('platform/config.js');
  const server = load('platform/server.js', { './config.js': config });
  const { cleanHtml, cleanCss, cleanPage } = load('platform/sanitize.js');
  const i18n = load('platform/i18n.js', { './translations.json': require('./platform/translations.json'), './config.js': config });

  // Settings: the default is HP LIFE Test, languages are the eight the existing site offers.
  assert.equal(config.connection.id, 'hplife-test'); assert.equal(config.connection.site, 'hp-life');
  assert.deepEqual(config.locales, ['en', 'ar', 'es', 'fr', 'hi', 'id', 'pt', 'zh-Hans']);
  assert.equal(config.resolveLocale('xx'), 'en'); assert.equal(config.resolveLocale('pt'), 'pt');
  assert.equal(config.direction('ar'), 'rtl'); assert.equal(config.direction('en'), 'ltr');

  // CMS read paths match the existing site's contract.
  assert.equal(server.pagePath('about-page', 'fr'), 'page?site=hp-life&path=about-page&language=fr');
  assert.equal(server.feedPath('success-stories', 'xx'), 'pages?site=hp-life&language=en&featureScope=success-stories&page=0&resultsPerPage=25');
  assert.throws(() => server.positiveId('0'), /Unknown item/);
  const calls = []; const fetcher = async (url, init) => { calls.push([url, init]); return { ok: true, status: 200, json: async () => ({}) }; };
  await server.readService('cms', 'page?x=1', { fetcher });
  assert.equal(calls[0][0], 'https://api.hplife-test.dyd.solutions/cms/page?x=1'); assert.equal(calls[0][1].method, 'GET'); assert.equal(calls[0][1].headers['Client-Id'], '1');
  for (const bad of ['/x', 'https://evil.test/x', '']) await assert.rejects(() => server.readService('cms', bad, { fetcher }), /Invalid service request/);
  await assert.rejects(() => server.readService('billing', 'x', { fetcher }), /Invalid service request/);
  await assert.rejects(() => server.readService('cms', 'page', { fetcher: async () => ({ ok: false, status: 404 }) }), /not available in the selected language/);

  // Editorial HTML keeps its look (classes, inline styles, images, safe embeds) but loses anything that can run code.
  const kept = cleanHtml('<div class="about-page-emotion-cache-x" style="background-image:url(https://a.test/i.png)"><h1>Hi</h1><img src="https://a.test/a.png" alt="A" loading="eager"><a href="https://a.test" target="_blank">go</a></div>');
  assert.match(kept, /class="about-page-emotion-cache-x"/); assert.match(kept, /background-image:url\(https:\/\/a\.test\/i\.png\)/); assert.match(kept, /<img src="https:\/\/a\.test\/a\.png"/);
  assert.match(kept, /rel="noopener noreferrer"/);
  assert.doesNotMatch(cleanHtml('<p>a</p><script>alert(1)</script>'), /script|alert/);
  assert.doesNotMatch(cleanHtml('<img src="x" onerror="alert(1)">'), /onerror|alert/);
  assert.doesNotMatch(cleanHtml('<a href="javascript:alert(1)">x</a>'), /javascript/i);
  assert.doesNotMatch(cleanHtml('<div style="width:expression(alert(1))">x</div>'), /expression/);
  assert.doesNotMatch(cleanHtml('<style>body{display:none}</style><p>x</p>'), /style|display/);
  assert.match(cleanHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>'), /youtube\.com\/embed\/abc/);
  assert.doesNotMatch(cleanHtml('<iframe src="https://evil.test/x"></iframe>'), /evil\.test/);
  assert.doesNotMatch(cleanHtml('<iframe src="javascript:alert(1)"></iframe>'), /javascript/i);
  assert.doesNotMatch(cleanHtml('<!-- hidden --><p>x</p>'), /hidden/);
  assert.equal(cleanHtml('<img src="/a.png">'), '<img src="/a.png" alt="">'); assert.equal(cleanHtml('<img src="/a.png" alt="Logo">'), '<img src="/a.png" alt="Logo">');
  assert.doesNotMatch(cleanCss('a{color:red}</style><script>x</script>'), /<\/style/i);
  assert.equal(cleanCss('a{}</STYLE>b'), 'a{}b');
  assert.equal(cleanPage({ title: 't', content: '<p>x</p><script>1</script>', style: '.a{}' }).content, '<p>x</p>');
  // Decorative inline SVG survives; anything that can run code or load other things inside it does not.
  const svg = cleanHtml('<svg viewBox="0 0 10 10" onload="x()"><defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs><path d="M0 0L5 5" fill="url(#g)"/><script>alert(1)</script><use href="javascript:alert(1)"/></svg>');
  assert.match(svg, /<svg viewbox="0 0 10 10"/i); assert.match(svg, /<path d="M0 0L5 5"/); assert.match(svg, /lineargradient/i); assert.match(svg, /stop-color="red"/);
  assert.doesNotMatch(svg, /onload|script|alert|<use|href/i);

  // Translations: every language has the sections and keys the pages use.
  const needed = { BasePageContainer: ['loginBtn', 'allCourses', 'searchText', 'about', 'successStories', 'partners', 'community', 'news', 'courses', 'termsOfUseLink', 'privacyPolicyLink', 'Useofcookies', 'languageText'], BrandProgram: ['logoMessage', 'badgeText', 'trademark', 'privacyLink', 'UseofcookiesLink', 'startTodaySubTitle'], Aboutus: ['startToday', 'joinNow', 'exploreCourses'], SuccessStories: ['successStories', 'viewSuccessStory'], common: ['pauseCarousel', 'playCarousel'] };
  for (const locale of config.locales) for (const [section, keys] of Object.entries(needed)) for (const key of keys) assert.ok(i18n.translate(locale, section, key, '') !== '', `${locale}.${section}.${key}`);
  assert.equal(i18n.translate('fr', 'Nope', 'missing', 'fallback'), 'fallback');

  // Brand variables are generated from the live site's own global styles (the CMS pages read these names).
  const css = fs.readFileSync(__dirname + '/platform/brand-variables.css', 'utf8');
  for (const name of ['--primary-color: #024AD8', '--text-color: #2C3038', '--footer-bg', '--body-bg-light', '--link-color: #024AD8', '--sonic-silver', '--highlighted-section-bg: #024AD8']) assert.ok(css.includes(name), name);
  assert.ok(!css.includes('--highlighted-text-color'), 'the live site does not define --highlighted-text-color; headings must stay dark');

  // Long dates as the existing site writes them.
  const { formatLongDate } = load('platform/dates.js');
  assert.equal(formatLongDate('2026-08-10T00:00:00Z', 'en'), '10 August 2026'); assert.equal(formatLongDate('2026-08-05T12:00:00Z', 'en'), '05 August 2026');
  assert.equal(formatLongDate('', 'en'), ''); assert.equal(formatLongDate('not a date', 'fr'), '');

  // The shared page loader: success gets cached and cleaned, a missing page is a 404 message, a service failure is a 502 message.
  const { loadCmsPage } = load('platform/pages.js', { './config.js': config, './server.js': { pagePath: server.pagePath, readService: async (s, path) => { if (path.includes('missing')) throw new server.ServiceError('This content is not available in the selected language.', 404); if (path.includes('down')) throw new Error('boom'); return { title: 'T', content: '<p>x</p><script>1</script>', style: '.a{}', seo: {} }; }, ServiceError: server.ServiceError }, './sanitize.js': { cleanPage } });
  const run = async path => { const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, statusCode: 200 }; const out = await loadCmsPage(path, { lang: 'fr' }, res); return { res, out }; };
  let r = await run('help-page'); assert.equal(r.out.props.locale, 'fr'); assert.equal(r.out.props.page.content, '<p>x</p>'); assert.match(r.res.headers['Cache-Control'], /s-maxage=60/); assert.equal(r.res.statusCode, 200);
  r = await run('missing'); assert.equal(r.res.statusCode, 404); assert.equal(r.out.props.page, null); assert.match(r.out.props.message, /not available/);
  r = await run('down'); assert.equal(r.res.statusCode, 502); assert.match(r.out.props.message, /unavailable/);
  assert.equal(config.cmsBindings.termsOfUse, 'terms-of-use-page'); assert.equal(config.cmsBindings.homeAbout, 'before-login-about-us-section'); assert.equal(config.cmsFeeds.news, 'news');

  // Assets the pages reference exist.
  for (const file of ['brand/logo.svg', 'brand/foundation.svg', 'brand/FormaDJRUI-Regular.woff2', 'badge/ios/app-Store-Badge-EN.svg', 'badge/android/google-play-badge-ZH.svg', 'favicon.ico']) assert.ok(fs.existsSync(__dirname + '/public/' + file), file);
  console.log('HP LIFE settings, CMS read paths, HTML cleaning, translations, brand variables and assets checks passed. No real requests issued.');
})().catch(e => { console.error(e); process.exit(1); });
