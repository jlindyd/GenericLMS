import { positiveId, ServiceError } from './server.js';
import { courseExecutionPath, taskInCourse } from './execution.js';
import { readAs } from './session.js';

// Surveys, editable forms and quizzes are one kind of task on the learning service: a list of questions that the learner answers and
// either saves for later or submits. Paths, answer shapes and rules follow the existing player (LMSEXECUTION QuizPage, SurveyPage,
// EditableFormPage and components/Task/synchronous-helpers). Only self-paced tasks assigned to the learner are handled here.
export const formKinds = ['survey', 'editableform', 'quiz'];
export const formExecutionPath = id => `api/trainee/form/${positiveId(id)}`;
export const operations = ['save', 'submit'];
const supportedTypes = ['SingleLineText', 'MultiLineText', 'DropDown', 'CheckBox', 'RadioBox', 'DateTime', 'Date', 'Time', 'LinearScale', 'RadioBoxGrid', 'CheckBoxGrid', 'Description'];
const textLimit = 20000;

const isFinished = form => ['finished', 'passed'].includes(String(form.status || '').toLowerCase());

// Only these forms are handled here; anything else carries on in the existing player: coach tasks, private responses (the learner would
// see nothing to answer) and any question type this player does not know.
export const legacyFormRequired = form =>
  String(form.assignedTo || '').toLowerCase() !== 'trainee'
  || !Array.isArray(form.questions)
  || form.questions.some(question => !supportedTypes.includes(question.type));

// Whether the learner may still answer: editable forms always; surveys until finished; quizzes until passed (a failed quiz can be retried).
export function formAnswerable(form) {
  if (!form || form.isEnabled === false) return false;
  const kind = String(form.type || '').toLowerCase();
  if (kind === 'editableform') return true;
  return !isFinished(form);
}

export async function loadFormExecution(token, courseId, lessonId, taskId, read = readAs) {
  const course = await read(token, 'learning', courseExecutionPath(courseId));
  const selected = taskInCourse(course, lessonId, taskId);
  const kind = String(selected.task.type).toLowerCase();
  if (course.type !== 'SelfPaced' || !formKinds.includes(kind)) return { course, selected, legacy: true };
  const form = await read(token, 'learning', formExecutionPath(taskId));
  if (form.id !== positiveId(taskId)) throw new ServiceError('The task response did not match this task.', 502);
  return { course, selected, form, legacy: legacyFormRequired(form) };
}

// ---- Dates and times: how the old player stores them ----
const pad = n => String(n).padStart(2, '0');
const utc = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; };
export function dateAnswer(value) { const d = utc(value); return d ? `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` : undefined; }
export function dateTimeAnswer(value) { const d = utc(value); return d ? `${dateAnswer(d)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : undefined; }
// A time is kept as an ISO moment on today's date (UTC) and shown as hours and minutes.
export const timeText = value => { const d = utc(value); return d ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : ''; };
export function timeAnswer(text, now = new Date()) {
  const match = /^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(String(text ?? ''));
  return match ? `${dateAnswer(now)}T${match[1]}:${match[2]}:00Z` : undefined;
}

const text = value => (value === null || value === undefined ? '' : typeof value === 'string' || typeof value === 'number' ? String(value) : '');
const numbers = list => (Array.isArray(list) ? list.filter(Number.isInteger) : []);

// The answers the learner already has, in the shape they are edited and sent in, keyed by question id.
export function savedAnswers(questions) {
  const answers = {};
  for (const q of questions || []) {
    switch (q.type) {
      case 'CheckBox': answers[q.id] = numbers(q.selectedOptions); break;
      case 'CheckBoxGrid': answers[q.id] = Object.fromEntries((q.subQuestions || []).map(sub => [sub.id, numbers(sub.selectedOptions)])); break;
      case 'RadioBoxGrid': answers[q.id] = Object.fromEntries((q.subQuestions || []).map(sub => [sub.id, numbers(sub.selectedOptions)[0]])); break;
      case 'Date': answers[q.id] = q.actualAnswer ? dateAnswer(q.actualAnswer) : undefined; break;
      case 'DateTime': answers[q.id] = q.actualAnswer ? dateTimeAnswer(q.actualAnswer) : undefined; break;
      case 'Time': answers[q.id] = q.actualAnswer ? String(q.actualAnswer) : undefined; break;
      case 'DropDown': case 'RadioBox': answers[q.id] = numbers(q.selectedOptions)[0]; break;
      case 'LinearScale': answers[q.id] = Number.isFinite(q.actualAnswer) ? q.actualAnswer : undefined; break;
      case 'SingleLineText': case 'MultiLineText': answers[q.id] = text(q.actualAnswer); break;
      default: answers[q.id] = undefined;
    }
  }
  return answers;
}

const toggle = (list, id) => (list.includes(id) ? list.filter(item => item !== id) : [...list, id]);

// One change from the screen: a checkbox option (toggle), a grid cell, or a plain value.
export function changeAnswer(answers, question, value, subId) {
  const current = answers[question.id];
  switch (question.type) {
    case 'CheckBox': return { ...answers, [question.id]: toggle(numbers(current), value) };
    case 'CheckBoxGrid': { const grid = current && typeof current === 'object' ? current : {}; return { ...answers, [question.id]: { ...grid, [subId]: toggle(numbers(grid[subId]), value) } }; }
    case 'RadioBoxGrid': { const grid = current && typeof current === 'object' ? current : {}; return { ...answers, [question.id]: { ...grid, [subId]: value } }; }
    default: return { ...answers, [question.id]: value };
  }
}

const blank = value => value === '' || value === null || value === undefined;
// Required questions with no answer. A grid needs every row answered.
export function missingRequired(questions, answers) {
  const missing = [];
  for (const q of questions || []) {
    if (!q.isRequired || q.type === 'Description') continue;
    const value = answers?.[q.id];
    let absent;
    switch (q.type) {
      case 'CheckBox': absent = numbers(value).length === 0; break;
      case 'CheckBoxGrid': absent = !value || (q.subQuestions || []).some(sub => numbers(value[sub.id]).length === 0); break;
      case 'RadioBoxGrid': absent = !value || (q.subQuestions || []).some(sub => !value[sub.id]); break;
      case 'SingleLineText': case 'MultiLineText': absent = blank(value); break;
      default: absent = !value;
    }
    if (absent) missing.push(q.id);
  }
  return missing;
}

// Minimum and maximum number of ticked options for a checkbox question: { questionId: { key: 'minSelection' | 'maxSelection', count } }.
export function selectionErrors(questions, answers) {
  const errors = {};
  for (const q of questions || []) {
    if (q.type !== 'CheckBox') continue;
    const count = numbers(answers?.[q.id]).length;
    if (Number.isInteger(q.minSelectionCount) && count < q.minSelectionCount) errors[q.id] = { key: 'minSelection', count: q.minSelectionCount };
    else if (Number.isInteger(q.maxSelectionCount) && count > q.maxSelectionCount) errors[q.id] = { key: 'maxSelection', count: q.maxSelectionCount };
  }
  return errors;
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

