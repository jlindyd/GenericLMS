import Layout from '../components/Layout';
import BannerCarousel from '../components/BannerCarousel';
import { resolveLocale } from '../platform/config';
import { feedPath, pagePath, readService, ServiceError } from '../platform/server';
import { cleanPage } from '../platform/sanitize';

// Public home, first slice: the campaign banners (CMS feature scope news-banners-before-login). Other home sections come later.
export async function getServerSideProps({ query, res }) {
  const locale = resolveLocale(query.lang);
  try {
    const feed = await readService('cms', feedPath('news-banners-before-login', locale));
    // The list gives paths only, so each banner is requested in full. A banner that fails is skipped, as on the current site.
    const loaded = await Promise.all((feed.results || []).map(item => readService('cms', pagePath(item.path, locale)).then(page => ({ path: item.path, ...cleanPage(page) })).catch(() => null)));
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { locale, banners: loaded.filter(Boolean) } };
  } catch (error) {
    return { props: { locale, banners: [], message: error instanceof ServiceError ? error.message : 'The content service is unavailable. Please retry.' } };
  }
}

export default function Home({ locale, banners, message }) {
  return <Layout locale={locale} title="Free Courses with Online Certificates | HP LIFE">
    {message && <div className="wrapper"><p role="alert">{message}</p></div>}
    <BannerCarousel banners={banners} locale={locale} />
  </Layout>;
}
