import { resolveLocale } from '../../../../platform/config';
import { withSessionRecovery, readAs } from '../../../../platform/session';
import { courseExecutionPath, courseTasks, taskHref } from '../../../../platform/execution';

export async function getServerSideProps(context) {
  const locale = resolveLocale(context.query.lang || context.req.cookies?.NEXT_LOCALE);
  context.res.setHeader('Cache-Control', 'private, no-store');
  return withSessionRecovery(context, async token => {
    const course = await readAs(token, 'learning', courseExecutionPath(context.params.courseId));
    const available = courseTasks(course).filter(({ lesson, task }) => lesson.isEnabled !== false && task.isEnabled !== false);
    const current = available.find(({ task }) => !['Finished', 'Completed', 'Passed'].includes(task.status)) || available[0];
    if (!current) return { notFound: true };
    return { redirect: { destination: taskHref(course.id, current.lesson.id, current.task.id, current.task.type, locale, course.type === 'SelfPaced'), permanent: false } };
  });
}
export default function CourseStart() { return null; }
