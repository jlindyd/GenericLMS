import Layout from '../../components/Layout';
import CmsContent from '../../components/CmsContent';
import PageNotice from '../../components/PageNotice';
import { BlogPost } from '../../components/ArticleListItems';
import { cmsBindings, cmsFeeds } from '../../platform/config';
import { feedPath, readService } from '../../platform/server';
import { loadCmsPage } from '../../platform/pages';

// News = the CMS "news-list-page" banner, then the news articles (attribute featureScope=news), newest first.
export const getServerSideProps = ({ query, res }) => loadCmsPage(cmsBindings.newsList, query, res, async locale => {
  const feed = await readService('cms', feedPath(cmsFeeds.news, locale));
  return { articles: (feed.results || []).map(({ path, heading, title, publishDate, description, featuredImageUrl }) => ({ path, heading: heading || title || '', publishDate: publishDate ?? null, description: description ?? null, image: featuredImageUrl ?? null })) };
});

export default function News({ locale, page, articles = [], message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <CmsContent page={page} id="news-list" />
    <div className="wrapper xlg flex-column">
      {articles.map(article => <div key={`${locale}_${article.path}`} className="news-item">
        <BlogPost heading={article.heading} publishDate={article.publishDate} description={article.description} image={article.image} href={`/news/${article.path}${locale === 'en' ? '' : `?lang=${locale}`}`} locale={locale} />
      </div>)}
    </div>
  </Layout>;
}
