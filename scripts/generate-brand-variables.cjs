// Regenerates the learner site's global styles from the existing site (read only):
//   platform/global-styles.js     the styles as a string for MUI GlobalStyles (emotion understands the nesting)
//   platform/brand-variables.css  the same styles as plain CSS (nested rules), used by the CMS preview
// Source: LMSUI src/styles/global.tsx plus the HP LIFE brand-colors.ts and brand-fonts.ts.
// Run from C:/DYD/DYDLMS with `node GenericLMS/scripts/generate-brand-variables.cjs`; needs a typescript package on the module path.
const fs = require('fs'), ts = require('typescript');
const load = f => { const m = {}; new Function('exports', ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(m); return m; };
const colors = load('LMSUI/brand_override/hplife/brand/brand-colors.ts').Brand_colors;
const fonts = load('LMSUI/brand_override/hplife/brand/brand-fonts.ts').Brand_fonts;
const constant = load('LMSUI/src/styles/constantColors.ts').Constant_colors;
const src = fs.readFileSync('LMSUI/src/styles/global.tsx', 'utf8');

const pick = (marker, from = 0) => {
  const start = src.indexOf('css`', src.indexOf(marker, from)) + 4;
  const end = src.indexOf('`', start);
  return src.slice(start, end);
};
// The first block is the element reset, the second ("deprecated-styles") holds the page, wrapper and editor-content rules.
let css = pick('const emotionStyles') + '\n' + pick('key="deprecated-styles"');
const lookup = (table, name, kind) => { if (!(name in table)) throw new Error(`${kind}.${name} is not defined`); return table[name]; };
css = css
  .replace(/\$\{Brand_colors\.(\w+)\}/g, (m, k) => lookup(colors, k, 'Brand_colors'))
  .replace(/\$\{Brand_fonts\.(\w+)\}/g, (m, k) => lookup(fonts, k, 'Brand_fonts'))
  .replace(/\$\{Constant_colors\.(\w+)\}/g, (m, k) => lookup(constant, k, 'Constant_colors'))
  .replace(/\$\{theme\.breakpoints\.up\('lg'\)\}/g, '@media (min-width: 1170px)')
  .replace(/\$\{theme\.breakpoints\.down\('md'\)\}/g, '@media (max-width: 767.95px)')
  .replace(/\$\{isDirRtl\}/g, "[dir='rtl']");
const left = css.match(/\$\{[^}]*\}/);
if (left) throw new Error('Unresolved substitution: ' + left[0]);
css = css.replace(/^ {6}/gm, '').trim() + '\n';

const note = 'Generated from the existing HP LIFE learner site (LMSUI src/styles/global.tsx, brand-colors.ts, brand-fonts.ts). Do not edit by hand.';
fs.writeFileSync('GenericLMS/platform/brand-variables.css', `/* ${note} */\n${css}`);
fs.writeFileSync('GenericLMS/platform/global-styles.js', `// ${note}\nexport const globalCss = ${JSON.stringify(css)};\n`);
console.log('global styles written:', css.length, 'characters');
