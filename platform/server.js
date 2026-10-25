import {connection,resolveLocale} from './config.js';
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
