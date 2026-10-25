import { Box, Typography } from '@mui/material';
import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import CategoryCards from '../components/CategoryCards';
import CourseCard, { CourseGrid } from '../components/CourseCard';
import FilterMenu from '../components/FilterMenu';
import PageNotice from '../components/PageNotice';
import Pager from '../components/Pager';
import { translate } from '../platform/i18n';
import { failureProps, loadAllCourses, RESULTS_PER_PAGE } from '../platform/catalogue';

export async function getServerSideProps({ query, res }) {
  try {
    const props = await loadAllCourses(query);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props };
  } catch (error) {
    res.statusCode = error.status === 404 ? 404 : 502;
    return { props: failureProps(error) };
  }
}

// All courses = the CMS introduction, "Explore by categories", then the course cards with Category and Sort by filters and page numbers.
export default function AllCourses({ locale, page, categoryId, sortBy, cms, categories = [], courses = [], total = 0, message }) {
  if (message) return <PageNotice locale={locale} message={message} />;
  const t = key => translate(locale, 'AllCourses', key);
  const lang = locale === 'en' ? '' : `lang=${locale}`;
  const href = (changes = {}) => {
    const next = { categoryId, sortBy, page: 1, ...changes };
    const q = [lang, next.categoryId ? `categoryId=${next.categoryId}` : '', next.sortBy ? `sortBy=${next.sortBy}` : '', next.page > 1 ? `page=${next.page}` : 'page=1'].filter(Boolean).join('&');
    return `/allcourses?${q}`;
  };
  return <Layout locale={locale} title={cms?.title || 'All courses | HP LIFE'} description={cms?.seo?.description} keywords={cms?.seo?.keywords}>
    {cms && <CmsContent page={cms} id="all-courses" />}
    <Box sx={{ width: 1, bgcolor: '#f3f3f3', padding: '0 16px' }}>
      <Box component="section" sx={{ display: 'flex', width: '100%', margin: '0 auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, flexDirection: 'column', gap: '3rem', alignItems: 'center', padding: '40px 0' }}>
        <Typography variant="h3" component="h2" sx={{ fontWeight: theme => theme.typography.fontWeightMedium, fontSize: '32px' }}>{t('explorebyCategories')}</Typography>
        <CategoryCards categories={categories} locale={locale} />
      </Box>
    </Box>
    <Box sx={{ width: 1, bgcolor: '#f3f3f3' }}>
      <Box component="section" sx={{ display: 'flex', width: '100%', margin: '0 auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, flexDirection: 'column', alignItems: 'flex-start', padding: '50px 16px', color: 'text.primary' }}>
        <Box sx={{ display: 'flex', width: '100%', mt: '2rem', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ mb: 'var(--space)', mt: '-3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 1 }}>
            <FilterMenu label={t('category')} items={categories.map(c => ({ label: c.name, href: href({ categoryId: c.id }), selected: c.id === categoryId }))} />
            <FilterMenu label={t('sortBy')} items={[{ label: t('newest'), href: href({ sortBy: 'newest' }), selected: sortBy === 'newest' }, { label: t('mostPopular'), href: href({ sortBy: 'mostPopular' }), selected: sortBy === 'mostPopular' }]} />
          </Box>
          <CourseGrid>{courses.map(course => <CourseCard key={course.id} course={course} categories={categories} locale={locale} />)}</CourseGrid>
        </Box>
      </Box>
    </Box>
    <Box sx={{ bgcolor: '#f3f3f3' }}><div className="wrapper pb-lg" style={{ justifyContent: 'center', paddingTop: 0 }}><Pager totalItems={total} pageSize={RESULTS_PER_PAGE} maxPages={5} current={page} hrefFor={p => href({ page: p })} /></div></Box>
  </Layout>;
}
