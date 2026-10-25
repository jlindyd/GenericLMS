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
  const learning = load('platform/learning.js', { './config.js': config, './server.js': server });
  const sanitize = load('platform/sanitize.js');

  // Read paths: same calls the existing site makes, built from validated values only.
  assert.equal(learning.categoriesPath('fr'), 'api/categories?language=fr&hideEmpty=true');
  assert.equal(learning.categoriesPath('xx'), 'api/categories?language=en&hideEmpty=true');
  assert.equal(learning.categoryPath('7', 'en'), 'api/categories/7?language=en');
  assert.equal(learning.coursePath(414), 'api/Marketplace/courses/414');
  assert.equal(learning.coursesPath({ page: 0, language: 'en' }), 'api/marketplace/courses?page=0&resultsPerPage=12&language=en');
  assert.equal(learning.coursesPath({ page: 2, language: 'es', categoryId: '7', sortBy: 'newest', search: 'email' }), 'api/marketplace/courses?page=2&resultsPerPage=12&language=es&categoryId=7&sortBy=newest&search=email');
  assert.doesNotMatch(learning.coursesPath({ sortBy: 'drop table' }), /sortBy/);
  assert.match(learning.coursesPath({ search: 'a&b=c' }), /search=a%26b%3Dc/);
  assert.equal(learning.coursesPath({ search: 'x'.repeat(500) }).split('search=')[1].length, 200);
  assert.throws(() => learning.coursesPath({ page: -1 }), /Invalid page/);
  assert.throws(() => learning.coursesPath({ page: 'x' }), /Invalid page/);
  assert.throws(() => learning.coursePath('../identity'), /Unknown item/);
  assert.throws(() => learning.coursePath('0'), /Unknown item/);

  // Course addresses.
  assert.equal(learning.slugFromIdAndName(414, 'Business Email'), '414-business-email');
  assert.equal(learning.slugFromIdAndName(5, 'Sales & Marketing: Basics'), '5-sales-and-marketing-basics');
  assert.equal(learning.idFromSlug('414-business-email'), 414);
  assert.equal(learning.idFromSlug('414'), 414);
  for (const bad of ['business-email', '', undefined, '-5']) assert.throws(() => learning.idFromSlug(bad), /not found/);

  // Only what the pages need goes to the browser.
  const card = learning.courseCard({ id: 1, name: 'A', books: [{ id: 'b' }], traineeCount: 3, secret: 'x', progress: 50 });
  assert.deepEqual(Object.keys(card).sort(), ['categoryId', 'description', 'id', 'imageUrl', 'name', 'offline', 'traineeCount']);
  assert.equal(card.offline, true); assert.equal(learning.courseCard({ id: 2, books: [] }).offline, false);

  // The catalogue loader: page numbers, API page = page - 1, and a CMS failure does not break the list.
  const calls = [];
  const readService = async (service, path) => {
    calls.push([service, path]);
    if (service === 'cms') throw new Error('cms down');
    if (path.startsWith('api/categories')) return [{ id: 7, name: 'Digital', imageUrl: null, extra: 1 }];
    return { results: [{ id: 1, name: 'A' }], resultsCount: 25 };
  };
  const catalogue = load('platform/catalogue.js', { './config.js': config, './server.js': { ...server, readService }, './sanitize.js': sanitize, './learning.js': { ...learning, readLearning: path => readService('learning', path) } });
  assert.equal(catalogue.pageNumber('3'), 3); assert.equal(catalogue.pageNumber(['4', '5']), 4);
  for (const bad of ['0', '-2', 'abc', undefined, '99999999999']) assert.equal(catalogue.pageNumber(bad), 1);
  const all = await catalogue.loadAllCourses({ page: '3', lang: 'fr', categoryId: '7', sortBy: 'bogus' });
  assert.equal(all.page, 3); assert.equal(all.locale, 'fr'); assert.equal(all.cms, null); assert.equal(all.total, 25); assert.equal(all.sortBy, null);
  assert.ok(calls.some(([, p]) => p === 'api/marketplace/courses?page=2&resultsPerPage=12&language=fr&categoryId=7'), JSON.stringify(calls));
  assert.deepEqual(all.categories, [{ id: 7, name: 'Digital', imageUrl: null }]);

  // Pages never fetch from the browser with free-form paths: only GET reads through readService exist for the Learning API.
  assert.equal(fs.existsSync(__dirname + '/pages/api/learning.js'), false);
  console.log('Catalogue read paths, course addresses, page data and loaders checks passed. No real requests issued.');
})().catch(e => { console.error(e); process.exit(1); });
