import { Box, Typography } from '@mui/material';
import Layout from '../../components/Layout';
import CategoryCards from '../../components/CategoryCards';
import CategoryHeader from '../../components/CategoryHeader';
import CourseCard, { CourseGrid } from '../../components/CourseCard';
import PageNotice from '../../components/PageNotice';
import Pager from '../../components/Pager';
import { translate } from '../../platform/i18n';
import { idFromSlug } from '../../platform/learning';
import { failureProps, loadCategoryCourses, RESULTS_PER_PAGE } from '../../platform/catalogue';

export async function getServerSideProps({ params, query, res }) {
  try {
    const props = await loadCategoryCourses(idFromSlug(params.slug), query);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props };
  } catch (error) {
    res.statusCode = error.status === 404 || error.status === 400 ? 404 : 502;
    return { props: failureProps(error, { message: res.statusCode === 404 ? 'This category was not found.' : failureProps(error).message }) };
  }
}

// One category = a title band, its course cards with page numbers, then "Explore by categories".
export default function CategoryList({ locale, page, category, categories = [], courses = [], total = 0, message }) {
  if (message) return <PageNotice locale={locale} message={message} />;
  const lang = locale === 'en' ? '' : `lang=${locale}`;
  const section = { display: 'flex', width: '100%', margin: '0 auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 } };
  return <Layout locale={locale} title={category.seo.title || category.name} description={category.seo.description} keywords={category.seo.keywords}>
    <CategoryHeader title={category.name} description={category.description} />
    <Box sx={{ width: 1 }}>
      <Box component="section" sx={{ ...section, flexDirection: 'column', alignItems: 'flex-start', padding: '50px 16px' }}>
        <Box sx={{ display: 'flex', width: '100%', mt: '2rem', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ ...section, justifyContent: 'center' }}><CourseGrid>{courses.map(course => <CourseCard key={course.id} course={course} categories={categories} locale={locale} />)}</CourseGrid></Box>
        </Box>
      </Box>
    </Box>
    <div className="wrapper" style={{ justifyContent: 'center' }}>
      <Pager totalItems={total} pageSize={RESULTS_PER_PAGE} maxPages={5} current={page} hrefFor={p => `/categorylist/${category.id}-${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}?${[lang, `page=${p}`].filter(Boolean).join('&')}`} />
    </div>
    <Box component="section" sx={{ ...section, flexDirection: 'column', gap: '2rem', padding: '75px 0' }}>
      <Typography component="h2" variant="h2" fontSize={28} fontWeight="regular">{translate(locale, 'CategoryListPage', 'explorebyCategories')}</Typography>
      <CategoryCards categories={categories} locale={locale} />
    </Box>
  </Layout>;
}
