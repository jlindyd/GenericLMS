import { Button } from '@mui/material';
import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import HighlightedSection from '../components/HighlightedSection';
import PageNotice from '../components/PageNotice';
import { cmsBindings, connection } from '../platform/config';
import { translate } from '../platform/i18n';
import { loadCmsPage } from '../platform/pages';

export const getServerSideProps = ({ query, res }) => loadCmsPage(cmsBindings.partners, query, res);

// Partners = the CMS body, then the "Start today" call to action (hidden below the tablet width, as on the existing site).
export default function Partners({ locale, page, message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  const t = (section, key) => translate(locale, section, key);
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <CmsContent page={page} id="partners" />
    <div className="desktop-only">
      <HighlightedSection title={t('Partners', 'startToday')} subtitle={t('BrandProgram', 'startTodaySubTitle')}>
        <Button variant="containedPrimary" href={`${connection.auth}/${locale}/signup`}>{t('Partners', 'joinNow')}</Button>
        <Button variant="outlinedPrimary" href={`${connection.reference}/allcourses?page=1`}>{t('Partners', 'exploreCourses')}</Button>
      </HighlightedSection>
    </div>
  </Layout>;
}
