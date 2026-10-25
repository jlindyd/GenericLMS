import { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack, styled } from '@mui/material';
import Layout from '../components/Layout';
import MyCourseCard from '../components/MyCourseCard';
import { CourseGrid } from '../components/CourseCard';
import { PillLabel } from '../components/PillLabel';
import FilterMenu from '../components/FilterMenu';
import Pager from '../components/Pager';
import BadgesTab from '../components/BadgesTab';
import ShareDialog from '../components/ShareDialog';
import PageNotice from '../components/PageNotice';
import { resolveLocale } from '../platform/config';
import { translate, translateCount } from '../platform/i18n';
import { TABS, loadDashboard, selectedTab } from '../platform/dashboard';
import { loadAlert } from '../platform/alerts';
import { isSignInRequired, requireSession, signInRedirect } from '../platform/session';
import { failureProps } from '../platform/catalogue';

// "My dashboard" of a signed-in visitor: the courses in progress, completed, coached and archived, and the badges, with search and paging.
// Everything is read on the server from the address (tab, page, search text, course type), as the existing site's dashboard does.
export async function getServerSideProps(context) {
  const { res, query } = context;
  const locale = resolveLocale(Array.isArray(query.lang) ? query.lang[0] : query.lang);
  const session = await requireSession(context);
  if (session.redirect) return session;
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const [data, alert] = await Promise.all([loadDashboard(session.token, query, locale), loadAlert(locale)]);
    // A visitor who only coaches lands on the coach courses tab (when the address names no filter).
    const plain = !['courseFilter', 'traineeStatus', 'courseStatus', 'showBadges'].some(key => query[key]);
    if (plain && data.counts.inProgress === 0 && data.counts.completed === 0 && data.counts.coach !== 0) return { redirect: { destination: `/dashboard?${locale === 'en' ? '' : `lang=${locale}&`}courseFilter=coachCourses&page=1`, permanent: false } };
    return { props: { ...data, alert } };
  } catch (error) {
    if (isSignInRequired(error)) return signInRedirect(context.resolvedUrl, locale);
    res.statusCode = 502;
    return { props: failureProps(error, { locale }) };
  }
}

