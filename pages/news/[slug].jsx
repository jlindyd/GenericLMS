import Layout from '../../components/Layout';
import CmsContent from '../../components/CmsContent';
import PageNotice from '../../components/PageNotice';
import ShareButtons from '../../components/ShareButtons';
import { connection } from '../../platform/config';
import { translate } from '../../platform/i18n';
import { loadCmsPage } from '../../platform/pages';

const valid = slug => /^[a-z0-9-]{1,200}$/.test(slug);

export const getServerSideProps = ({ params, query, res }) => {
  if (!valid(params.slug)) { res.statusCode = 404; return { props: { locale: 'en', page: null, message: 'This content is not available.' } }; }
  return loadCmsPage(params.slug, query, res, () => ({ slug: params.slug }));
};

export default function NewsArticle({ locale, page, slug, message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  const url = `${connection.reference}/${locale}/news/${slug}`;
  const t = key => translate(locale, 'BrandProgram', key);
  const body = [t('articleMailSubject').replace('{link}', url), t('articleMailMessage'), t('articleMailMessage2')].join('\r\n\r\n');
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords} image={page.featuredImageUrl}>
    <CmsContent page={page} id="news-article" />
    {page.content && <div className="wrapper smallWidth flex-column">
      <ShareButtons url={url} xText={`See this ${url}`} mailSubject={locale === 'ar' ? t('brand') : t('articleMailSubject').replace('{link}', url)} mailBody={body} locale={locale} />
    </div>}
  </Layout>;
}
