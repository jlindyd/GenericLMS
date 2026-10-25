import { connection, resolveLocale } from './config.js';
import { readService, ServiceError } from './server.js';
import { fixtureResponse, fixturesEnabled } from './fixtures.js';

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
  const params = new URLSearchParams({ continue: `${connection.reference}${resolvedUrl}`, locale: resolveLocale(locale) });
  return { redirect: { destination: `${connection.auth}/api/logout?${params}`, permanent: false } };
}

// For getServerSideProps of pages that need a signed-in visitor: resolves to { token } or { redirect }.
export async function requireSession(context, { fetcher } = {}) {
  const { req, res, resolvedUrl } = context;
  const locale = Array.isArray(context.query?.lang) ? context.query.lang[0] : context.query?.lang;
  const access = req.cookies?.[cookieNames.access];
  if (access) return { token: access };
  const lines = await refreshSession(req.cookies?.[cookieNames.refresh], { fetcher });
  if (lines) {
    const fresh = cookiesFromSetCookie(lines)[cookieNames.access];
    if (fresh) { res.setHeader('Set-Cookie', lines); return { token: fresh }; }
  }
  return signInRedirect(resolvedUrl, locale);
}

// Reads that need the visitor's token. A rejected token sends the visitor back through sign-in.
export async function readAs(token, service, path, options) {
  if (fixturesEnabled(token)) return fixtureResponse(service, path);
  return readService(service, path, { ...options, token });
}
export const isSignInRequired = error => error instanceof ServiceError && error.status === 401;

// Changes the visitor makes to their own data through this site (reading a notification, dismissing one). Only the Notifications service,
// only with the visitor's own token, and only from this site's own pages (the Origin header must match the host when a browser sends one).
export const isSameOrigin = req => { const origin = req.headers.origin; if (!origin) return true; try { return new URL(origin).host === req.headers.host; } catch { return false; } };
export async function sendAs(token, service, path, method, { fetcher = fetch } = {}) {
  if (service !== 'notifications' || !['POST', 'DELETE'].includes(method) || !path || path.startsWith('/') || path.includes('://') || path.includes('..')) throw new ServiceError('Invalid service request.', 400);
  const response = await fetcher(`${connection[service]}/${path}`, { method, cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { 'Client-Id': connection.clientId, Authorization: `Bearer ${token}`, 'Content-Length': '0' } });
  if (!response.ok) throw new ServiceError(response.status === 401 ? 'Sign in to continue.' : 'The notification could not be updated.', response.status === 401 ? 401 : 502);
}

// A file (PDF) of the visitor's own, such as a certificate or the transcript, passed through with their token.
export async function readFileAs(token, service, path, { fetcher = fetch } = {}) {
  if (service !== 'learning' || !path || path.startsWith('/') || path.includes('://') || path.includes('..')) throw new ServiceError('Invalid service request.', 400);
  const response = await fetcher(`${connection[service]}/${path}`, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(30000), headers: { 'Client-Id': connection.clientId, Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new ServiceError(response.status === 401 ? 'Sign in to continue.' : response.status === 404 ? 'This file was not found.' : 'The file is not available right now.', response.status === 401 ? 401 : response.status === 404 ? 404 : 502);
  return { body: Buffer.from(await response.arrayBuffer()), type: response.headers.get('content-type') || 'application/pdf' };
}
export const downloadName = (name, fallback = 'download') => `${String(name || fallback).replace(/[^\p{L}\p{N} _.-]+/gu, '').trim().slice(0, 120) || fallback}.pdf`;