const Search = styled('div')(({ theme }) => ({ width: '18vw', [theme.breakpoints.down('lg')]: { width: '25vw' }, [theme.breakpoints.down('md')]: { width: '35vw' }, [theme.breakpoints.down('sm')]: { width: '85vw' } }));
const Frame = styled('section')(({ theme }) => ({
  display: 'flex', width: '100%', margin: '0 auto', maxWidth: 450, flexDirection: 'column', gap: 20,
  [theme.breakpoints.down('md')]: { padding: '0 8px' }, [theme.breakpoints.between('md', 'lg')]: { maxWidth: 730 }, [theme.breakpoints.up('lg')]: { maxWidth: 1090 }, [theme.breakpoints.up('xl')]: { maxWidth: 1200 },
}));
const Message = styled('div')({ display: 'flex', marginTop: 'var(--space)', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', fontSize: '2.5rem', color: 'var(--text-color)', '& p': { marginLeft: '1rem', color: 'var(--primary-color)' } });

const PAGE_SIZE = 12, ARCHIVED_PAGE_SIZE = 50;

// Address of a tab or page of this dashboard (keeps the language; a new tab or search starts at page 1).
const link = (locale, params) => {
  const query = new URLSearchParams();
  if (locale !== 'en') query.set('lang', locale);
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') query.set(key, String(value)); });
  return `/dashboard?${query}`;
};

export default function Dashboard({ locale, tab, page, search, type, courses = [], total = 0, badges = [], counts = {}, hasArchived, completedExist, showTypeFilter, alert = null, message }) {
  const t = key => translate(locale, 'DashboardPage', key);
  const [shared, setShared] = useState('');
  const form = useRef(null), timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (message) return <PageNotice locale={locale} message={message} />;
  const onlyCoaching = counts.inProgress === 0 && counts.completed === 0 && counts.coach !== 0;
  const tabs = [
    !onlyCoaching && { key: TABS.inProgress, label: translate(locale, 'common', 'inProgress'), params: {} },
    !onlyCoaching && { key: TABS.completed, label: t('completedFilter'), params: { traineeStatus: 'finished' } },
    counts.coach !== 0 && { key: TABS.coach, label: t('coachCourses'), params: { courseFilter: 'coachCourses' } },
    { key: TABS.badges, label: t('badges'), params: { showBadges: 'true' } },
    hasArchived && { key: TABS.archived, label: t('archived'), params: { courseStatus: 'Archived' } },
  ].filter(Boolean);
  const isSearching = Boolean(search);
  const go = address => window.location.assign(address);
  const searchChanged = () => { clearTimeout(timer.current); timer.current = setTimeout(() => form.current?.requestSubmit(), 300); };
  const typeItems = [['SelfPaced', t('selfPaced')], ['CoachAssisted', t('coachAssisted')]].map(([value, label]) => ({ label, href: link(locale, { ...tabs.find(x => x.key === tab)?.params, searchText: search, type: value, page: 1 }), selected: type === value }));
  const empty = isSearching ? t('noResultsFound') : tab === TABS.inProgress ? t('noCourseInProgressMessage') : t('noCourseCompletedMessage');
  const pageSize = tab === TABS.archived ? ARCHIVED_PAGE_SIZE : PAGE_SIZE;
  const currentParams = { ...tabs.find(x => x.key === tab)?.params, searchText: search, type };
  return <Layout locale={locale} title={t('myDashboardTitle')} alert={alert}>
    <Box component="section" sx={{ display: 'flex', width: 1, mx: 'auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, justifyContent: 'space-between', p: { xs: '30px 8px', md: '30px 0' }, color: 'var(--text-color)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ display: 'flex' }}><Box component="h1" sx={{ fontSize: theme => ({ xs: theme.typography.h4.fontSize, md: theme.typography.h3.fontSize }), fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', m: 0 }}>{t('myDashboardTitle')}</Box></div>
      </div>
    </Box>

    <Frame>
      <Search>
        <form ref={form} role="search" method="get" action="/dashboard">
          {locale !== 'en' && <input type="hidden" name="lang" value={locale} />}
          {Object.entries(tabs.find(x => x.key === tab)?.params || {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          {type && <input type="hidden" name="type" value={type} />}
          <input type="hidden" name="page" value="1" />
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <input name="searchText" type="search" defaultValue={search} onChange={searchChanged} maxLength={200} placeholder={t('searchMyCourses')} aria-label={t('searchMyCourses')} className="focus-container"
              style={{ color: 'inherit', border: '1px solid #000', borderRadius: 8, padding: '10px 44px 10px 10px', letterSpacing: 0, fontSize: 15, width: '100%' }} />
          </div>
        </form>
      </Search>

      {completedExist && <Button variant="containedSecondary" href="/api/transcript" aria-label={t('transcript')} sx={{ alignSelf: 'flex-start', fontWeight: 500 }}>{t('transcript')}</Button>}

      <section style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Stack component="fieldset" spacing={4} direction="row" flexWrap="wrap" rowGap={4} sx={{ border: 'none', margin: 0, padding: 0 }}>
          {tabs.map(item => <PillLabel key={item.key} selected={item.key === tab}><input type="radio" name="dashboard-tabs" checked={item.key === tab} onChange={() => go(link(locale, { ...item.params, page: 1 }))} />{item.label}</PillLabel>)}
        </Stack>
        <section>{!isSearching && tab === TABS.inProgress && showTypeFilter && <FilterMenu label={t('courseType')} items={typeItems} />}</section>
      </section>

      {type && <Message as="h2">{`${type === 'SelfPaced' ? t('selfPaced') : t('coachAssisted')} ${t('courseText')}`}</Message>}
      {isSearching && total > 0 && tab !== TABS.badges && <Message>{translateCount(locale, 'SearchedCoursesPage', 'resultFor', total)}<p>{search}</p></Message>}

      {tab === TABS.badges ? <BadgesTab badges={badges} locale={locale} />
        : courses.length === 0 ? <Message>{empty}</Message>
        : <CourseGrid>{courses.map(course => <MyCourseCard key={`${tab}-${course.id}`} course={course} locale={locale} dashboard coach={course.isCoach} onShare={setShared} />)}</CourseGrid>}
    </Frame>

    {tab !== TABS.badges && total > 0 && <div style={{ display: 'flex', justifyContent: 'center' }}><div className="wrapper" style={{ justifyContent: 'center' }}><Pager totalItems={total} pageSize={pageSize} maxPages={5} current={page} hrefFor={target => link(locale, { ...currentParams, page: target })} /></div></div>}
    <ShareDialog url={shared} onClose={() => setShared('')} locale={locale} />
  </Layout>;
}
