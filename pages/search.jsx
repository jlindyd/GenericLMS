import { Box } from '@mui/material';
import Layout from '../components/Layout';
import CourseCard, { CourseGrid } from '../components/CourseCard';
import PageNotice from '../components/PageNotice';
import Pager from '../components/Pager';
import { translateCount } from '../platform/i18n';
import { failureProps, loadSearch } from '../platform/catalogue';

export async function getServerSideProps({ query, res }) {
  try {
    const props = await loadSearch(query);
    res.setHeader('Cache-Control', 'private, no-store');
    return { props };
  } catch (error) {
    res.statusCode = 502;
    return { props: failureProps(error) };
  }
}

// Search results: "<n> Results for <term>" then the matching courses, ten to a page. As on the existing site, the number
// shown is how many results are on this page.
export default function Search({ locale, page, search, categories = [], courses = [], total = 0, message }) {
  if (message) return <PageNotice locale={locale} message={message} />;
  const lang = locale === 'en' ? '' : `lang=${locale}`;
  const section = { display: 'flex', width: '100%', margin: '0 auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 } };
  return <Layout locale={locale} title="HP LIFE">
    <Box sx={{ bgcolor: 'var(--white-smoke)', color: 'var(--dark-red)' }}>
      <Box component="section" sx={{ ...section, justifyContent: 'space-between', padding: { xs: '30px 8px', md: '30px 0' } }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)' }}>
            {translateCount(locale, 'SearchedCoursesPage', 'resultFor', courses.length)}
            {search && <span style={{ color: 'var(--primary-color)', marginLeft: 'var(--sapce)' }}>{' '} {search}</span>}
          </h1>
        </div>
      </Box>
    </Box>
    <Box component="section" sx={{ ...section, justifyContent: 'center', padding: { xs: '0 1rem', sm: 0 } }}>
      <CourseGrid>{courses.map(course => <CourseCard key={course.id} course={course} categories={categories} locale={locale} showOffline={false} />)}</CourseGrid>
    </Box>
    <div className="wrapper" style={{ justifyContent: 'center' }}>
      <Pager totalItems={total} pageSize={10} maxPages={5} current={page} hrefFor={p => `/search?${[lang, `search=${encodeURIComponent(search)}`, `page=${p}`].filter(Boolean).join('&')}`} />
    </div>
  </Layout>;
}
