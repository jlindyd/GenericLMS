import { resolveLocale } from '../../../../platform/config';
import { requireSession, isSignInRequired, readAs, signInRedirect } from '../../../../platform/session';
import { courseExecutionPath, courseTasks, taskHref } from '../../../../platform/execution';

export async function getServerSideProps(context) {
  const locale = resolveLocale(context.query.lang || context.req.cookies?.NEXT_LOCALE);
  const session = await requireSession(context); if (session.redirect) return session;
  context.res.setHeader('Cache-Control', 'private, no-store');
  try {
    const course = await readAs(session.token, 'learning', courseExecutionPath(context.params.courseId));
    const available = courseTasks(course).filter(({ lesson, task }) => lesson.isEnabled !== false && task.isEnabled !== false);
    const current = available.find(({ task }) => !['Finished', 'Passed'].includes(task.status)) || available[0];
    if (!current) return { notFound: true };
    return { redirect: { destination: taskHref(course.id, current.lesson.id, current.task.id, current.task.type, locale, course.type === 'SelfPaced'), permanent: false } };
  } catch (error) { if (isSignInRequired(error)) return signInRedirect(context.resolvedUrl, locale); throw error; }
}
export default function CourseStart() { return null; }
