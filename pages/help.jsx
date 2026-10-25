import { Button } from '@mui/material';
import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import PageNotice from '../components/PageNotice';
import { cmsBindings, connection } from '../platform/config';
import { translate } from '../platform/i18n';
import { loadCmsPage } from '../platform/pages';

export const getServerSideProps = ({ query, res }) => loadCmsPage(cmsBindings.help, query, res);

// Help = the CMS topics, then "Do you have any other questions?". The support form (it sends a message) is not built yet,
// so the button opens the form on the current learner site.
export default function Help({ locale, page, message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  const t = key => translate(locale, 'HelpPage', key);
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <section><CmsContent page={page} id="help" /></section>
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '20px', textAlign: 'center' }}>
      <p style={{ fontSize: '1.25rem' }}>{t('doYouHaveAnyOtherQn')}</p>
      <Button variant="containedPrimary" size="small" sx={{ borderRadius: '4px' }} href={`${connection.reference}/help`}>{t('sendMessage')}</Button>
    </section>
  </Layout>;
}
