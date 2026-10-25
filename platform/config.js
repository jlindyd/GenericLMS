export const locales=['en','ar','es','fr','hi','id','pt','zh-Hans'];
export const localeLabels={en:'English',ar:'العربية',es:'Español',fr:'Français',hi:'हिन्दी',id:'Bahasa Indonesia',pt:'Português','zh-Hans':'简体中文'};
export function resolveLocale(value){return locales.includes(value)?value:'en'}
export const environments={
 'hplife-test':{id:'hplife-test',name:'HP LIFE Test',brand:'hplife',site:'hp-life',siteId:1,clientId:'1',cms:'https://api.hplife-test.dyd.solutions/cms',identity:'https://api.hplife-test.dyd.solutions/identity',learning:'https://api.hplife-test.dyd.solutions/learning',alerts:'https://api.hplife-test.dyd.solutions/alerts',rewards:'https://api.hplife-test.dyd.solutions/rewards',notifications:'https://api.hplife-test.dyd.solutions/notifications',reference:'https://www.hplife-test.dyd.solutions',auth:'https://auth.hplife-test.dyd.solutions',links:{facebook:'https://www.facebook.com/HPLIFE',youtube:'https://www.youtube.com/channel/UC1f_Wh4VHOSyDmco-SQowgw',linkedin:'https://www.linkedin.com/company/hplife/',appStore:'https://apps.apple.com/us/app/hp-life/id1605830167',googlePlay:'https://play.google.com/store/apps/details?id=com.hp.life'}},
 'galilee-test':{id:'galilee-test',name:'Galilee Test',brand:'galilee',site:'galilee',clientId:'1',cms:'https://api.cms-dev.dyd.solutions',identity:'https://api.identity-dev.dyd.solutions',learning:'https://api.learning-dev.dyd.solutions',reference:'https://www.galilee-test.dyd.solutions'},
 'rsti-test':{id:'rsti-test',name:'RSTI Test',brand:'rsti',site:'rsti',clientId:'1',cms:'https://api.rsti-dev.dyd.solutions/cms',identity:'https://api.rsti-dev.dyd.solutions/identity',learning:'https://api.rsti-dev.dyd.solutions/learning',reference:'https://rsti-dev.dyd.solutions'}
};
const environmentId=process.env.NEXT_PUBLIC_APP_ENV||'hplife-test';
if(!environments[environmentId])throw new Error('Unknown application environment.');
export const connection=Object.freeze(environments[environmentId]);
export const origins=Object.freeze({learner:'http://127.0.0.1:3020',cms:'http://127.0.0.1:3021',auth:'http://127.0.0.1:3022'});
// Windows that may send CMS content to /preview: the CMS app on either spelling of the local address.
export const cmsOrigins=Object.freeze([origins.cms,origins.cms.replace('127.0.0.1','localhost')]);
export const brandProfiles={hplife:{name:'HP LIFE',primary:'#024ad8',font:'FormaDJRUIRegular',radius:12,footer:'#212121'},galilee:{name:'Galilee One',primary:'#ff9800',font:'Arial',radius:8,footer:'#2e333e'},rsti:{name:'RSTI',primary:'#c8963e',font:'Arial',radius:8,footer:'#0f1f38'}};
export const brand=brandProfiles[connection.brand];
export const direction=locale=>resolveLocale(locale)==='ar'?'rtl':'ltr';
export function portalUrl(locale='en',returnTo=origins.cms){const target=new URL(returnTo);if(![origins.cms,origins.learner].includes(target.origin))throw Error('Unsupported return destination.');return origins.auth+'/'+resolveLocale(locale)+'/login?continue='+encodeURIComponent(target.href)}
// CMS page paths the existing learner site reads (LMSUI domain/api/endpoints/staticData/constants/_hardcoded.ts).
export const cmsBindings=Object.freeze({about:'about-page',help:'help-page',partners:'partners-page',termsOfUse:'terms-of-use-page',privacy:'privacy-page',cookie:'cookie-usage-page',resources:'resources-page',newsList:'news-list-page',successStoriesList:'success-stories-list-page',aiVideosList:'ai-videos-list-page',badgesList:'badges-list-page',downloadApp:'download-app-banner',startTeaching:'start-teaching-page',allCourses:'all-courses-page',homeAbout:'before-login-about-us-section',homePartners:'before-login-partners-section',homeStatistics:'before-login-marketing-statistics-section',beforeCampaign:'before-login-news-strategic-planning-in-the-ai-age',afterCampaign:'news-banner-strategic-planning-in-the-ai-age'});
// Attribute filters that select articles for each list.
export const cmsFeeds=Object.freeze({news:'news',successStories:'success-stories',aiVideos:'ai-videos',bannersBeforeLogin:'news-banners-before-login',bannersAfterLogin:'news-banners-after-login'});
