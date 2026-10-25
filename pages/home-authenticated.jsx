import { Box, Typography, useMediaQuery } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import Layout from '../components/Layout';
import HomeSection from '../components/HomeSection';
import DualCarousel from '../components/DualCarousel';
import CardCarousel from '../components/CardCarousel';
import MyCourseCard from '../components/MyCourseCard';
import CourseCard from '../components/CourseCard';
import CategoryCards from '../components/CategoryCards';
import BannerCarousel from '../components/BannerCarousel';
import PageNotice from '../components/PageNotice';
import { brand, resolveLocale } from '../platform/config';
import { translate } from '../platform/i18n';
import { loadAlert } from '../platform/alerts';
import { loadSignedInHome } from '../platform/home';
import { isSignInRequired, requireSession, signInRedirect } from '../platform/session';
import { failureProps } from '../platform/catalogue';

// The home page of a signed-in visitor (the public home address shows this page instead when the sign-in cookie is present):
// welcome line, "My courses", coach courses, news banners, latest courses and "Explore by categories".
// Starting or continuing a course goes to course execution, which is not part of this site yet (see components/CourseParts.jsx).
export async function getServerSideProps(context) {
  const { res, query } = context;
  const locale = resolveLocale(Array.isArray(query.lang) ? query.lang[0] : query.lang);
  const session = await requireSession(context);
  if (session.redirect) return session;
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const [home, alert] = await Promise.all([loadSignedInHome(session.token, locale), loadAlert(locale)]);
    return { props: { ...home, alert } };
  } catch (error) {
    if (isSignInRequired(error)) return signInRedirect(context.resolvedUrl, locale);
    res.statusCode = 502;
    return { props: failureProps(error, { locale }) };
  }
}

const allCoursesHref = locale => `/dashboard?${locale === 'en' ? '' : `lang=${locale}&`}page=1`;

function Header({ title, link, href }) {
  return <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', width: 1, position: 'relative', justifyContent: 'space-between', p: { md: '0 1rem' } }}>
    <h2 style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.5, margin: 0, maxWidth: '100%' }}>{title}</h2>
    {href && <a href={href} style={{ color: 'var(--link-color)', display: 'inline-flex', alignItems: 'center' }}>{link}<KeyboardArrowRight /></a>}
  </Box>;
}

export default function HomeAuthenticated({ locale, userName, myCourses = [], coachCourses = [], latestCourses = [], banners = [], categories = [], alert = null, message }) {
  const t = key => translate(locale, 'HomePage', key);
  const isTabletOrMobile = useMediaQuery(theme => theme.breakpoints.down('lg'));
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'));
  if (message) return <PageNotice locale={locale} message={message} />;
  const horizontalSolo = !isMobile, horizontalMany = !isTabletOrMobile;
  const mine = myCourses.map(course => <MyCourseCard key={course.id} course={course} locale={locale} horizontal={myCourses.length === 1 ? horizontalSolo : horizontalMany} />);
  const coaching = coachCourses.map(course => <MyCourseCard key={course.id} course={course} locale={locale} horizontal coach />);
  return <Layout locale={locale} title={brand.name} alert={alert}>
    <Box component="section" sx={{ display: 'flex', width: 1, mx: 'auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, p: '20px 0', justifyContent: { xs: 'center', md: 'flex-start' } }}>
      <div><h1 style={{ fontSize: 25, fontWeight: 400, lineHeight: '30px', margin: 0 }}>{`${t('welcome')}, ${userName}!`}</h1></div>
    </Box>

    {myCourses.length > 0 && <HomeSection bgcolor="#f3f3f3" sx={{ padding: '5rem 0 64px 0' }}>
      <Header title={t('myCourses')} link={t('allMyCourses')} href={allCoursesHref(locale)} />
      <Box sx={{ display: 'flex', width: 1, mt: '2rem', flexDirection: 'column', justifyContent: 'space-between' }}><DualCarousel label={t('myCourses')}>{mine}</DualCarousel></Box>
    </HomeSection>}

    {coachCourses.length > 0 && <HomeSection bgcolor="var(--body-bg-light)">
      <Header title={t('coachCourses')} link={t('allMyCourses')} href={`${allCoursesHref(locale)}&courseFilter=coachCourses`} />
      <Box sx={{ display: 'flex', width: 1, mt: '2rem', flexDirection: 'column' }}>
        {coachCourses.length <= 2 ? <Box sx={{ display: 'grid', gap: '2rem', gridTemplateColumns: { md: 'repeat(2, 1fr)' } }}>{coaching}</Box> : <CardCarousel variant="latest" label={t('coachCourses')}>{coaching}</CardCarousel>}
      </Box>
    </HomeSection>}

    {banners.length > 0 && <HomeSection sx={{ mt: '8rem' }}>
      <Box sx={{ display: 'flex', width: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}><h2 style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.5, margin: 0, maxWidth: '100%' }}>{translate(locale, 'BrandProgram', 'newsBannerSection')}</h2></Box>
      <Box sx={{ display: 'flex', width: 1, mt: '4rem', flexDirection: 'column' }}><BannerCarousel banners={banners} locale={locale} after label={translate(locale, 'BrandProgram', 'newsBannerSection')} /></Box>
    </HomeSection>}

    {latestCourses.length > 0 && <HomeSection sx={{ padding: '8rem 0' }}>
      <Header title={t('latestCoursesTitle')} link={t('allMyCourses')} href={allCoursesHref(locale)} />
      <Box sx={{ display: 'flex', width: 1, mt: '2rem', flexDirection: 'column' }}><CardCarousel variant="latest" label={t('latestCoursesTitle')}>{latestCourses.map(course => <CourseCard key={course.id} course={course} categories={categories} locale={locale} signedIn />)}</CardCarousel></Box>
    </HomeSection>}

    {categories.length > 0 && <HomeSection sx={{ mb: '8rem' }}>
      <Header title={t('explorebyCategories')} link={t('exploreAllCategories')} href={`/allcourses?${locale === 'en' ? '' : `lang=${locale}&`}page=1`} />
      <Box sx={{ display: 'flex', width: 1, mt: '4rem', flexDirection: 'column', p: { lg: '0 1rem' } }}><CategoryCards categories={categories} locale={locale} gap="0.25rem" /></Box>
    </HomeSection>}
  </Layout>;
}
