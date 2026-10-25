import { connection, locales, resolveLocale } from './config.js';
import { readAs } from './session.js';

// The visitor's profile for the profile pages (the existing site's initialProps/profile and useLoadAccountInfo): their details, the
// newsletter setting, and whether they sign in with a password of their own (decides "Change password" or "Create password").
const soft = promise => promise.catch(() => null);

export async function loadProfile(token, localeValue) {
  const locale = resolveLocale(localeValue);
  const returnUrl = `${connection.auth}/${locale}/oauth2callback`;
  const [profile, settings, login] = await Promise.all([
    readAs(token, 'identity', 'api/account/profile'),
    soft(readAs(token, 'emailmarketing', 'Account/settings')),
    soft(readAs(token, 'identity', `api/account/manageinfo?${new URLSearchParams({ returnUrl, generateState: 'true' })}`)),
  ]);
  return {
    locale,
    profile: {
      fullName: profile.fullName ?? '', email: profile.email ?? '', emailConfirmed: !!profile.emailConfirmed,
      language: locales.includes(profile.language) ? profile.language : 'en', timeZone: profile.timeZone ?? '', country: profile.country ?? null, gender: profile.gender ?? null,
      isSubscribed: !!(settings && settings.isSubscribed),
    },
    // A failed lookup counts as "no password of their own", as on the existing site.
    hasPassword: !!(login && Array.isArray(login.logins) && login.logins.some(entry => entry.loginProvider === login.localLoginProvider)),
  };
}
