import { Box, Button, Stack, styled, Typography } from '@mui/material';
import { CloudDownload } from '@mui/icons-material';
import { Actions, CourseDates, CourseProgress, StatusBadge, cardActions } from './CourseParts';
import { slugFromIdAndName } from '../platform/learning';
import { translate } from '../platform/i18n';
import { connection } from '../platform/config';

// A course of the signed-in visitor, as on the existing home page ("My courses"): a picture, the title, dates, progress and the
// button that fits the course status. Horizontal on wide screens (picture at the side), vertical below.
const Article = styled('article', { shouldForwardProp: p => p !== 'horizontal' && p !== 'dashboard' })(({ theme, horizontal, dashboard }) => ({
  position: 'relative', display: 'flex', gap: '1rem', overflow: 'hidden', border: 'none', textAlign: 'inherit',
  boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.25)', background: theme.palette.background.paper, borderRadius: 12, padding: 16,
  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  ...(horizontal ? { flexDirection: 'row', height: 285 } : dashboard ? { width: '100%', flexDirection: 'column', height: 680, [theme.breakpoints.up('md')]: { height: 600 }, [theme.breakpoints.up('lg')]: { height: 500 }, [theme.breakpoints.up('xl')]: { height: 512 } } : { width: '100%', flexDirection: 'column', height: 700, [theme.breakpoints.up('sm')]: { height: 620 }, [theme.breakpoints.up('md')]: { height: 660 }, [theme.breakpoints.up('lg')]: { height: 630 } }),
}));
const Picture = styled('div', { shouldForwardProp: p => p !== 'horizontal' && p !== 'dashboard' })(({ theme, horizontal, dashboard }) => ({
  position: 'relative', flexShrink: 0, ...(horizontal ? { width: 250, height: '100%' } : dashboard ? { width: '100%', height: 386, [theme.breakpoints.up('md')]: { height: 322 }, [theme.breakpoints.up('lg')]: { height: 226 } } : { width: '100%', height: 245 }),
  [theme.breakpoints.down('md')]: { width: '100%' },
  '& > div': { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 8, backgroundColor: '#e0e0e0' },
  '& img': { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
}));
const Title = styled('h2')(({ theme }) => ({ fontSize: '2rem', fontWeight: theme.typography.fontWeightMedium, color: '#000', lineHeight: 1.4, margin: 0, '& a, & a:hover': { color: theme.palette.text.primary, textDecoration: 'none', fontSize: '1.6rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }, '& a::after': { content: '""', position: 'absolute', inset: 0 } }));

export default function MyCourseCard({ course, locale = 'en', horizontal = false, categoryName, coach = false, dashboard = false, onShare }) {
  const href = `/course/${encodeURIComponent(slugFromIdAndName(course.id, course.name))}${locale === 'en' ? '' : `?lang=${locale}`}`;
  // A course the visitor coaches has no progress; its button opens the trainee list (a page of the existing site until it is built here).
  const actions = coach ? [{ label: translate(locale, 'HomePage', 'manageTrainees'), href: `${connection.reference}/manageTrainees/${course.id}`, variant: 'containedPrimary' }] : cardActions(course, locale);
  return <Article horizontal={horizontal ? 1 : undefined} dashboard={dashboard ? 1 : undefined}>
    <Picture horizontal={horizontal ? 1 : undefined} dashboard={dashboard ? 1 : undefined}><div>{course.imageUrl && <img src={course.imageUrl} alt={dashboard ? course.name : ''} loading="lazy" />}</div>{dashboard && !coach && <div style={{ position: 'absolute', bottom: -10, insetInlineEnd: 0, zIndex: 1, width: 'auto', height: 'auto', overflow: 'visible', background: 'none' }}><StatusBadge course={course} locale={locale} /></div>}</Picture>
    <Stack sx={{ flex: 1, justifyContent: 'space-between', minWidth: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', '& p': { fontSize: '1.6rem', lineHeight: 1.6, color: '#000' } }}>
        <Title>{course.status === 'Archived' ? course.name : <a href={href} tabIndex={-1}>{course.name}</a>}</Title>
        {categoryName && <Typography>{categoryName}</Typography>}
        {course.offline && <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><CloudDownload sx={{ color: 'primary.main' }} fontSize="large" /><Typography fontSize={14}>{translate(locale, 'CoursePage', 'availableOffline')}</Typography></Box>}
      </Box>
      <Stack useFlexGap spacing={4}>
        <CourseDates startDate={course.startDate} finishDate={course.finishDate} locale={locale} />
        {!coach && <CourseProgress progress={course.progress} locale={locale} />}
        {actions.length > 0 && <Actions>{actions.map(action => <Button key={action.label} variant={action.variant} href={action.share ? undefined : action.href} onClick={action.share && onShare ? () => onShare(action.share) : undefined} size={dashboard ? 'small' : undefined} aria-label={course.name ? `${action.label} ${course.name}` : action.label} sx={{ textTransform: 'none', width: '100%', fontSize: 14, fontWeight: 500, borderRadius: '6px' }}>{action.label}</Button>)}</Actions>}
      </Stack>
    </Stack>
  </Article>;
}
