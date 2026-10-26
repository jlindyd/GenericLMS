import ExecutionPlayer from '../../../../../../../../components/ExecutionPlayer';
import { resolveLocale } from '../../../../../../../../platform/config';
import { requireSession, isSignInRequired, signInRedirect } from '../../../../../../../../platform/session';
import { loadContentExecution, taskHref } from '../../../../../../../../platform/execution';
import { cleanHtml } from '../../../../../../../../platform/sanitize';

export async function getServerSideProps(context) {
  const locale = resolveLocale(context.query.lang || context.req.cookies?.NEXT_LOCALE);
  const session = await requireSession(context); if (session.redirect) return session;
  context.res.setHeader('Cache-Control', 'private, no-store');
  const { courseId, lessonId, taskId, taskType } = context.params;
  try {
    if (taskType.toLowerCase() !== 'content') return { redirect: { destination: taskHref(courseId, lessonId, taskId, taskType, locale, false), permanent: false } };
    const data = await loadContentExecution(session.token, courseId, lessonId, taskId);
    if (data.legacy) return { redirect: { destination: taskHref(courseId, lessonId, taskId, data.selected.task.type, locale, false), permanent: false } };
    return { props: JSON.parse(JSON.stringify({ locale, course: data.course, lessonId: Number(lessonId), taskId: Number(taskId), content: { ...data.content, body: cleanHtml(data.content.body) } })) };
  } catch (error) {
    if (isSignInRequired(error)) return signInRedirect(context.resolvedUrl, locale);
    context.res.statusCode = [400, 403, 404].includes(error.status) ? error.status : 502;
    return { props: { locale, error: error.message || 'Unable to load this task.' } };
  }
}
export default ExecutionPlayer;
