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
const makeAssignments = () => ({
  41: { id: 41, name: 'Business plan assignment', type: 'Assignment', status: 'NotStarted', assignedTo: 'Trainee', isEnabled: true, body: '<p>Turn in a short business plan.</p>', minPassingScore: 0.6, maxFileSize: 5242880, maxFileCount: 1, allowedFileExtensions: '.doc,.docx,.zip', files: [] },
  42: { id: 42, name: 'Marketing assignment (graded)', type: 'Assignment', status: 'Passed', assignedTo: 'Trainee', isEnabled: true, body: '<p>Describe your marketing plan.</p>', minPassingScore: 0.6, score: 0.85, feedback: 'Clear and practical. Well done.', maxFileSize: 5242880, maxFileCount: 1, allowedFileExtensions: '.doc,.docx,.zip', files: [{ name: 'plan-42.docx', originalName: 'My marketing plan.docx', size: 20480, uploadDate: '2026-10-01T00:00:00Z', url: 'https://example.test/plan-42.docx' }] },
  43: { id: 43, name: 'Finance assignment (not passed)', type: 'Assignment', status: 'Failed', assignedTo: 'Trainee', isEnabled: true, body: '<p>Prepare a budget.</p>', minPassingScore: 0.6, score: 0.4, feedback: 'Please add the cash flow table.', maxFileSize: 5242880, maxFileCount: 1, allowedFileExtensions: '.doc,.docx,.zip', files: [{ name: 'budget-43.zip', originalName: 'budget.zip', size: 40960, uploadDate: '2026-10-02T00:00:00Z', url: 'https://example.test/budget-43.zip' }] },
});
// A public Vimeo video ("The Mountain"), so playback can be reviewed without a real course.
const makeVideos = () => ({
  51: { id: 51, name: 'Welcome video (Vimeo)', type: 'Video', provider: 'Vimeo', url: 'https://player.vimeo.com/video/22439234', status: 'NotStarted', progress: 0, canSkipForward: false, assignedTo: 'Trainee', isEnabled: true, description: 'A short introduction to the course.' },
  52: { id: 52, name: 'Watched video (Vimeo)', type: 'Video', provider: 'Vimeo', url: 'https://player.vimeo.com/video/22439234', status: 'Finished', progress: 1, canSkipForward: false, assignedTo: 'Trainee', isEnabled: true, description: 'Already finished; it can be replayed.' },
  53: { id: 53, name: 'Optional video (Vimeo, may skip)', type: 'Video', provider: 'Vimeo', url: 'https://player.vimeo.com/video/22439234', status: 'NotStarted', progress: 0, canSkipForward: true, assignedTo: 'Trainee', isEnabled: true, description: 'This video can be skipped through.' },
});
const shared = globalThis.__genericLmsFixtureForms || (globalThis.__genericLmsFixtureForms = { forms: make(), assignments: makeAssignments(), videos: makeVideos() });
shared.videos = shared.videos || makeVideos();
export const fixtureCourse = () => ({ id: 1, name: 'Strategic Planning in the AI Age', type: 'SelfPaced', progress: 0.25, lessons: [{ id: 11, name: 'Review', isEnabled: true, tasks: [...Object.values(shared.forms), ...Object.values(shared.assignments), ...Object.values(shared.videos)].map(f => ({ id: f.id, name: f.name, type: f.type, status: f.status, isEnabled: true })) }] });
export const fixtureVideo = id => { const item = shared.videos[id]; if (!item) throw new Error('No fixture for this request.'); return JSON.parse(JSON.stringify(item)); };
// A video's progress only moves forward; it is finished once it is (nearly) all watched, like the service.
export function fixtureVideoProgress(id, progress) {
  const item = shared.videos[id]; if (!item || item.status === 'Finished' || typeof progress !== 'number') return;
  item.progress = Math.max(item.progress, progress); item.status = item.progress >= 0.99 ? 'Finished' : 'InProgress';
}
export const fixtureAssignment = id => { const item = shared.assignments[id]; if (!item) throw new Error('No fixture for this request.'); return JSON.parse(JSON.stringify(item)); };
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
// Review-mode copies of the learner's assignment actions: a file is added, removed, or submitted for grading.
export function fixtureAssignmentChange(id, action, detail) {
  const item = shared.assignments[id]; if (!item) return;
  if (action === 'FILE') { item.files = [{ name: `file-${id}-${Date.now()}.bin`, originalName: detail.name, size: detail.size, uploadDate: new Date().toISOString(), url: 'https://example.test/' + encodeURIComponent(detail.name) }]; item.status = 'Saved'; }
  if (action === 'DELETE') { item.files = []; item.status = 'Saved'; }
  if (action === 'POST') item.status = 'WaitingForGrading';
}
export const resetFixtureForms = () => { shared.forms = make(); shared.assignments = makeAssignments(); shared.videos = makeVideos(); };
