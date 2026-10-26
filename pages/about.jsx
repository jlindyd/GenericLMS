import { Button } from '@mui/material';
import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import TestimonialCarousel from '../components/TestimonialCarousel';
import HighlightedSection from '../components/HighlightedSection';
import { resolveLocale, cmsBindings, connection, signUpHref } from '../platform/config';
import { translate } from '../platform/i18n';
import { feedPath, pagePath, readService, ServiceError } from '../platform/server';
import { cleanPage } from '../platform/sanitize';

// About = the CMS "about-page" body, then the success stories carousel (feature scope success-stories), then "Start today".
export async function getServerSideProps({ query, res }) {
  const locale = resolveLocale(query.lang);
  try {
    const [page, stories] = await Promise.all([
      readService('cms', pagePath(cmsBindings.about, locale)),
      // Stories are optional: if the list fails the page still shows its main content.
      readService('cms', feedPath('success-stories', locale)).then(feed => feed.results || []).catch(() => []),
    ]);
    // Same freshness the existing site uses (about one minute).
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { locale, page: cleanPage(page), stories: stories.map(({ path, author, description, featuredImageUrl }) => ({ path, author: author ?? null, description: description ?? null, featuredImageUrl: featuredImageUrl ?? null })) } };
  } catch (error) {
    res.statusCode = error instanceof ServiceError && error.status === 404 ? 404 : 502;
    return { props: { locale, page: null, stories: [], message: error instanceof ServiceError ? error.message : 'The content service is unavailable. Please retry.' } };
  }
}

export default function About({ locale, page, stories, message }) {
  if (!page) return <Layout locale={locale} title="HP LIFE"><div className="wrapper flex-column"><h1>{message}</h1></div></Layout>;
  const t = (section, key) => translate(locale, section, key);
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <CmsContent page={page} id="about" />
    <TestimonialCarousel stories={stories} locale={locale} />
    <HighlightedSection title={t('Aboutus', 'startToday')} subtitle={t('BrandProgram', 'startTodaySubTitle')}>
      <Button variant="containedPrimary" href={signUpHref(locale)}>{t('Aboutus', 'joinNow')}</Button>
      <Button variant="outlinedPrimary" href={`${connection.reference}/allcourses?page=1`}>{t('Aboutus', 'exploreCourses')}</Button>
    </HighlightedSection>
  </Layout>;
}
