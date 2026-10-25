import Layout from '../components/Layout';
import EditProfileForm from '../components/EditProfileForm';
import PageNotice from '../components/PageNotice';
import { resolveLocale } from '../platform/config';
import { translate } from '../platform/i18n';
import { loadProfile } from '../platform/profile';
import { isSignInRequired, requireSession, signInRedirect } from '../platform/session';
import { failureProps } from '../platform/catalogue';

// "Edit Profile" of the signed-in visitor.
export async function getServerSideProps(context) {
  const { res, query } = context;
  const locale = resolveLocale(Array.isArray(query.lang) ? query.lang[0] : query.lang);
  const session = await requireSession(context);
  if (session.redirect) return session;
  res.setHeader('Cache-Control', 'private, no-store');
  try { return { props: await loadProfile(session.token, locale) }; } catch (error) {
    if (isSignInRequired(error)) return signInRedirect(context.resolvedUrl, locale);
    res.statusCode = 502;
    return { props: failureProps(error, { locale }) };
  }
}

export default function EditProfile({ locale, profile, message }) {
  if (message) return <PageNotice locale={locale} message={message} />;
  return <Layout locale={locale} title={translate(locale, 'BasePageContainer', 'editprofileTitle')}><EditProfileForm locale={locale} profile={profile} /></Layout>;
}
