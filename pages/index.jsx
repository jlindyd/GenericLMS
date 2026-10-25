import { Button } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import Layout from '../components/Layout';
import BannerCarousel from '../components/BannerCarousel';
import CmsContent from '../components/CmsContent';
import HighlightedSection from '../components/HighlightedSection';
import HomeSection from '../components/HomeSection';
import { cmsBindings, cmsFeeds, connection, resolveLocale } from '../platform/config';
import { translate } from '../platform/i18n';
import { feedPath, pagePath, readService, ServiceError } from '../platform/server';
import { cleanPage } from '../platform/sanitize';

// Public home, built so far from the CMS only: campaign banners, "about us", statistics, partners, and "Start today".
// Still to come: "Explore our courses" (Learning API), the success stories highlight, and the news strip.
const read = (path, locale) => readService('cms', pagePath(path, locale)).then(cleanPage).catch(() => null);

export async function getServerSideProps({ query, res }) {
  const locale = resolveLocale(query.lang);
  try {
    const feed = await readService('cms', feedPath(cmsFeeds.bannersBeforeLogin, locale));
    // The list gives paths only, so each banner is requested in full. A banner that fails is skipped, as on the current site.
    const [loaded, about, statistics, partners] = await Promise.all([
      Promise.all((feed.results || []).map(item => read(item.path, locale).then(page => page && { path: item.path, ...page }))),
      read(cmsBindings.homeAbout, locale), read(cmsBindings.homeStatistics, locale), read(cmsBindings.homePartners, locale),
    ]);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { locale, banners: loaded.filter(Boolean), about, statistics, partners } };
  } catch (error) {
    return { props: { locale, banners: [], about: null, statistics: null, partners: null, message: error instanceof ServiceError ? error.message : 'The content service is unavailable. Please retry.' } };
  }
}

export default function Home({ locale, banners, about, statistics, partners, message }) {
  const t = (section, key) => translate(locale, section, key);
  return <Layout locale={locale} title={about?.title || 'Free Courses with Online Certificates | HP LIFE'} description={about?.seo?.description} keywords={about?.seo?.keywords}>
    {message && <div className="wrapper"><p role="alert">{message}</p></div>}
    <BannerCarousel banners={banners} locale={locale} />
    {about && <HomeSection><CmsContent page={about} id="home-about" /></HomeSection>}
    {statistics && <HomeSection bgcolor="#f3f3f3"><CmsContent page={statistics} id="home-statistics" /></HomeSection>}
    {partners && <section style={{ padding: '75px 0' }}>
      <CmsContent page={partners} id="home-partners" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <a href={`/partners${locale === 'en' ? '' : `?lang=${locale}`}`} style={{ color: 'var(--link-color)', display: 'inline-flex', alignItems: 'center' }}>{t('HomePage', 'seeAllPartners')}<KeyboardArrowRight sx={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} /></a>
      </div>
    </section>}
    <HighlightedSection title={t('HomePage', 'startToday')} subtitle={t('BrandProgram', 'startTodaySubTitle')}>
      <Button variant="containedPrimary" href={`${connection.auth}/${locale}/signup`}>{t('HomePage', 'joinNow')}</Button>
      <Button variant="outlinedPrimary" href={`${connection.reference}/allcourses?page=1`}>{t('HomePage', 'exploreCourses')}</Button>
    </HighlightedSection>
  </Layout>;
}
