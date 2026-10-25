import { Box, Stack, styled, Typography } from '@mui/material';
import { CloudDownload, Groups } from '@mui/icons-material';
import { fill, translate, translateCount } from '../platform/i18n';
import { slugFromIdAndName } from '../platform/learning';

// Search results do not show the "Available offline" row on the existing site, hence showOffline.
// Course card as on the existing site (CourseCard compound, LatestCourseCard and ExploreCourseCard), vertical variant.
const Card = styled('article')(({ theme }) => ({
  position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden', width: '100%',
  boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.25)', background: theme.palette.background.paper, borderRadius: 12, padding: 16,
  height: 700, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  [theme.breakpoints.up('sm')]: { height: 620 }, [theme.breakpoints.up('md')]: { height: 660 }, [theme.breakpoints.up('lg')]: { height: 630 },
}));
const Image = styled('div')(({ theme }) => ({ position: 'relative', flexShrink: 0, width: '100%', height: 245, '& > div': { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 8, backgroundColor: '#e0e0e0' }, '& img': { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }, [theme.breakpoints.down('md')]: { width: '100%' } }));
const Title = styled('h2')(({ theme }) => ({ fontSize: '2rem', fontWeight: theme.typography.fontWeightMedium, color: '#000', lineHeight: 1.4, margin: 0 }));
const Metadata = styled('div')({ display: 'flex', flexDirection: 'column', gap: '1rem', '& p': { fontSize: '1.6rem', lineHeight: 1.6, color: '#000' } });
// The whole card is one link ("stretched link"), so the title, image and button all open the course.
const Learn = styled('a')(({ theme }) => ({ color: 'var(--link-color)', textDecoration: 'underline', '&::after': { content: '""', position: 'absolute', inset: 0 }, '&:focus-visible': { outline: '2px solid var(--focus-outline-color)', outlineOffset: -2, borderRadius: 12 } }));

export default function CourseCard({ course, categories = [], locale = 'en', showOffline = true }) {
  const category = categories.find(c => c.id === course.categoryId)?.name;
  const href = `/course/${slugFromIdAndName(course.id, course.name)}${locale === 'en' ? '' : `?lang=${locale}`}`;
  return <Card>
    <Image><div>{course.imageUrl && <img src={course.imageUrl} alt="" loading="lazy" />}</div></Image>
    <Title>{course.name}</Title>
    <Stack sx={{ flex: 1 }} justifyContent="space-between">
      <Metadata>
        {category && <Typography>{category}</Typography>}
        {showOffline && course.offline && <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CloudDownload sx={{ color: 'primary.main' }} fontSize="large" /><Typography fontSize={14}>{translate(locale, 'CoursePage', 'availableOffline')}</Typography>
        </Box>}
        {!!course.traineeCount && <Stack direction="row" alignItems="center" gap={3}><Groups fontSize="large" /><Typography>{translateCount(locale, 'CoursePage', 'studentsEnrolled', course.traineeCount)}</Typography></Stack>}
        {course.description && <Typography>{course.description}</Typography>}
      </Metadata>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, mt: 'auto' }}>
        <Learn href={href} aria-label={fill(translate(locale, 'HomePage', 'learnMoreAbout', 'Learn more about {name}'), { name: course.name })}>{translate(locale, 'common', 'learnMore', 'Learn more')}</Learn>
      </Box>
    </Stack>
  </Card>;
}

export const CourseGrid = styled('div')(({ theme }) => ({ display: 'grid', width: '100%', gridTemplateColumns: 'repeat(1, 1fr)', gridGap: '2rem', [theme.breakpoints.up('md')]: { gridTemplateColumns: 'repeat(2, 1fr)' }, [theme.breakpoints.up('lg')]: { gridTemplateColumns: 'repeat(3, 1fr)' } }));
