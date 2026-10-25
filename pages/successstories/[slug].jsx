import Layout from '../../components/Layout';
import CmsContent from '../../components/CmsContent';
import PageNotice from '../../components/PageNotice';
import ShareButtons from '../../components/ShareButtons';
import TestimonialCarousel from '../../components/TestimonialCarousel';
import { cmsFeeds, connection } from '../../platform/config';
import { translate } from '../../platform/i18n';
import { feedPath, readService } from '../../platform/server';
import { loadCmsPage } from '../../platform/pages';

const valid = slug => /^[a-z0-9-]{1,200}$/.test(slug);

// A success story = its CMS page, share buttons, then the other stories as cards (stories without a photo or text are left out).
export const getServerSideProps = ({ params, query, res }) => {
  if (!valid(params.slug)) { res.statusCode = 404; return { props: { locale: 'en', page: null, message: 'This content is not available.' } }; }
  return loadCmsPage(params.slug, query, res, async locale => {
    const stories = await readService('cms', feedPath(cmsFeeds.successStories, locale)).then(feed => feed.results || []).catch(() => []);
    return { slug: params.slug, stories: stories.map(({ path, author, description, featuredImageUrl }) => ({ path, author: author ?? null, description: description ?? null, featuredImageUrl: featuredImageUrl ?? null })) };
  });
};

export default function SuccessStory({ locale, page, slug, stories = [], message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  const url = `${connection.reference}/${locale}/successstories/${slug}`;
  const t = key => translate(locale, 'BrandProgram', key);
  const body = [t('articleMailSubject').replace('{link}', url), t('articleMailMessage'), t('articleMailMessage2')].join('\r\n\r\n');
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords} image={page.featuredImageUrl}>
    <CmsContent page={page} id="success-story" />
    <div className="wrapper smallWidth flex-column">
      <ShareButtons url={url} xText={`See this ${url}`} mailSubject={locale === 'ar' ? t('brand') : t('articleMailSubject').replace('{link}', url)} mailBody={body} locale={locale} />
    </div>
    <TestimonialCarousel stories={stories} locale={locale} padTop />
  </Layout>;
}
