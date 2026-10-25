// Copies sections of the existing site's translations into platform/translations.json (base text, then the HP LIFE overrides on top).
// Usage: node scripts/add-translation-sections.cjs CourseCard Dashboard ...   (run from the GenericLMS folder)
const fs = require('fs'), path = require('path');
const locales = path.join(__dirname, '..', '..', 'LMSUI', 'src', 'locales');
const target = path.join(__dirname, '..', 'platform', 'translations.json');
const all = JSON.parse(fs.readFileSync(target, 'utf8'));
const sections = process.argv.slice(2);
if (!sections.length) { console.error('Name at least one section.'); process.exit(1); }
const read = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
for (const locale of Object.keys(all)) {
  const base = read(path.join(locales, 'base', `${locale}.json`)), over = read(path.join(locales, 'overrides', 'hplife', `${locale}.json`));
  for (const section of sections) {
    const merged = { ...(base[section] || {}), ...(over[section] || {}) };
    if (!Object.keys(merged).length) { console.warn(`${locale}: no ${section}`); continue; }
    all[locale][section] = merged;
  }
}
fs.writeFileSync(target, JSON.stringify(all));
console.log('Added', sections.join(', '));
