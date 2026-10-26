import ExecutionPlayer from '../../../../../../../../components/ExecutionPlayer';
import { resolveLocale } from '../../../../../../../../platform/config';
import { requireSession, isSignInRequired, signInRedirect, readAs } from '../../../../../../../../platform/session';
import { loadContentExecution, loadVideoExecution, loadActivityExecution, taskHref } from '../../../../../../../../platform/execution';
import { cleanHtml } from '../../../../../../../../platform/sanitize';
import { activityUser } from '../../../../../../../../platform/activity';

export async function getServerSideProps(context) {
  const locale = resolveLocale(context.query.lang || context.req.cookies?.NEXT_LOCALE);
  const session = await requireSession(context); if (session.redirect) return session;
  context.res.setHeader('Cache-Control', 'private, no-store');
  const { courseId, lessonId, taskId, taskType } = context.params;
  try {
    const kind = taskType.toLowerCase();
    if (!['content', 'video', 'xapiactivity'].includes(kind)) return { redirect: { destination: taskHref(courseId, lessonId, taskId, taskType, locale, false), permanent: false } };
    const data = await ({ video: loadVideoExecution, content: loadContentExecution, xapiactivity: loadActivityExecution }[kind])(session.token, courseId, lessonId, taskId);
    if (data.legacy) return { redirect: { destination: taskHref(courseId, lessonId, taskId, data.selected.task.type, locale, false), permanent: false } };
    const profile = data.activity ? await readAs(session.token, 'identity', 'api/account/userinfo') : null;
    return { props: JSON.parse(JSON.stringify({ locale, course: data.course, lessonId: Number(lessonId), taskId: Number(taskId), ...(data.activity ? { activity: data.activity, user: activityUser(profile) } : data.video ? { video: data.video } : { content: { ...data.content, body: cleanHtml(data.content.body) } }) })) };
  } catch (error) {
    if (isSignInRequired(error)) return signInRedirect(context.resolvedUrl, locale);
    context.res.statusCode = [400, 403, 404].includes(error.status) ? error.status : 502;
    return { props: { locale, error: error.message || 'Unable to load this task.' } };
  }
}
export default ExecutionPlayer;
