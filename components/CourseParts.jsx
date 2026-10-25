import { Box, Chip, Stack, styled, Typography } from '@mui/material';
import { connection } from '../platform/config';
import { formatShortDate } from '../platform/dates';
import { cardStatus, slugFromIdAndName } from '../platform/learning';
import { translate } from '../platform/i18n';

// Pieces shared by the signed-in course cards, ported from the existing site's CourseCard parts:
// start/finish dates, the progress bar, the status badge and the buttons that depend on the course status.

export function CourseDates({ startDate, finishDate, locale = 'en' }) {
  if (!startDate && !finishDate) return null;
  const row = (label, value) => value && <Typography color="common.black"><Typography fontSize={12} component="span" fontWeight="bold">{label}:</Typography>{' '}{formatShortDate(value, locale)}</Typography>;
  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', '& p': { fontSize: '1.6rem', lineHeight: 1.6, color: '#000' } }}>
    {row(translate(locale, 'common', 'startDateLabel'), startDate)}
    {row(translate(locale, 'common', 'finishDateLabel'), finishDate)}
  </Box>;
}

const Track = styled('div')(({ theme }) => ({ flex: 1, height: 8, backgroundColor: theme.palette.grey[300], borderRadius: 4, overflow: 'hidden', position: 'relative' }));
const Fill = styled('div')(({ theme }) => ({ height: '100%', backgroundColor: theme.palette.success.main, transition: 'width 0.3s ease' }));

// Hidden when the course is finished (100%) or has no progress figure, as on the existing site.
export function CourseProgress({ progress, locale = 'en' }) {
  if (progress === null || progress === undefined || progress < 0 || progress >= 100) return null;
  return <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Track role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><Fill style={{ width: `${Math.floor(progress)}%` }} /></Track>
      <Typography fontWeight={500} fontSize={12} color="common.black">{Math.round(progress)}% {translate(locale, 'CourseCard', 'complete')}</Typography>
    </div>
  </div>;
}

// "In progress" (yellow) and "Completed" (green) over the picture of the cards in the course lists.
export function StatusBadge({ course, locale = 'en' }) {
  const status = cardStatus(course);
  const label = status === 'inProgress' ? translate(locale, 'common', 'inProgress') : status === 'completedWithCertificate' || status === 'completedWithoutCertificate' ? translate(locale, 'common', 'completed') : null;
  if (!label) return null;
  return <Chip label={label} sx={{ fontSize: 12, color: '#000', borderRadius: '6px', backgroundColor: status === 'inProgress' ? '#fdff6e' : '#87be63', boxShadow: '0px 2px 3px 0px #00000033', padding: '7px 10px', '& .MuiChip-label': { padding: 0 } }} />;
}

// Where "Start" and "Continue" lead. Course execution is not part of this site yet, so they go to the same addresses the existing
// site uses on its own host; when execution is merged here, change this one function.
export const executionHref = (courseId, lessonId, taskId, taskType) => lessonId && taskId && taskType ? `${connection.reference}/trainee/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}/${String(taskType).toLowerCase()}` : null;

// The buttons of a course card for a signed-in visitor: [{ label, href, variant }]. Certificates download through this site (see /api/certificate).
export function cardActions(course, locale = 'en') {
  const t = key => translate(locale, 'CourseCard', key);
  const courseHref = `/course/${encodeURIComponent(slugFromIdAndName(course.id, course.name))}${locale === 'en' ? '' : `?lang=${locale}`}`;
  const status = cardStatus(course);
  const certificate = course.certificateId ? [{ label: t('downloadCertificate'), href: `/api/certificate/${course.certificateId}?name=${encodeURIComponent(course.name)}`, variant: 'containedPrimary', download: true }, { label: t('shareCertificate'), share: `${connection.reference}/certificate/${course.certificateId}`, variant: 'outlined' }] : [];
  if (course.status === 'Archived') return status === 'completedWithCertificate' ? certificate : [];
  switch (status) {
    case 'notStarted': return [{ label: t('startLesson'), href: executionHref(course.id, course.lastLessonId, course.lastTaskId, course.lastTaskType) || courseHref, variant: 'containedPrimary' }];
    case 'inProgress': return [{ label: t('continueLesson'), href: executionHref(course.id, course.lastLessonId, course.lastTaskId, course.lastTaskType) || courseHref, variant: 'containedPrimary' }];
    case 'completedWithCertificate': return certificate;
    case 'completedWithoutCertificate': return [{ label: t('viewCourse'), href: courseHref, variant: 'containedPrimary' }];
    default: return [];
  }
}

export const Actions = ({ children }) => <Stack sx={{ alignItems: 'center', gap: 4, mt: 'auto', width: 1, position: 'relative', zIndex: 1 }}>{children}</Stack>;
