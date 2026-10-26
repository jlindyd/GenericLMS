import { Button } from '@mui/material';
import Layout from '../../components/Layout';
import CmsContent from '../../components/CmsContent';
import HighlightedSection from '../../components/HighlightedSection';
import PageNotice from '../../components/PageNotice';
import { StoryItem } from '../../components/ArticleListItems';
import { cmsBindings, cmsFeeds, connection, signUpHref } from '../../platform/config';
import { translate } from '../../platform/i18n';
import { feedPath, readService } from '../../platform/server';
import { loadCmsPage } from '../../platform/pages';

export const getServerSideProps = ({ query, res }) => loadCmsPage(cmsBindings.successStoriesList, query, res, async locale => {
  const feed = await readService('cms', feedPath(cmsFeeds.successStories, locale));
  return { stories: (feed.results || []).map(({ path, heading, title, description, author, featuredImageUrl }) => ({ path, heading: heading || title || '', description: description ?? null, author: author ?? null, photo: featuredImageUrl ?? null })) };
});

export default function SuccessStories({ locale, page, stories = [], message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  const t = (section, key) => translate(locale, section, key);
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <CmsContent page={page} id="success-stories-list" />
    <div className="wrapper xlg flex-column">
      {stories.map((story, i) => <div key={`${locale}_${story.path}`} style={i ? { marginTop: 'var(--space-xlg)', paddingTop: 'var(--space-xlg)', borderTop: '1px solid var(--border-color-light)' } : undefined}>
        <StoryItem heading={story.heading} quote={story.description} userName={story.author} photo={story.photo} href={`/successstories/${story.path}${locale === 'en' ? '' : `?lang=${locale}`}`} />
      </div>)}
    </div>
    <div className="desktop-only">
      <HighlightedSection title={t('SuccessStories', 'startToday')} subtitle={t('BrandProgram', 'startTodaySubTitle')}>
        <Button variant="containedPrimary" href={signUpHref(locale)}>{t('SuccessStories', 'joinNow')}</Button>
        <Button variant="outlinedPrimary" href={`${connection.reference}/allcourses?page=1`}>{t('SuccessStories', 'exploreCourses')}</Button>
      </HighlightedSection>
    </div>
  </Layout>;
}
