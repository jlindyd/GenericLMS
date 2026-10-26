import { positiveId, ServiceError } from './server.js';
import { courseExecutionPath, taskInCourse } from './execution.js';
import { readAs } from './session.js';
import { dateAnswer, dateTimeAnswer, formAnswerable, missingRequired, selectionErrors, utc } from './form-rules.js';
export * from './form-rules.js';

// Surveys, editable forms and quizzes are one kind of task on the learning service: a list of questions that the learner answers and
// either saves for later or submits. Paths, answer shapes and rules follow the existing player (LMSEXECUTION QuizPage, SurveyPage,
// EditableFormPage and components/Task/synchronous-helpers). Only self-paced tasks assigned to the learner are handled here.
export const formKinds = ['survey', 'editableform', 'quiz'];
export const formExecutionPath = id => `api/trainee/form/${positiveId(id)}`;
export const operations = ['save', 'submit'];
const supportedTypes = ['SingleLineText', 'MultiLineText', 'DropDown', 'CheckBox', 'RadioBox', 'DateTime', 'Date', 'Time', 'LinearScale', 'RadioBoxGrid', 'CheckBoxGrid', 'Description'];
const textLimit = 20000;


// Only these forms are handled here; anything else carries on in the existing player: coach tasks, private responses (the learner would
// see nothing to answer) and any question type this player does not know.
export const legacyFormRequired = form =>
  String(form.assignedTo || '').toLowerCase() !== 'trainee'
  || !Array.isArray(form.questions)
  || form.questions.some(question => !supportedTypes.includes(question.type));


export async function loadFormExecution(token, courseId, lessonId, taskId, read = readAs) {
  const course = await read(token, 'learning', courseExecutionPath(courseId));
  const selected = taskInCourse(course, lessonId, taskId);
  const kind = String(selected.task.type).toLowerCase();
  if (course.type !== 'SelfPaced' || !formKinds.includes(kind)) return { course, selected, legacy: true };
  const form = await read(token, 'learning', formExecutionPath(taskId));
  if (form.id !== positiveId(taskId)) throw new ServiceError('The task response did not match this task.', 502);
  return { course, selected, form, legacy: legacyFormRequired(form) };
}

// The body of POST api/trainee/form/{id}: { op, answers }. Unanswered questions are left out, as JSON drops undefined values.
// Checks the answers belong to this form and have the right shape, so a tampered request cannot send anything else.
export function submission(form, op, answers) {
  if (!operations.includes(op)) throw new ServiceError('Choose save or submit.', 400);
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new ServiceError('Answers are missing.', 400);
  const byId = new Map((form.questions || []).map(q => [String(q.id), q]));
  const clean = {};
  const bad = () => new ServiceError('An answer is not in the right form.', 400);
  const optionIds = q => new Set((q.options || []).map(option => option.id));
  const oneOption = (q, value) => { if (!Number.isInteger(value) || !optionIds(q).has(value)) throw bad(); return value; };
  for (const [key, value] of Object.entries(answers)) {
    if (value === undefined || value === null) continue; // nothing answered; nothing is sent
    const q = byId.get(key);
    if (!q || q.type === 'Description') throw new ServiceError('An answer does not belong to this task.', 400);
    switch (q.type) {
      case 'CheckBox': if (!Array.isArray(value)) throw bad(); clean[q.id] = [...new Set(value.map(item => oneOption(q, item)))]; break;
      case 'DropDown': case 'RadioBox': clean[q.id] = oneOption(q, value); break;
      case 'CheckBoxGrid': case 'RadioBoxGrid': {
        if (typeof value !== 'object' || Array.isArray(value)) throw bad();
        const subs = new Set((q.subQuestions || []).map(sub => String(sub.id))), grid = {};
        for (const [subId, cell] of Object.entries(value)) {
          if (!subs.has(subId)) throw bad();
          if (cell === undefined || cell === null) continue;
          grid[subId] = q.type === 'CheckBoxGrid' ? (Array.isArray(cell) ? [...new Set(cell.map(item => oneOption(q, item)))] : (() => { throw bad(); })()) : oneOption(q, cell);
        }
        clean[q.id] = grid; break;
      }
      case 'LinearScale': {
        if (!Number.isInteger(value) || value < q.minValue || value > q.maxValue) throw bad();
        clean[q.id] = value; break;
      }
      case 'Date': if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || !dateAnswer(value)) throw bad(); clean[q.id] = value; break;
      case 'DateTime': if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(value) || !dateTimeAnswer(`${value}Z`)) throw bad(); clean[q.id] = value; break;
      case 'Time': if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z$/.test(value) || !utc(value)) throw bad(); clean[q.id] = value; break;
      default: if (typeof value !== 'string' || value.length > textLimit) throw bad(); clean[q.id] = value;
    }
  }
  if (op === 'submit') {
    if (missingRequired(form.questions, clean).length) throw new ServiceError('Answer every required question before submitting.', 400);
    if (Object.keys(selectionErrors(form.questions, clean)).length) throw new ServiceError('Check how many options are ticked.', 400);
  }
  return { op, answers: clean };
}

