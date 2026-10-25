// ONE-TIME SCAFFOLDING, kept for history. Do not run again: it overwrites files that have since been changed by hand. Paths assume the current folder is C:/DYD/DYDLMS.
const fs=require('fs'),path=require('path');
const out=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text)};
out('GenericLMS/platform/package.json',JSON.stringify({name:'generic-platform',private:true,type:'module'}));
out('GenericLMS/platform/config.js',`export const locales=['en','ar','es','fr','hi','id','pt','zh-Hans'];
export const localeLabels={en:'English',ar:'العربية',es:'Español',fr:'Français',hi:'हिन्दी',id:'Bahasa Indonesia',pt:'Português','zh-Hans':'简体中文'};
export function resolveLocale(value){return locales.includes(value)?value:'en'}
export const environments={
 'hplife-test':{id:'hplife-test',name:'HP LIFE Test',brand:'hplife',site:'hp-life',siteId:1,clientId:'1',cms:'https://api.hplife-test.dyd.solutions/cms',identity:'https://api.hplife-test.dyd.solutions/identity',learning:'https://api.hplife-test.dyd.solutions/learning',reference:'https://www.hplife-test.dyd.solutions'},
 'galilee-test':{id:'galilee-test',name:'Galilee Test',brand:'galilee',site:'galilee',clientId:'1',cms:'https://api.cms-dev.dyd.solutions',identity:'https://api.identity-dev.dyd.solutions',learning:'https://api.learning-dev.dyd.solutions',reference:'https://www.galilee-test.dyd.solutions'},
 'rsti-test':{id:'rsti-test',name:'RSTI Test',brand:'rsti',site:'rsti',clientId:'1',cms:'https://api.rsti-dev.dyd.solutions/cms',identity:'https://api.rsti-dev.dyd.solutions/identity',learning:'https://api.rsti-dev.dyd.solutions/learning',reference:'https://rsti-dev.dyd.solutions'}
};
const environmentId=process.env.NEXT_PUBLIC_APP_ENV||'hplife-test';
if(!environments[environmentId])throw new Error('Unknown application environment.');
export const connection=Object.freeze(environments[environmentId]);
export const origins=Object.freeze({learner:'http://127.0.0.2:3020',cms:'http://127.0.0.2:3021',auth:'http://127.0.0.2:3022'});
export const brandProfiles={hplife:{name:'HP LIFE',primary:'#024ad8',font:'FormaDJRUIRegular',radius:12,footer:'#212121'},galilee:{name:'Galilee One',primary:'#ff9800',font:'Arial',radius:8,footer:'#2e333e'},rsti:{name:'RSTI',primary:'#c8963e',font:'Arial',radius:8,footer:'#0f1f38'}};
export const brand=brandProfiles[connection.brand];
export const direction=locale=>resolveLocale(locale)==='ar'?'rtl':'ltr';
export function portalUrl(locale='en',returnTo=origins.cms){const target=new URL(returnTo);if(![origins.cms,origins.learner].includes(target.origin))throw Error('Unsupported return destination.');return origins.auth+'/'+resolveLocale(locale)+'/login?continue='+encodeURIComponent(target.href)}
export const cmsBindings=Object.freeze({about:'about-page',beforeCampaign:'before-login-news-strategic-planning-in-the-ai-age',afterCampaign:'news-banner-strategic-planning-in-the-ai-age'});
`);
out('GenericLMS/platform/server.js',`import {connection,resolveLocale} from './config.js';
export class ServiceError extends Error{constructor(message,status=502){super(message);this.status=status}}
export async function readService(service,path,{token,fetcher=fetch}={}){
 if(!['cms','identity','learning'].includes(service)||!path||path.startsWith('/')||path.includes('://'))throw new ServiceError('Invalid service request.',400);
 const response=await fetcher(connection[service]+'/'+path,{method:'GET',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'Client-Id':connection.clientId,...(token?{Authorization:'Bearer '+token}:{})}});
 if(!response.ok)throw new ServiceError(response.status===401?'Sign in to continue.':response.status===403?'Your account does not have access to this content.':response.status===404?'This content is not available in the selected language.':'The content service is unavailable. Please retry.',response.status);
 return response.json();
}
export const pagePath=(path,locale)=>'page?'+new URLSearchParams({site:connection.site,path,language:resolveLocale(locale)});
export const feedPath=(filter,locale,page=0)=>'pages?'+new URLSearchParams({site:connection.site,language:resolveLocale(locale),featureScope:filter,page:String(page),resultsPerPage:'10'});
export function positiveId(value){const id=Number(value);if(!Number.isSafeInteger(id)||id<=0)throw new ServiceError('Unknown item.',400);return id}
export function cmsReadPath(query){switch(query.resource){case 'sites':return 'sites';case 'site':return 'sites/'+positiveId(query.siteId);case 'page':return 'sites/'+positiveId(query.siteId)+'/pages/'+positiveId(query.pageId);case 'pages':{const page=Number(query.page||0);if(!Number.isSafeInteger(page)||page<0)throw new ServiceError('Invalid page.',400);const p=new URLSearchParams({search:String(query.search||'').slice(0,200),page:String(page),language:resolveLocale(query.lang)});if(query.status&&['Active','Inactive'].includes(query.status))p.set('status',query.status);return 'sites/'+positiveId(query.siteId)+'/pages?'+p;}default:throw new ServiceError('Unsupported read request.',400)}}
export function noStore(res){res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff')}
export function rejectWrite(req,res){if(req.method==='GET')return false;res.setHeader('Allow','GET');res.status(405).json({message:'This first milestone is read-only.'});return true}
export function serviceFailure(res,error){res.status(error instanceof ServiceError?error.status:502).json({message:error instanceof ServiceError?error.message:'Unable to reach the content service. Please retry.'})}
`);
// Copy the existing brand assets and translations into new projects; originals are read only.
for(const app of ['GenericLMS','GenericCMS']){
 for(const [src,name]of [['LMSUI/brand_override/hplife/brand/assets/brand-logo-header.svg','logo.svg'],['LMSUI/brand_override/hplife/brand/assets/brand-footer.svg','foundation.svg']])fs.copyFileSync(src,app+'/public/brand/'+name);
 for(const name of ['FormaDJRUI-Regular.woff','FormaDJRUI-Regular.woff2'])fs.copyFileSync('LMSUI/brand_override/hplife/public/fonts/'+name,app+'/public/brand/'+name);
}
function merge(a,b){for(const[k,v]of Object.entries(b||{})){if(v&&typeof v==='object'&&!Array.isArray(v))a[k]=merge({...a[k]},v);else a[k]=v;}return a}
const translations={};for(const locale of ['en','ar','es','fr','hi','id','pt','zh-Hans']){const base=JSON.parse(fs.readFileSync('LMSUI/src/locales/base/'+locale+'.json','utf8'));const override=JSON.parse(fs.readFileSync('LMSUI/src/locales/overrides/hplife/'+locale+'.json','utf8'));const full=merge(base,override);translations[locale]=Object.fromEntries(['BasePageContainer','NavigationBar','BrandProgram','Aboutus','HomePage','FooterOfPage','common'].map(k=>[k,full[k]||{}]));}out('GenericLMS/platform/translations.json',JSON.stringify(translations,null,2));
out('GenericLMS/next.config.js',"module.exports={reactStrictMode:true,poweredByHeader:false,experimental:{externalDir:true}};\n");out('GenericCMS/next.config.js',"module.exports={reactStrictMode:true,poweredByHeader:false,experimental:{externalDir:true}};\n");
