import Layout from '../components/Layout';
import PageHeading from '../components/PageHeading';
import PasswordForm from '../components/PasswordForm';
import PageNotice from '../components/PageNotice';
import { resolveLocale } from '../platform/config';
import { translate } from '../platform/i18n';
import { readAs, isSignInRequired, requireSession, signInRedirect } from '../platform/session';
import { failureProps } from '../platform/catalogue';

// ChangePassword for the signed-in visitor. The email address is only shown in the hint about what a password must contain.
export async function getServerSideProps(context) {
  const { res, query } = context;
  const locale = resolveLocale(Array.isArray(query.lang) ? query.lang[0] : query.lang);
  const session = await requireSession(context);
  if (session.redirect) return session;
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const user = await readAs(session.token, 'identity', 'api/account/userinfo').catch(error => { if (isSignInRequired(error)) throw error; return null; });
    return { props: { locale, email: (user && user.email) || '' } };
  } catch (error) {
    if (isSignInRequired(error)) return signInRedirect(context.resolvedUrl, locale);
    res.statusCode = 502;
    return { props: failureProps(error, { locale }) };
  }
}

export default function ChangePasswordPage({ locale, email, message }) {
  if (message) return <PageNotice locale={locale} message={message} />;
  const title = translate(locale, 'ChangePasswordPage', 'formTitle');
  return <Layout locale={locale} title={title}><PageHeading title={title} /><PasswordForm locale={locale} email={email} creating={false} /></Layout>;
}
