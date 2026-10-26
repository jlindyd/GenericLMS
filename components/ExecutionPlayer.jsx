import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Alert, Box, Button, LinearProgress, List, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material';
import Footer from './Footer';
import ExecutionVideo from './ExecutionVideo';
import ExecutionVimeo from './ExecutionVimeo';
import ExecutionActivity from './ExecutionActivity';
import ExecutionForm from './ExecutionForm';
import ExecutionAssignment from './ExecutionAssignment';
import { direction } from '../platform/config';
import { canValidateContent, courseTasks, taskHref } from '../platform/execution';
import labels from '../platform/execution-translations.json';

// Execution has its own frame rather than the catalogue's search/navigation header.
// Kept opt-in until the HP LIFE player has been compared on the test environment.
export default function ExecutionPlayer({ locale = 'en', course: initialCourse, content: initialContent, video, activity, form, assignment, user, lessonId, taskId, error }) {
  const router = useRouter();
  const [updated, setUpdated] = useState(null);
  const snapshot = updated?.taskId === taskId ? updated : null;
  const course = snapshot ? { ...initialCourse, progress: snapshot.progress, lessons: snapshot.lessons } : initialCourse;
  const interactive = video || activity || form || assignment;
  const content = interactive ? { ...interactive, status: snapshot?.status || interactive.status } : initialContent;
  const [busy, setBusy] = useState(false), [failure, setFailure] = useState('');
  const t = key => labels[locale]?.[key] || labels.en[key] || key;
  const dashboard = `/dashboard?lang=${locale}&page=1`;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert><Button href={dashboard}>{t('back')}</Button></Box>;
  const available = courseTasks(course).filter(({ lesson, task }) => lesson.isEnabled !== false && task.isEnabled !== false);
  const index = available.findIndex(item => item.task.id === taskId && item.lesson.id === lessonId);
  const next = available[index + 1], previous = available[index - 1];
  const link = item => taskHref(course.id, item.lesson.id, item.task.id, item.task.type, locale, true);
  const progress = Math.max(0, Math.min(100, Number(course.progress || 0) * 100));
  async function complete() {
    setBusy(true); setFailure('');
    try {
      const response = await fetch('/api/execution/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course.id, lessonId, taskId }) });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || 'Unable to save progress. Reload before retrying.'); }
      await router.replace(router.asPath); // Read the authoritative status, progress and newly unlocked tasks.
    } catch (e) { setFailure(e.message); } finally { setBusy(false); }
  }
  return <Box dir={direction(locale)} lang={locale} sx={{ minHeight: '100vh', bgcolor: '#f4f9fb' }}>
    <Head><title>{content.name} | {course.name}</title><meta name="robots" content="noindex,nofollow" /></Head>
    <a className="skip-link" href="#execution-content">Skip to main content</a>
    <Box component="header" sx={{ bgcolor: 'var(--primary-color, #024ad8)', color: '#fff', display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 1.5, minHeight: 64 }}>
      <Button href={dashboard} sx={{ color: '#fff', fontSize: 16 }}>{t('back')}</Button>
      <a href={`/?lang=${locale}`} aria-label={t('home')}><img src="/brand/logo.svg" alt="HP LIFE" width="86" height="48" /></a>
      <Typography sx={{ flex: 1, fontSize: { xs: 16, md: 19 } }}>{course.name}</Typography>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px minmax(0,1fr)' }, minHeight: '70vh' }}>
      <Box component="nav" aria-label={t('lessons')} sx={{ bgcolor: '#e4eaef', p: 2, maxHeight: { md: 'calc(100vh - 64px)' }, overflowY: 'auto' }}>
        <Typography fontSize={16} gutterBottom>{t('progressBarLabel')} {Math.round(progress)}%</Typography><LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />
        {(course.lessons || []).map(lesson => <Box key={lesson.id} sx={{ mb: 2 }}><Typography fontWeight="bold" fontSize={16}>{lesson.name}</Typography><List dense>{(lesson.tasks || []).map(task => <ListItemButton key={task.id} component="a" href={link({ lesson, task })} disabled={busy || lesson.isEnabled === false || task.isEnabled === false} selected={task.id === taskId && lesson.id === lessonId} aria-current={task.id === taskId && lesson.id === lessonId ? 'step' : undefined}><ListItemText primary={task.name} secondary={task.status} slotProps={{ primary: { fontSize: 15 }, secondary: { fontSize: 12, color: '#4a5560' } }} /></ListItemButton>)}</List></Box>)}
      </Box>
      <Box component="main" id="execution-content" sx={{ p: { xs: 2, md: 4 }, minWidth: 0 }}>
        <Typography component="h1" sx={{ fontSize: 28, mb: 3 }}>{content.name}</Typography>
        {failure && <Alert severity="error" sx={{ mb: 2 }}>{failure}</Alert>}
        {!form && !assignment && ['Finished', 'Completed', 'Passed', 'WaitingForCoachApproval'].includes(content.status) && <Alert severity={content.status === 'WaitingForCoachApproval' ? 'info' : 'success'} sx={{ mb: 2 }}>{content.status === 'WaitingForCoachApproval' ? t('waiting') : t('completed')}</Alert>}
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, bgcolor: '#fff', '& img, & video': { maxWidth: '100%', height: 'auto' } }}>{assignment ? <ExecutionAssignment key={taskId} assignment={assignment} course={course} lessonId={lessonId} taskId={taskId} locale={locale} onProgress={data => setUpdated({ ...data, taskId })} /> : form ? <ExecutionForm key={taskId} form={form} course={course} lessonId={lessonId} taskId={taskId} locale={locale} onProgress={data => setUpdated({ ...data, taskId })} /> : activity ? <ExecutionActivity key={taskId} activity={activity} user={user} courseId={course.id} lessonId={lessonId} onProgress={data => setUpdated({ ...data, taskId })} /> : video ? (video.provider === 'Vimeo' ? <ExecutionVimeo key={taskId} video={video} courseId={course.id} lessonId={lessonId} onProgress={data => setUpdated({ ...data, taskId })} /> : <ExecutionVideo key={taskId} video={video} courseId={course.id} lessonId={lessonId} onProgress={data => setUpdated({ ...data, taskId })} />) : <div className="editor-preview" dangerouslySetInnerHTML={{ __html: content.body }} />}</Paper>
        <Stack direction="row" useFlexGap flexWrap="wrap" gap={2} sx={{ mt: 3, justifyContent: 'space-between' }}>
          {previous && <Button disabled={busy} href={link(previous)}>{t('prev')}</Button>}
          {!interactive && canValidateContent(content) && <Button variant="containedPrimary" disabled={busy} onClick={complete}>{busy ? '…' : t('submitBtn')}</Button>}
          {next && <Button variant="outlined" disabled={busy} href={link(next)}>{t('next')}</Button>}
          {!next && ['Finished', 'Completed', 'Passed'].includes(content.status) && <Button href={dashboard}>{t('back')}</Button>}
        </Stack>
      </Box>
    </Box><Footer locale={locale} />
  </Box>;
}
