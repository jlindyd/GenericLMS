import { connection, learnerUrl, resolveLocale } from './config.js';
import { readService, ServiceError } from './server.js';
import { fixtureResponse, fixturesEnabled, recordFixtureChange } from './fixtures.js';

// Signed-in visitors, the way the existing learner site knows them: the separate sign-in site sets two cookies on the shared
// domain (an access token and a refresh token); this site only reads them, asks the sign-in site for a new access token when
// it has expired, and sends visitors who are not signed in to the sign-in site and back again.
export const cookieNames = Object.freeze({ access: 'dydBearer', refresh: 'dydBearerRefresh' });

// "Set-Cookie: name=value; Domain=...; ..." lines to a { name: value } map (only the first pair of each line is the cookie).
export function cookiesFromSetCookie(lines = []) {
  const jar = {};
  for (const line of lines) {
    const pair = String(line).split(';', 1)[0];
    const eq = pair.indexOf('=');
    if (eq > 0) jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return jar;
}

// A new access token from the sign-in site, using the refresh cookie. Returns the Set-Cookie lines, or null.
export async function refreshSession(refreshToken, { fetcher = fetch } = {}) {
  if (!refreshToken) return null;
  try {
    const response = await fetcher(`${connection.auth}/api/refresh`, { method: 'POST', headers: { Cookie: `${cookieNames.refresh}=${refreshToken}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;
    const lines = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    return lines.length ? lines : null;
  } catch { return null; }
}

// Where a visitor who is not signed in goes: the sign-in site's logout address clears stale cookies and then shows the sign-in page,
// which returns here afterwards.
export function signInRedirect(resolvedUrl, locale) {
  const params = new URLSearchParams({ continue: learnerUrl(resolvedUrl), locale: resolveLocale(locale) });
  return { redirect: { destination: `${connection.auth}/api/logout?${params}`, permanent: false } };
}

// JWT expiry is only a renewal hint. The APIs still verify the token and permissions.
export function tokenNeedsRenewal(token, now = Date.now(), margin = 30000) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= now + margin;
  } catch { return false; }
}
const renewals = new Map();
export async function sessionToken(req, res, { fetcher, force = false, now = Date.now() } = {}) {
  const access = req.cookies?.[cookieNames.access];
  if (access && !force && !tokenNeedsRenewal(access, now)) return access;
  const refresh = req.cookies?.[cookieNames.refresh];
  let lines = null;
  if (refresh) {
    // Parallel activity assets must not rotate the same refresh token independently.
    if (!renewals.has(refresh)) {
      const pending = refreshSession(refresh, { fetcher });
      renewals.set(refresh, pending);
      void pending.finally(() => { const timer = setTimeout(() => renewals.delete(refresh), 5000); timer.unref?.(); });
    }
    lines = await renewals.get(refresh);
  }
  const fresh = lines && cookiesFromSetCookie(lines)[cookieNames.access];
  if (fresh) {
    const existing = res.getHeader?.('Set-Cookie');
    res.setHeader('Set-Cookie', [...(Array.isArray(existing) ? existing : existing ? [existing] : []), ...lines]);
    if (req.cookies) Object.assign(req.cookies, cookiesFromSetCookie(lines));
    return fresh;
  }
  // A temporary renewal failure must not discard an access token that is still valid.
  return access && !force && !tokenNeedsRenewal(access, now, 0) ? access : null;
}

export async function withSessionRecovery(context, operation, options = {}) {
  let token = await sessionToken(context.req, context.res, options);
  const locale = resolveLocale(context.query?.lang || context.req.cookies?.NEXT_LOCALE);
  if (!token) return signInRedirect(context.resolvedUrl, locale);
  try { return await operation(token); }
  catch (error) {
    if (!isSignInRequired(error)) throw error;
    token = await sessionToken(context.req, context.res, { ...options, force: true });
    if (!token) return signInRedirect(context.resolvedUrl, locale);
    try { return await operation(token); }
    catch (retryError) { if (isSignInRequired(retryError)) return signInRedirect(context.resolvedUrl, locale); throw retryError; }
  }
}

export async function withApiSession(req, res, operation, options = {}) {
  let token = await sessionToken(req, res, options);
  if (!token) throw new ServiceError('Sign in to continue.', 401);
  try { return await operation(token); }
  catch (error) {
    if (!isSignInRequired(error)) throw error;
    token = await sessionToken(req, res, { ...options, force: true });
    if (!token) throw error;
    return operation(token); // Exactly one retry, and only after an explicit 401.
  }
}

// For getServerSideProps of pages that need a signed-in visitor: resolves to { token } or { redirect }.
export async function requireSession(context, options = {}) {
  const { req, res, resolvedUrl } = context;
  const locale = (Array.isArray(context.query?.lang) ? context.query.lang[0] : context.query?.lang) || req.cookies?.NEXT_LOCALE;
  const token = await sessionToken(req, res, options);
  if (token) return { token };
  return signInRedirect(resolvedUrl, locale);
}

// Reads that need the visitor's token. A rejected token sends the visitor back through sign-in.
export async function readAs(token, service, path, options) {
  if (fixturesEnabled(token)) return fixtureResponse(service, path);
  return readService(service, path, { ...options, token });
}
export const isSignInRequired = error => error instanceof ServiceError && error.status === 401;

// Changes the visitor makes to their own data through this site. Only these requests are allowed (service, method, path), only with the
// visitor's own token, and only from this site's own pages (the Origin header must match the host when a browser sends one).
const isId = value => /^[0-9]+$/.test(value);
const allowedChanges = [
  ['learning', 'PUT', path => /^api\/trainee\/video\/[1-9][0-9]*\/progress$/.test(path)],
  ['learning', 'POST', path => /^api\/trainee\/content\/[1-9][0-9]*\/validate$/.test(path)],
  ['learning', 'POST', path => /^api\/trainee\/form\/[1-9][0-9]*$/.test(path)],
  ['notifications', 'POST', path => path.startsWith('Notifications/') && path.endsWith('/read') && isId(path.slice(14, -5))],
  ['notifications', 'DELETE', path => path === 'Notifications' || (path.startsWith('Notifications/') && isId(path.slice(14)))],
  ['identity', 'PUT', path => path === 'api/account/profile'], ['identity', 'POST', path => path === 'api/account/changepassword'], ['identity', 'POST', path => path === 'api/account/setPassword'],
  ['identity', 'POST', path => path === 'api/account/sendconfirmemailmessage'], ['identity', 'DELETE', path => path === 'api/Account'], ['emailmarketing', 'PUT', path => path === 'Account/settings'],
];
export const isSameOrigin = req => { const origin = req.headers.origin; if (!origin) return true; try { return new URL(origin).host === req.headers.host; } catch { return false; } };
export async function sendAs(token, service, path, method, { fetcher = fetch, body } = {}) {
  if (!allowedChanges.some(([s, m, allowed]) => s === service && m === method && allowed(String(path))) || !connection[service]) throw new ServiceError('Invalid service request.', 400);
  if (fixturesEnabled(token) && service !== 'notifications') { recordFixtureChange(service, path, method, body); return; } // review mode: nothing is sent anywhere
  const response = await fetcher(`${connection[service]}/${path}`, { method, cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { 'Client-Id': connection.clientId, Authorization: `Bearer ${token}`, ...(body === undefined ? { 'Content-Length': '0' } : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) {
    if (response.status === 401) throw new ServiceError('Sign in to continue.', 401);
    let detail = '';
    try { const data = await response.json(); detail = String(data.message || data.error_description || data.title || '').slice(0, 300); } catch { /* no readable detail */ }
    throw new ServiceError(detail || 'The change could not be saved.', response.status >= 400 && response.status < 500 ? 400 : 502);
  }
}

// A file (PDF) of the visitor's own, such as a certificate or the transcript, passed through with their token.
export async function readFileAs(token, service, path, { fetcher = fetch } = {}) {
  if (service !== 'learning' || !path || path.startsWith('/') || path.includes('://') || path.includes('..')) throw new ServiceError('Invalid service request.', 400);
  const response = await fetcher(`${connection[service]}/${path}`, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(30000), headers: { 'Client-Id': connection.clientId, Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new ServiceError(response.status === 401 ? 'Sign in to continue.' : response.status === 404 ? 'This file was not found.' : 'The file is not available right now.', response.status === 401 ? 401 : response.status === 404 ? 404 : 502);
  return { body: Buffer.from(await response.arrayBuffer()), type: response.headers.get('content-type') || 'application/pdf' };
}
export const downloadName = (name, fallback = 'download') => `${String(name || fallback).replace(/[^\p{L}\p{N} _.-]+/gu, '').trim().slice(0, 120) || fallback}.pdf`;
