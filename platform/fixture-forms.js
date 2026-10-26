// A small self-paced course with a survey, an editable form and a quiz, for reviewing the form tasks without a learner account.
// Used only in review mode (GENERIC_LMS_FIXTURES=1 with the cookie "fixture"). Answers are kept in this server's memory and nothing is sent anywhere.
const opts = (...texts) => texts.map((body, i) => ({ id: i + 1, body, order: i }));
const make = () => ({
  31: { id: 31, name: 'Course feedback survey', type: 'Survey', status: 'NotStarted', assignedTo: 'Trainee', isEnabled: true, questionDisplay: 'All', body: '<p>Tell us what you thought of the course.</p>', questions: [
    { id: 311, type: 'RadioBox', isRequired: true, body: '<p>How would you rate the course?</p>', options: opts('Excellent', 'Good', 'Fair', 'Poor') },
    { id: 312, type: 'CheckBox', isRequired: false, body: '<p>Which topics helped most? (choose up to two)</p>', options: opts('Planning', 'Budgets', 'Marketing'), minSelectionCount: null, maxSelectionCount: 2 },
    { id: 313, type: 'LinearScale', isRequired: true, body: '<p>How likely are you to recommend it?</p>', minValue: 1, maxValue: 5, minValueLabel: 'Unlikely', maxValueLabel: 'Very likely' },
    { id: 314, type: 'MultiLineText', isRequired: false, body: '<p>Any other comments?</p>' },
    { id: 315, type: 'DropDown', isRequired: false, body: '<p>Where did you hear about it?</p>', options: opts('A friend', 'Search', 'Social media') },
  ] },
  32: { id: 32, name: 'Planning quiz', type: 'Quiz', status: 'NotStarted', assignedTo: 'Trainee', isEnabled: true, questionDisplay: 'Single', minPassingScore: 0.6, score: 0, isAutoCorrectionEnabled: true, body: '<p>Answer the questions, one at a time.</p>', questions: [
    { id: 321, type: 'RadioBox', isRequired: true, body: '<p>A strategic plan starts with…</p>', options: opts('A vision', 'A logo', 'A holiday'), expectedOptions: [1] },
    { id: 322, type: 'CheckBox', isRequired: true, body: '<p>Pick the planning tools.</p>', options: opts('SWOT', 'Gantt', 'Crossword'), expectedOptions: [1, 2], minSelectionCount: 1, maxSelectionCount: 3 },
    { id: 323, type: 'RadioBoxGrid', isRequired: true, body: '<p>Match each term.</p>', options: opts('Short term', 'Long term'), subQuestions: [{ id: 3231, body: 'Daily tasks', expectedOptions: [1] }, { id: 3232, body: 'Vision', expectedOptions: [2] }] },
  ] },
  33: { id: 33, name: 'My action plan', type: 'EditableForm', status: 'NotStarted', assignedTo: 'Trainee', isEnabled: true, questionDisplay: 'All', body: '<p>Write your plan. You can save it and come back.</p>', questions: [
    { id: 331, type: 'SingleLineText', isRequired: true, body: '<p>Goal</p>' },
    { id: 332, type: 'Date', isRequired: false, body: '<p>Target date</p>' },
    { id: 333, type: 'Time', isRequired: false, body: '<p>Daily reminder time</p>' },
    { id: 334, type: 'Description', isRequired: false, body: '<p><em>Keep it short and specific.</em></p>' },
    { id: 335, type: 'CheckBoxGrid', isRequired: false, body: '<p>When can you work on it?</p>', options: opts('Morning', 'Evening'), subQuestions: [{ id: 3351, body: 'Weekdays' }, { id: 3352, body: 'Weekends' }] },
  ] },
});
// Pages and API routes are bundled separately, so the review data lives on globalThis to be shared between them.
const shared = globalThis.__genericLmsFixtureForms || (globalThis.__genericLmsFixtureForms = { forms: make() });
export const fixtureCourse = () => ({ id: 1, name: 'Strategic Planning in the AI Age', type: 'SelfPaced', progress: 0.25, lessons: [{ id: 11, name: 'Review', isEnabled: true, tasks: Object.values(shared.forms).map(f => ({ id: f.id, name: f.name, type: f.type, status: f.status, isEnabled: true })) }] });
export const fixtureForm = id => { const form = shared.forms[id]; if (!form) throw new Error('No fixture for this request.'); return JSON.parse(JSON.stringify(form)); };

// The learner's answers are written back into the questions, the way the service returns them.
export function fixtureSubmit(id, { op, answers }) {
  const form = shared.forms[id]; if (!form) return;
  for (const q of form.questions) {
    const a = answers[q.id]; if (a === undefined) continue;
    if (['RadioBox', 'DropDown'].includes(q.type)) q.selectedOptions = [a];
    else if (q.type === 'CheckBox') q.selectedOptions = a;
    else if (['RadioBoxGrid', 'CheckBoxGrid'].includes(q.type)) for (const sub of q.subQuestions) { const v = a[sub.id]; if (v !== undefined) sub.selectedOptions = Array.isArray(v) ? v : [v]; }
    else q.actualAnswer = a;
  }
  if (op === 'save') { form.status = 'Saved'; return; }
  if (form.type === 'Quiz') {
    const checks = form.questions.flatMap(q => q.type === 'RadioBoxGrid' ? q.subQuestions.map(s => [s.selectedOptions || [], s.expectedOptions]) : [[q.selectedOptions || [], q.expectedOptions]]);
    const right = checks.filter(([got, want]) => got.length === want.length && want.every(x => got.includes(x))).length;
    form.score = right / checks.length; form.status = form.score >= form.minPassingScore ? 'Passed' : 'Failed';
  } else form.status = 'Finished';
}
export const resetFixtureForms = () => { shared.forms = make(); };
