import { Button } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import Layout from '../components/Layout';
import BannerCarousel from '../components/BannerCarousel';
import CmsContent from '../components/CmsContent';
import HighlightedSection from '../components/HighlightedSection';
import ExploreCourses from '../components/ExploreCourses';
import HomeSection from '../components/HomeSection';
import HomeSuccessStories from '../components/HomeSuccessStories';
import HomeNews from '../components/HomeNews';
import { cmsBindings, cmsFeeds, connection, resolveLocale } from '../platform/config';
import { translate } from '../platform/i18n';
import { feedPath, pagePath, readService, ServiceError } from '../platform/server';
import { categoriesPath, categoryItem, courseCard, coursesPath, readLearning } from '../platform/learning';
import { cleanPage } from '../platform/sanitize';
import { loadAlert } from '../platform/alerts';

// Public home, built so far from the CMS only: campaign banners, "about us", statistics, partners, and "Start today".
// Also "Explore our courses" (Learning API), the success stories highlight and the news strip (CMS feeds).
const read = (path, locale) => readService('cms', pagePath(path, locale)).then(cleanPage).catch(() => null);

// Only the fields the blocks show go to the browser.
const storyCard = ({ path, author, description, featuredImageUrl }) => ({ path, author: author ?? null, description: description ?? null, featuredImageUrl: featuredImageUrl ?? null });
const newsCard = ({ path, heading, publishDate, description, featuredImageUrl }) => ({ path, heading: heading ?? '', publishDate: publishDate ?? null, description: description ?? null, featuredImageUrl: featuredImageUrl ?? null });

export async function getServerSideProps({ query, res }) {
  const locale = resolveLocale(query.lang);
  try {
    const feed = await readService('cms', feedPath(cmsFeeds.bannersBeforeLogin, locale));
    // The list gives paths only, so each banner is requested in full. A banner that fails is skipped, as on the current site.
    const [loaded, about, statistics, partners] = await Promise.all([
      Promise.all((feed.results || []).map(item => read(item.path, locale).then(page => page && { path: item.path, ...page }))),
      read(cmsBindings.homeAbout, locale), read(cmsBindings.homeStatistics, locale), read(cmsBindings.homePartners, locale),
    ]);
    // One list of courses per category for the "Explore our courses" tabs. A category whose list fails just shows no courses.
    const categories = await readLearning(categoriesPath(locale)).then(list => (Array.isArray(list) ? list : []).map(categoryItem)).catch(() => []);
    const coursesByCategory = Object.fromEntries(await Promise.all(categories.map(async c => [c.id, await readLearning(coursesPath({ language: locale, categoryId: c.id, resultsPerPage: 25 })).then(r => (r.results || []).map(courseCard)).catch(() => [])])));
    // Both feeds are optional: if one fails its block is left out and the rest of the page still shows.
    const alert = await loadAlert(locale);
    const [stories, news] = await Promise.all([cmsFeeds.successStories, cmsFeeds.news].map(filter => readService('cms', feedPath(filter, locale)).then(r => r.results || []).catch(() => [])));
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { locale, banners: loaded.filter(Boolean), about, statistics, partners, categories, coursesByCategory, stories: stories.map(storyCard), news: news.slice(0, 4).map(newsCard), alert } };
  } catch (error) {
    return { props: { locale, banners: [], about: null, statistics: null, partners: null, categories: [], coursesByCategory: {}, stories: [], news: [], alert: null, message: error instanceof ServiceError ? error.message : 'The content service is unavailable. Please retry.' } };
  }
}

export default function Home({ locale, banners, about, statistics, partners, categories = [], coursesByCategory = {}, stories = [], news = [], alert = null, message }) {
  const t = (section, key) => translate(locale, section, key);
  return <Layout locale={locale} alert={alert} title={about?.title || 'Free Courses with Online Certificates | HP LIFE'} description={about?.seo?.description} keywords={about?.seo?.keywords}>
    {message && <div className="wrapper"><p role="alert">{message}</p></div>}
    <BannerCarousel banners={banners} locale={locale} />
    {about && <HomeSection><CmsContent page={about} id="home-about" /></HomeSection>}
    {statistics && <HomeSection bgcolor="#f3f3f3"><CmsContent page={statistics} id="home-statistics" /></HomeSection>}
    {categories.length > 0 && <HomeSection sx={{ mt: '8rem', mb: '8rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1rem 2rem' }}>
        <h2 style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.5, margin: 0, maxWidth: '100%', textAlign: 'center' }}>{t('HomePage', 'exploreOurCourses')}</h2>
        <p style={{ fontSize: '1.6rem', textAlign: 'center', lineHeight: 1.5, margin: 0, marginTop: '0.5rem', padding: '0 3rem' }}>{t('HomePage', 'exploreOurCoursesDescription')}</p>
      </div>
      <div style={{ display: 'flex', width: '100%', marginTop: 0, flexDirection: 'column', justifyContent: 'space-between' }}>
        <ExploreCourses categories={categories} coursesByCategory={coursesByCategory} locale={locale} />
        <Button variant="containedPrimary" size="large" sx={{ alignSelf: 'center' }} href={`/allcourses?${locale === 'en' ? '' : `lang=${locale}&`}page=1`}>{t('HomePage', 'exploreAllCourses')}</Button>
      </div>
    </HomeSection>}
    <HomeSuccessStories stories={stories} locale={locale} />
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
    <HomeNews news={news} locale={locale} />
  </Layout>;
}
