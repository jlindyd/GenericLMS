import { useState } from 'react';
import { Button, styled } from '@mui/material';
import { FaCertificate, FaPoll, FaRegSmile, FaRegThumbsUp, FaQuestionCircle, FaRegCalendarAlt, FaRegFile, FaStickyNote, FaUsers } from 'react-icons/fa';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import CmsContent from './CmsContent';
import HighlightedSection from './HighlightedSection';
import ShareButtons from './ShareButtons';
import { connection, signInHref } from '../platform/config';
import { fill, translate, translateCount } from '../platform/i18n';

// Course page pieces, ported from the existing site (DetailHeader, DetailBanner, DetailCard, DetailOverview, Tabs, CourseLessons).
// Visitors who are not signed in only see "Enroll", which takes them to the sign-in page.

const Header = styled('section')(({ theme }) => ({ position: 'relative', '.courseBanner': { paddingBottom: 130, [theme.breakpoints.up('md')]: { paddingBottom: 0 } } }));
const BannerWrap = styled('div')({ position: 'relative' });
const StripeContainer = styled('div')(({ theme }) => ({ position: 'absolute', top: 0, width: '100vw', height: '100%', [theme.breakpoints.up('sm')]: { minWidth: 900 }, [theme.breakpoints.up('md')]: { minWidth: 1170 } }));
const StripeBox = styled('div')(({ theme }) => ({ position: 'relative', width: '100%', height: '100%', [theme.breakpoints.up('sm')]: { position: 'absolute', bottom: 0, right: 0, width: 300 }, [theme.breakpoints.up('md')]: { width: 500 } }));
const Stripe = styled('div')(({ theme }) => { const offset = `calc(${theme.spacing(9)} + 2rem)`; return { position: 'absolute', top: 0, right: 0, width: 420, height: '100%', [theme.breakpoints.up('sm')]: { width: '100%', background: theme.palette.primary.main, clipPath: `polygon(${offset} 0%, 100% 0%, calc(100% - ${offset}) 100%, 0% 100%)`, zIndex: 5 } }; });
const Banner = styled('div')(({ theme }) => ({
  '.wrapper': { [theme.breakpoints.up('sm')]: { width: '100%', margin: `0 ${theme.spacing(4)}` }, [theme.breakpoints.between('sm', 'md')]: { maxWidth: 600 }, [theme.breakpoints.up('md')]: { marginRight: 320 }, [theme.breakpoints.between('md', 'lg')]: { maxWidth: 700 }, [theme.breakpoints.up('lg')]: { width: 'auto', margin: '0 auto !important', paddingRight: 485 } },
}));
const BannerInner = styled('div')({ display: 'flex', width: '100%', position: 'relative', overflow: 'hidden', color: 'var(--black)', background: 'var(--body-bg-light)', '.wrapper': { display: 'block', position: 'relative', height: '100%', width: '100%', zIndex: 1, '.wrapper': { padding: 0 } } });
const Crumbs = styled('ul')(({ theme }) => ({ display: 'flex', color: 'inherit', marginBottom: 'var(--space-sm)', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', [theme.breakpoints.up('md')]: { marginBottom: 'var(--space)' }, [theme.breakpoints.down('lg')]: { fontSize: 'var(--text-small)' }, 'li + li': { marginLeft: 'var(--space-sm)', paddingLeft: 'var(--space-sm)', position: 'relative', color: 'inherit', '&:before': { content: '"/"', position: 'absolute', left: 0, top: 0 } }, a: { color: 'inherit' } }));
const BannerTitle = styled('div')(({ theme }) => ({ '& > h1': { margin: 0, lineHeight: '120%', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', fontSize: '4rem', [theme.breakpoints.down('lg')]: { fontSize: '2.5rem' } } }));
const Description = styled('div')(({ theme }) => ({ marginTop: 'var(--space-sm)', [theme.breakpoints.up('md')]: { marginTop: 'var(--space)' } }));
const Buttons = styled('div')(({ theme }) => ({ display: 'flex', flexDirection: 'column', marginTop: '1rem', marginRight: '3rem', [theme.breakpoints.down('lg')]: { justifyContent: 'flex-start', alignItems: 'flex-start' }, [theme.breakpoints.down('md')]: { marginRight: 0 } }));

const Sidebar = styled('aside')({ '.wrapper': { paddingTop: 0, paddingBottom: 0, position: 'static', justifyContent: 'flex-end' } });
const SidebarContent = styled('div')(({ theme }) => ({ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', zIndex: 10, padding: '2rem 0', [theme.breakpoints.up('sm')]: { alignItems: 'center' }, [theme.breakpoints.up('md')]: { alignItems: 'center', width: 330, position: 'absolute', top: theme.spacing(6), marginTop: 0 }, [theme.breakpoints.up('lg')]: { width: 430 } }));
const CardBox = styled('article')({ background: 'var(--white)', boxShadow: 'var(--shadow-boxes)', minWidth: 320, maxWidth: 420, borderRadius: 16 });
const CardHead = styled('div')({ aspectRatio: '1', position: 'relative', width: '100%', padding: 16, '&:hover img': { transform: 'scale(1.03)' } });
const Media = styled('div')({ position: 'relative', overflow: 'hidden', height: '100%', width: '100%', borderRadius: 8, '&:after': { content: '""', display: 'block', width: '100%', height: '70%', position: 'absolute', bottom: 0, left: 0, zIndex: 1, background: 'linear-gradient(rgba(0, 0, 0, 0), var(--gray-dark))' }, img: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1s' } });
const Row = styled('li')({ display: 'flex', gap: '3rem', borderBottom: '1px solid var(--gray-white-shade)', padding: 16 });

function DetailCard({ course, subject, locale }) {
  const t = key => translate(locale, 'CoursePage', key);
  const rows = [
    [t('duration'), translate(locale, 'CoursePage', 'durationMessage').replace('{count}', '60')],
    course.type && [t('pace'), course.type === 'CoachAssisted' ? t('coachAssisted') : t('selfPaced')],
    course.published && subject && [t('subject'), subject],
    course.language && [t('language'), languageLabel(course.language, locale)],
    course.author && [t('courseAuthor'), course.author],
    course.code && [t('courseCode'), course.code],
  ].filter(Boolean);
  return <CardBox>
    <CardHead><Media>{course.imageUrl && <img src={course.imageUrl} alt="" />}</Media></CardHead>
    <ul style={{ display: 'flex', flexDirection: 'column' }}>{rows.map(([label, value]) => <Row key={label}><div style={{ minWidth: 150, overflowWrap: 'anywhere' }}>{label}</div><div style={{ display: 'inline-block', width: 'auto', overflowWrap: 'anywhere' }}>{value}</div></Row>)}</ul>
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}><EnrollButton course={course} locale={locale} fullWidth /></div>
    </div>
  </CardBox>;
}

const languageNames = { en: 'English', ar: 'العربية', es: 'Español', fr: 'Français', hi: 'हिन्दी', id: 'Bahasa Indonesia', pt: 'Português', 'zh-Hans': '简体中文' };
const languageLabel = code => languageNames[code] || code;

// Signed-out visitors: Enroll sends them to the sign-in page, then back to this course on the learner site.
export function EnrollButton({ course, locale, fullWidth }) {
  const back = `/course/${encodeURIComponent(course.slug)}?lang=${locale}`;
  return <Button variant="containedPrimary" href={signInHref(locale, back)} aria-label={translate(locale, 'CoursePage', 'enrollCourse')} sx={{ minWidth: 130, ...(fullWidth ? { width: '100%', borderRadius: '12px' } : {}) }}>{translate(locale, 'CoursePage', 'enrollCourse')}</Button>;
}

export function CourseHeader({ course, category, locale, subject }) {
  const t = key => translate(locale, 'CoursePage', key);
  const lang = locale === 'en' ? '' : `lang=${locale}`;
  return <Header>
    <BannerWrap>
      <StripeContainer><StripeBox><Stripe /></StripeBox></StripeContainer>
      <Banner>
        <BannerInner>
          <div className="wrapper">
            <div style={{ display: 'flex', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '100%', marginRight: 'var(--space-lg)' }}>
                <Crumbs>
                  <li><a href={`/allcourses?${[lang, 'page=1'].filter(Boolean).join('&')}`}>{translate(locale, 'CoursePage', 'allCourses')} </a></li>
                  {category && <li><a href={`/categorylist/${category.slug}${lang ? `?${lang}` : ''}`}>{category.name} </a></li>}
                </Crumbs>
                <BannerTitle><h1>{course.name}</h1></BannerTitle>
                <Description>{course.description}</Description>
                <Buttons><EnrollButton course={course} locale={locale} /></Buttons>
              </div>
            </div>
          </div>
        </BannerInner>
      </Banner>
    </BannerWrap>
    <Sidebar><div className="wrapper"><SidebarContent><DetailCard course={course} subject={subject} locale={locale} /></SidebarContent></div></Sidebar>
  </Header>;
}

// ---- Overview section: facts, share buttons, tabs, call to action ----
const Wrapper = styled('div')(({ theme }) => ({ background: 'var(--white)', '& > .wrapper': { flexDirection: 'column', [theme.breakpoints.up('md')]: { paddingRight: 380, '[dir=rtl] &': { paddingRight: 'var(--space-lg)', paddingLeft: 380 } }, [theme.breakpoints.up('lg')]: { paddingRight: 485, '[dir=rtl] &': { paddingRight: 0, paddingLeft: 485 } } } }));
const ListIcons = styled('ul')(({ theme }) => ({ display: 'flex', alignItems: 'center', flexDirection: 'row', [theme.breakpoints.down('sm')]: { flexDirection: 'column', alignItems: 'flex-start' }, li: { marginRight: 'var(--space-lg)', display: 'flex', alignItems: 'center', [theme.breakpoints.down('sm')]: { marginLeft: 0, marginTop: 'var(--space-xs)' } } }));
const TabList = styled('ul')({ display: 'flex', justifyContent: 'flex-start' });
const Tab = styled('li', { shouldForwardProp: p => p !== 'selected' })(({ selected }) => ({ cursor: 'pointer', borderBottom: selected ? '2px solid var(--text-color-primary)' : '', button: { cursor: 'pointer', color: selected ? 'var(--text-color-primary)' : 'var(--black)', display: 'inline-block', padding: 16, fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', border: 'none', background: 'transparent', fontSize: 'var(--text-size)' } }));
const LessonItem = styled('li')(({ theme }) => ({ borderBottom: '1px solid var(--border-color)', position: 'relative', width: '100%', padding: 'var(--space) 0', [theme.breakpoints.up('md')]: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' } }));

const taskIcon = type => ({ survey: <FaPoll size={13} />, content: <FaRegFile size={13} />, quiz: <FaQuestionCircle size={13} />, meeting: <FaRegCalendarAlt size={13} />, editableform: <FaStickyNote size={13} /> })[String(type).toLowerCase()] ?? '';

function Lessons({ lessons, locale }) {
  return <div style={{ marginBottom: 'var(--space)' }}><ul style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    {lessons.map(lesson => <LessonItem key={lesson.id}>
      <div style={{ marginBottom: 'var(--space-xs)', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', padding: 'var(--space-xs)' }}>{lesson.name}</div>
      <div style={{ gridColumn: 'span 2', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', padding: 'var(--space-xs)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(lesson.tasks || []).map(task => <div className="task-item" key={task.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginBottom: 'var(--space-xs)', opacity: 0.6, cursor: 'not-allowed' }}>
              <RadioButtonUnchecked /><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>{taskIcon(task.type)}</div><span>{task.name}</span>
              {task.isRequired === false && <span style={{ fontSize: 'var(--text-small)', color: '#9e9e9e', marginLeft: '0.5rem' }}>({translate(locale, 'common', 'optional')})</span>}
            </div>
          </div>)}
        </div>
      </div>
    </LessonItem>)}
  </ul></div>;
}

// "HP LIFE Courses Offer": three reasons to learn, under the tabs (the existing site's HighlightsList).
const HighlightList = styled('ul')(({ theme }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', [theme.breakpoints.up('sm')]: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridGap: 'var(--space-lg)' } }));
const HighlightItem = styled('li')(({ theme }) => ({ position: 'relative', '& + &': { marginTop: 'var(--space-lg)', [theme.breakpoints.up('sm')]: { marginTop: 0 } } }));

function Highlights({ locale }) {
  const t = key => translate(locale, 'CoursePage', key);
  const items = [[<FaRegSmile key="s" />, 'adaptability'], [<FaRegThumbsUp key="t" />, 'relevance'], [<FaCertificate key="c" />, 'certification']];
  return <>
    <div style={{ marginBottom: 10 }}><h2 style={{ fontSize: '2.3rem', lineHeight: 1.2, fontWeight: 'var(--font-normal)', fontFamily: 'var(--primary-font)' }}>{translate(locale, 'BrandProgram', 'highLightListTitle')}</h2></div>
    <HighlightList>{items.map(([icon, key]) => <HighlightItem key={key}>
      <div style={{ color: '#000', fontSize: '2.5rem' }}> {icon}</div>
      <h2 style={{ color: 'var(--text-color-dark)', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', fontSize: 'var(--text-large)' }}>{t(key)}</h2>
      <p style={{ marginTop: 'var(--space-xs)', color: 'var(--black-dark-shade)' }}>{t(`${key}Msg`)}</p>
    </HighlightItem>)}</HighlightList>
  </>;
}

export function CourseOverview({ course, lessons, shareUrl, mail, locale }) {
  const [tab, setTab] = useState(0);
  const t = key => translate(locale, 'CoursePage', key);
  const tabs = [
    [t('overview'), <div key="o">{course.body && <div className="editor-content"><CmsContent page={{ content: course.body, style: '' }} id="course-body" /></div>}</div>],
    [t('lessons'), <Lessons key="l" lessons={lessons} locale={locale} />],
    ...(course.offline ? [[t('availableOfflineTab'), <div key="f" style={{ marginBottom: '1.5rem' }}>
      <div style={{ color: 'var(--secondary-color-dark)', fontSize: '2.5rem', fontWeight: 400 }}>{t('availableOfflineTitle')}</div>
      <div style={{ color: 'var(--secondary-color-dark)', fontSize: '1.6rem', margin: '1.25rem 0' }}>{t('availableOfflineBody')}</div>
      <div style={{ display: 'flex', gap: 8 }}><a href={connection.links.appStore} target="_blank" rel="noopener noreferrer"><img src={`/badge/ios/app-Store-Badge-EN.svg`} alt="App Store" /></a><a href={connection.links.googlePlay} target="_blank" rel="noopener noreferrer"><img src={`/badge/android/google-play-badge-EN.svg`} alt="Google Play Store" /></a></div>
    </div>]] : []),
  ];
  const students = translateCount(locale, 'CoursePage', 'studentsEnrolled', course.traineeCount ?? 0);
  return <Wrapper>
    <div style={{ background: 'var(--white)' }}><div className="wrapper small">
      <ListIcons>
        <li><span style={{ display: 'inline-block', marginRight: 'var(--space-xs)' }}><FaUsers color="#000" size={25} /></span><p>{students}</p></li>
        <li><span style={{ display: 'inline-block', marginRight: 'var(--space-xs)' }}><FaCertificate color="#000" size={25} /></span><p>{course.hasCertificate ? t('certificateAvailMsg') : t('certificateNotAvailMsg')}</p></li>
      </ListIcons>
    </div></div>
    <div className="wrapper pb-lg">
      <div style={{ marginBottom: 'var(--space-lg)' }}><ShareButtons url={shareUrl} xText={mail.x} mailSubject={mail.subject} mailBody={mail.body} locale={locale} /></div>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', overflow: 'hidden', overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: 'var(--space)' }}>
            <TabList role="tablist">{tabs.map(([label], i) => <Tab key={label} selected={i === tab} role="presentation"><button type="button" role="tab" aria-selected={i === tab} aria-label={`${label} Tab`} onClick={() => setTab(i)}>{label}</button></Tab>)}</TabList>
          </div>
          <div style={{ height: '100%' }}>{tabs[tab][1]}</div>
        </div>
      </div>
      <Highlights locale={locale} />
    </div>
    <HighlightedSection title={t('startNow')}><EnrollButton course={course} locale={locale} /></HighlightedSection>
  </Wrapper>;
}
