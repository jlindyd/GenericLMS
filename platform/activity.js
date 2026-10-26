import { connection } from './config.js';
import { positiveId, ServiceError } from './server.js';

export const activityBase = (courseId, lessonId, taskId) => `/api/execution/activity/${positiveId(courseId)}/${positiveId(lessonId)}/${positiveId(taskId)}`;
export const activityComplete = status => ['Completed', 'Passed'].includes(status);
export function activityUser(profile) {
  if (typeof profile?.sub !== 'string' || !profile.sub) throw new ServiceError('The learner profile is missing its identifier.', 502);
  return { uuid: profile.sub, nickName: profile.preferred_username || '' };
}

// The source URL is supplied by the authenticated task API, never by the browser.
export function packageLocation(activity) {
  let source;
  try { source = new URL(activity.url); } catch { throw new ServiceError('This activity has no valid package URL.', 502); }
  const host = source.hostname.toLowerCase();
  if (source.protocol !== 'https:' || source.username || source.password || source.port || (!host.endsWith('.blob.core.windows.net') && !host.endsWith('.dyd.solutions') && host !== new URL(connection.learning).hostname)) throw new ServiceError('This activity package host is not supported.', 502);
  const marker = source.pathname.toLowerCase().indexOf('/scormdriver/');
  const split = marker >= 0 ? marker + 1 : source.pathname.lastIndexOf('/') + 1;
  const base = new URL(source.href); base.pathname = source.pathname.slice(0, split); base.hash = '';
  return { base, entry: source.pathname.slice(split) || 'index.html' };
}
export function packageResource(activity, segments) {
  const { base } = packageLocation(activity);
  if (!Array.isArray(segments) || !segments.length || segments.some(part => typeof part !== 'string' || !part || /[\\/?#%\u0000-\u001f]/.test(part) || part === '.' || part === '..')) throw new ServiceError('Unknown activity resource.', 400);
  const url = new URL(segments.map(encodeURIComponent).join('/'), base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) throw new ServiceError('Unknown activity resource.', 400);
  // Keep package URL signatures; do not forward launch/auth parameters to storage.
  url.search = base.search;
  return url;
}
export function xapiResource(taskId, parts, method, query = {}) {
  const resource = parts.join('/');
  const allowed = { statements: ['POST', 'PUT'], 'activities/state': ['GET', 'PUT', 'DELETE'], completion: ['GET'] };
  if (!allowed[resource]?.includes(method)) throw new ServiceError('Unsupported activity request.', 405);
  const params = new URLSearchParams();
  for (const name of ['stateId', 'statementId', 'activityId', 'agent', 'registration']) {
    if (query[name] !== undefined) {
      if (typeof query[name] !== 'string' || query[name].length > 10000) throw new ServiceError('Invalid activity query.', 400);
      params.set(name, query[name]);
    }
  }
  if (resource === 'activities/state' && !params.get('stateId')) throw new ServiceError('A state identifier is required.', 400);
  if (resource === 'statements' && method === 'PUT' && !params.get('statementId')) throw new ServiceError('A statement identifier is required.', 400);
  return `api/trainee/xApiActivity/${positiveId(taskId)}/${resource}${params.size ? '?' + params : ''}`;
}
export function activityLaunch(activity, user, base, origin) {
  if (!user?.uuid) throw new Error('The learner profile is missing its identifier.');
  const { entry } = packageLocation(activity);
  const params = new URLSearchParams({
    endpoint: new URL(base + '/xapi', origin).href,
    auth: 'Bearer session', // Local requests authenticate with the existing session cookie.
    actor: JSON.stringify({ openid: `${connection.identity}/users/${user.uuid}` }),
    activityId: String(activity.id),
  });
  return `${base}/assets/${entry}?${params}`;
}
