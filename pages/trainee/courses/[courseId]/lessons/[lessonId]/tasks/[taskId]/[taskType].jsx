import ExecutionPlayer from '../../../../../../../../components/ExecutionPlayer';
import { resolveLocale } from '../../../../../../../../platform/config';
import { withSessionRecovery, readAs } from '../../../../../../../../platform/session';
import { loadContentExecution, loadVideoExecution, loadActivityExecution, taskHref } from '../../../../../../../../platform/execution';
import { cleanHtml } from '../../../../../../../../platform/sanitize';
import { activityUser } from '../../../../../../../../platform/activity';
import { loadFormExecution } from '../../../../../../../../platform/forms';
import { cleanForm } from '../../../../../../../../platform/form-view';
import { loadAssignmentExecution, cleanAssignment } from '../../../../../../../../platform/assignments';

export async function getServerSideProps(context) {
  const locale = resolveLocale(context.query.lang || context.req.cookies?.NEXT_LOCALE);
  context.res.setHeader('Cache-Control', 'private, no-store');
  const { courseId, lessonId, taskId, taskType } = context.params;
  try {
    return await withSessionRecovery(context, async token => {
    const kind = taskType.toLowerCase();
    if (!['content', 'video', 'xapiactivity', 'survey', 'editableform', 'quiz', 'assignment'].includes(kind)) return { redirect: { destination: taskHref(courseId, lessonId, taskId, taskType, locale, false), permanent: false } };
    const data = await ({ video: loadVideoExecution, content: loadContentExecution, xapiactivity: loadActivityExecution, survey: loadFormExecution, editableform: loadFormExecution, quiz: loadFormExecution, assignment: loadAssignmentExecution }[kind])(token, courseId, lessonId, taskId);
    if (data.legacy) return { redirect: { destination: taskHref(courseId, lessonId, taskId, data.selected.task.type, locale, false), permanent: false } };
    const profile = data.activity ? await readAs(token, 'identity', 'api/account/userinfo') : null;
    return { props: JSON.parse(JSON.stringify({ locale, course: data.course, lessonId: Number(lessonId), taskId: Number(taskId), ...(data.assignment ? { assignment: cleanAssignment(data.assignment) } : data.form ? { form: cleanForm(data.form) } : data.activity ? { activity: data.activity, user: activityUser(profile) } : data.video ? { video: data.video } : { content: { ...data.content, body: cleanHtml(data.content.body) } }) })) };
    });
  } catch (error) {
    context.res.statusCode = [400, 403, 404].includes(error.status) ? error.status : 502;
    return { props: { locale, error: error.message || 'Unable to load this task.' } };
  }
}
export default ExecutionPlayer;
