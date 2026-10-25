// Regenerates platform/brand-variables.css from the existing learner site (read only). Run from C:/DYD/DYDLMS with `node GenericLMS/scripts/generate-brand-variables.cjs`; needs a typescript package on the module path.
const fs=require('fs'),ts=require('typescript');
const load=(f)=>{const m={};new Function('exports',ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m);return m};
const colors=load('LMSUI/brand_override/hplife/brand/brand-colors.ts').Brand_colors, fonts=load('LMSUI/brand_override/hplife/brand/brand-fonts.ts').Brand_fonts, constant=load('LMSUI/src/styles/constantColors.ts').Constant_colors;
const src=fs.readFileSync('LMSUI/src/styles/global.tsx','utf8');
const start=src.indexOf('      html {\n        font-size: 62.5%;\n        --normal'), end=src.indexOf('      /* Wrapper */');
let block=src.slice(start,end);
block=block.replace(/\$\{Brand_colors\.(\w+)\}/g,(m,k)=>{if(!(k in colors))throw new Error('colors.'+k);return colors[k]}).replace(/\$\{Brand_fonts\.(\w+)\}/g,(m,k)=>{if(!(k in fonts))throw new Error('fonts.'+k);return fonts[k]}).replace(/\$\{Constant_colors\.(\w+)\}/g,(m,k)=>{if(!(k in constant))throw new Error('constant.'+k);return constant[k]});
if(/\$\{/.test(block))throw new Error('unresolved: '+block.match(/\$\{[^}]*\}/)[0]);
block=block.replace(/^ {6}/gm,'');
const out='/* Generated from the existing HP LIFE learner site (LMSUI src/styles/global.tsx with brand-colors.ts, brand-fonts.ts). Do not edit by hand. */\n'+block;
fs.writeFileSync('GenericLMS/platform/brand-variables.css',out);console.log(out.length,'chars');
