// Pure rules for form tasks (answers, dates, required and selection checks). No server code, so the browser can import it.
const isFinished = form => ['finished', 'passed'].includes(String(form.status || '').toLowerCase());
// Whether the learner may still answer: editable forms always; surveys until finished; quizzes until passed (a failed quiz can be retried).
export function formAnswerable(form) {
  if (!form || form.isEnabled === false) return false;
  const kind = String(form.type || '').toLowerCase();
  if (kind === 'editableform') return true;
  return !isFinished(form);
}

// ---- Dates and times: how the old player stores them ----
const pad = n => String(n).padStart(2, '0');
export const utc = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; };
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
