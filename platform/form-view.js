import { cleanHtml } from './sanitize.js';

// What the browser receives of a form: authored HTML is cleaned here, coach feedback is left out, and the expected (correct) answers
// are sent only once the learner has answered, so they cannot be read from the page of a task still open for answering.
const answered = form => ['finished', 'passed', 'failed'].includes(String(form.status || '').toLowerCase());
const html = value => (typeof value === 'string' ? cleanHtml(value) : value);

export function cleanForm(form) {
  const reveal = answered(form);
  const option = o => ({ id: o.id, body: html(o.body), order: o.order, ...(reveal && o.expectedAnswer !== undefined ? { expectedAnswer: o.expectedAnswer } : {}) });
  const question = q => ({
    id: q.id, name: q.name, type: q.type, isRequired: Boolean(q.isRequired), body: html(q.body), order: q.order,
    options: Array.isArray(q.options) ? q.options.map(option) : undefined,
    selectedOptions: q.selectedOptions, actualAnswer: q.actualAnswer,
    minValue: q.minValue, maxValue: q.maxValue, minValueLabel: q.minValueLabel, maxValueLabel: q.maxValueLabel,
    minSelectionCount: q.minSelectionCount, maxSelectionCount: q.maxSelectionCount,
    subQuestions: Array.isArray(q.subQuestions) ? q.subQuestions.map(s => ({ id: s.id, body: html(s.body), selectedOptions: s.selectedOptions, ...(reveal ? { expectedOptions: s.expectedOptions } : {}) })) : undefined,
    ...(reveal ? { expectedOptions: q.expectedOptions, expectedAnswer: q.expectedAnswer } : {}),
  });
  return JSON.parse(JSON.stringify({
    id: form.id, name: form.name, type: form.type, status: form.status, body: html(form.body), isEnabled: form.isEnabled, assignedTo: form.assignedTo,
    questionDisplay: form.questionDisplay, minPassingScore: form.minPassingScore, score: form.score, isAutoCorrectionEnabled: form.isAutoCorrectionEnabled,
    questions: (form.questions || []).map(question),
  }));
}
