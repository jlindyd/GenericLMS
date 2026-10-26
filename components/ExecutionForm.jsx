import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Alert, Box, Button, IconButton, Checkbox, FormControlLabel, FormHelperText, MenuItem, Paper, Radio, RadioGroup, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { changeAnswer, formAnswerable, missingRequired, savedAnswers, selectionErrors, timeAnswer, timeText } from '../platform/form-rules';
import { formText } from '../platform/form-text';
import { direction } from '../platform/config';

const Html = ({ html, component = 'div' }) => <Box component={component} className="editor-preview" sx={{ '& p': { my: 0 }, '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: html || '' }} />;
const sameList = (a = [], b = []) => a.length === b.length && a.every(item => b.includes(item));
// The site's global styles make form controls white, so they are coloured here.
const controlSx = { color: '#5c6770', '&.Mui-checked': { color: 'var(--primary-color, #024ad8)' }, '&.Mui-disabled': { color: '#9aa4ab' }, '& svg': { fontSize: 24 } };
const green = { color: 'success.main', fontWeight: 600 }, red = { color: 'error.main', fontWeight: 600 };

// How a chosen or expected option is marked once the learner has answered (quizzes carry the expected answers; other forms do not).
function mark(reveal, expected, id, selected) {
  if (!reveal || !Array.isArray(expected) || !expected.length) return null;
  const wanted = expected.includes(id);
  if (selected && wanted) return 'right';
  if (selected !== wanted) return 'wrong';
  return null;
}
const markSx = state => (state === 'right' ? green : state === 'wrong' ? red : undefined);
const markText = (state, t) => (state === 'right' ? ' ✓' : state === 'wrong' ? ' ✗' : '');

function ChoiceOption({ control, option, state, disabled, t }) {
  return <FormControlLabel disabled={disabled} control={control} sx={{ alignItems: 'flex-start', mr: 0, '& .MuiFormControlLabel-label': markSx(state) }} label={<><Html component="span" html={option.body} />{markText(state, t)}{state && <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{state === 'right' ? ' (correct)' : ' (not correct)'}</Box>}</>} />;
}

function Question({ q, answers, onChange, disabled, reveal, invalid, selectionError, t, number }) {
  const value = answers[q.id], describedBy = `q${q.id}-help`;
  const common = { disabled, 'aria-describedby': invalid || selectionError ? describedBy : undefined };
  if (q.type === 'Description') return <Box><Html html={q.body} /></Box>;
  const options = q.options || [];
  let input;
  switch (q.type) {
    case 'SingleLineText': input = <TextField fullWidth size="small" value={value ?? ''} onChange={e => onChange(q, e.target.value)} error={invalid} slotProps={{ htmlInput: { 'aria-labelledby': `q${q.id}-legend`, ...common } }} />; break;
    case 'MultiLineText': input = <TextField fullWidth multiline minRows={3} value={value ?? ''} onChange={e => onChange(q, e.target.value)} error={invalid} slotProps={{ htmlInput: { 'aria-labelledby': `q${q.id}-legend`, ...common } }} />; break;
    case 'Date': input = <TextField type="date" size="small" value={value ?? ''} onChange={e => onChange(q, e.target.value || undefined)} error={invalid} slotProps={{ htmlInput: { 'aria-labelledby': `q${q.id}-legend`, ...common }, inputLabel: { shrink: true } }} />; break;
    case 'DateTime': input = <TextField type="datetime-local" size="small" value={value ?? ''} onChange={e => onChange(q, e.target.value || undefined)} error={invalid} slotProps={{ htmlInput: { 'aria-labelledby': `q${q.id}-legend`, ...common }, inputLabel: { shrink: true } }} />; break;
    case 'Time': input = <TextField type="time" size="small" value={value ? timeText(value) : ''} onChange={e => onChange(q, timeAnswer(e.target.value))} error={invalid} slotProps={{ htmlInput: { 'aria-labelledby': `q${q.id}-legend`, ...common }, inputLabel: { shrink: true } }} />; break;
    case 'DropDown':
      input = <TextField select size="small" sx={{ minWidth: 240, maxWidth: '100%' }} value={value ?? ''} onChange={e => onChange(q, e.target.value === '' ? undefined : Number(e.target.value))} error={invalid} slotProps={{ select: { displayEmpty: true }, htmlInput: { 'aria-labelledby': `q${q.id}-legend`, ...common } }}>
        <MenuItem value=""><em>&nbsp;</em></MenuItem>{options.map(o => <MenuItem key={o.id} value={o.id} sx={{ fontSize: 16 }}>{String(o.body).replace(/<[^>]*>/g, '')}</MenuItem>)}</TextField>;
      break;
    case 'RadioBox':
      input = <RadioGroup value={value ?? ''} onChange={e => onChange(q, Number(e.target.value))}>{options.map(o => <ChoiceOption key={o.id} option={o} t={t} disabled={disabled} state={mark(reveal, q.expectedOptions, o.id, value === o.id)} control={<Radio sx={controlSx} value={o.id} />} />)}</RadioGroup>;
      break;
    case 'CheckBox':
      input = <Stack>{options.map(o => <ChoiceOption key={o.id} option={o} t={t} disabled={disabled} state={mark(reveal, q.expectedOptions, o.id, (value || []).includes(o.id))} control={<Checkbox sx={controlSx} checked={(value || []).includes(o.id)} onChange={() => onChange(q, o.id)} />} />)}</Stack>;
      break;
    case 'LinearScale': {
      const low = Number.isInteger(q.minValue) ? q.minValue : 1, high = Number.isInteger(q.maxValue) ? q.maxValue : 5;
      const points = Array.from({ length: Math.max(0, Math.min(high - low + 1, 50)) }, (_, i) => low + i);
      input = <Stack direction="row" alignItems="center" useFlexGap flexWrap="wrap" gap={1}>
        {q.minValueLabel && <Typography variant="body2">{q.minValueLabel}</Typography>}
        <RadioGroup row value={value ?? ''} onChange={e => onChange(q, Number(e.target.value))}>{points.map(p => <FormControlLabel key={p} disabled={disabled} value={p} control={<Radio sx={controlSx} />} label={p} labelPlacement="top" sx={{ mx: 0.5, ...(markSx(mark(reveal, Number.isFinite(q.expectedAnswer) ? [q.expectedAnswer] : [], p, value === p)) || {}) }} />)}</RadioGroup>
        {q.maxValueLabel && <Typography variant="body2">{q.maxValueLabel}</Typography>}
      </Stack>;
      break;
    }
    case 'RadioBoxGrid': case 'CheckBoxGrid': {
      const radio = q.type === 'RadioBoxGrid', grid = value && typeof value === 'object' ? value : {};
      input = <TableContainer><Table size="small" aria-labelledby={`q${q.id}-legend`}>
        <TableHead><TableRow><TableCell /> {options.map(o => <TableCell key={o.id} align="center"><Html component="span" html={o.body} /></TableCell>)}</TableRow></TableHead>
        <TableBody>{(q.subQuestions || []).map(sub => <TableRow key={sub.id}>
          <TableCell component="th" scope="row"><Html component="span" html={sub.body} /></TableCell>
          {options.map(o => { const on = radio ? grid[sub.id] === o.id : (grid[sub.id] || []).includes(o.id), state = mark(reveal, sub.expectedOptions, o.id, on); return <TableCell key={o.id} align="center" sx={markSx(state)}>
            {radio ? <Radio sx={controlSx} disabled={disabled} checked={on} onChange={() => onChange(q, o.id, sub.id)} slotProps={{ input: { 'aria-label': `${String(sub.body).replace(/<[^>]*>/g, '')}: ${String(o.body).replace(/<[^>]*>/g, '')}` } }} /> : <Checkbox sx={controlSx} disabled={disabled} checked={on} onChange={() => onChange(q, o.id, sub.id)} slotProps={{ input: { 'aria-label': `${String(sub.body).replace(/<[^>]*>/g, '')}: ${String(o.body).replace(/<[^>]*>/g, '')}` } }} />}{markText(state, t)}</TableCell>; })}
        </TableRow>)}</TableBody>
      </Table></TableContainer>;
      break;
    }
    default: input = null;
  }
  return <Box component="fieldset" id={`question-${q.id}`} aria-invalid={invalid || Boolean(selectionError)} sx={{ border: 0, m: 0, p: 2, borderRadius: 1, outline: invalid || selectionError ? '2px solid' : 'none', outlineColor: 'error.main', minWidth: 0 }}>
    <Typography component="legend" id={`q${q.id}-legend`} sx={{ fontSize: 17, mb: 1.5, p: 0 }}>
      {q.isRequired && <Typography component="span" sx={{ color: 'error.main', fontStyle: 'italic', display: 'block', fontSize: 14 }}>{t('QuestionsList.answerRequired')}</Typography>}
      <Html html={q.body} />
    </Typography>
    {input}
    {(invalid || selectionError) && <FormHelperText id={describedBy} error role="alert" sx={{ fontSize: 14 }}>{selectionError ? t(`validation.${selectionError.key}`, { count: selectionError.count }) : t('QuestionsList.answerRequired')}</FormHelperText>}
  </Box>;
}

// A survey, editable form or quiz inside the course player. Answers are sent to this site's own route, which checks them and asks the
// learning service to save or submit them; the status, progress and unlocked tasks shown afterwards are read back from the service.
export default function ExecutionForm({ form: initial, course, lessonId, taskId, locale = 'en', onProgress }) {
  const [form, setForm] = useState(initial);
  const [answers, setAnswers] = useState(() => savedAnswers(initial.questions));
  const [missing, setMissing] = useState([]), [errors, setErrors] = useState({}), [busy, setBusy] = useState(null), [failure, setFailure] = useState(''), [notice, setNotice] = useState('');
  const [resumed, setResumed] = useState(false), [retrying, setRetrying] = useState(false), [editing, setEditing] = useState(false), [step, setStep] = useState(0);
  const lastSaved = useRef(JSON.stringify(savedAnswers(initial.questions)));
  const t = (key, values) => formText(locale, key, values);
  const kind = String(form.type || '').toLowerCase(), status = form.status;
  const questions = form.questions || [];
  const answerable = formAnswerable(form);
  const finished = ['Finished', 'Passed'].includes(status), failed = status === 'Failed', saved = status === 'Saved';
  // Saved forms wait for "Resume"; finished ones for "Edit" (editable forms) or stay closed; a failed quiz waits for "Retry".
  const open = answerable && (kind === 'editableform' ? (!finished || editing) && (!saved || resumed) : kind === 'quiz' ? (!failed || retrying) && (!saved || resumed) : true);
  const reveal = ['finished', 'passed', 'failed'].includes(String(status).toLowerCase()) && !open;
  const display = String(form.questionDisplay) === 'Single' && questions.length > 1;
  const visible = display ? [questions[Math.min(step, questions.length - 1)]] : questions;
  const numbered = useMemo(() => { let n = 0; return Object.fromEntries(questions.map(q => [q.id, q.type === 'Description' ? 0 : ++n])); }, [questions]);

  function change(q, value, subId) {
    setAnswers(current => changeAnswer(current, q, value, subId));
    setMissing(current => current.filter(id => id !== q.id)); setErrors(current => { if (!current[q.id]) return current; const next = { ...current }; delete next[q.id]; return next; });
  }
  async function send(op, current) {
    setBusy(op); setFailure('');
    try {
      const response = await fetch('/api/execution/form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course.id, lessonId, taskId, op, answers: current }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Unable to save your answers. Reload before retrying.');
      setForm(body.form); const fresh = savedAnswers(body.form.questions); setAnswers(fresh); lastSaved.current = JSON.stringify(fresh);
      onProgress?.({ status: body.status, progress: body.progress, lessons: body.lessons });
      setResumed(false); setRetrying(false); setEditing(false);
      setNotice(op === 'save' ? t('saveBtn') : t('submitBtn'));
      return true;
    } catch (e) { setFailure(e.message); return false; } finally { setBusy(null); }
  }
  async function submit() {
    const absent = missingRequired(questions, answers), problems = selectionErrors(questions, answers);
    setMissing(absent); setErrors(problems);
    if (absent.length || Object.keys(problems).length) {
      const first = questions.find(q => absent.includes(q.id) || problems[q.id]);
      setFailure(t('FormTaskSubmitError.errorMessage'));
      if (display && first) setStep(questions.indexOf(first));
      setTimeout(() => document.getElementById(`question-${first?.id}`)?.scrollIntoView({ block: 'center' }), 0);
      // Like the existing player, answers given so far are kept when a submission is incomplete.
      if (JSON.stringify(answers) !== lastSaved.current) await send('save', answers).then(ok => { if (!ok) return; setResumed(true); setFailure(t('FormTaskSubmitError.errorMessage')); setMissing(absent); setErrors(problems); });
      return;
    }
    setFailure(''); await send('submit', answers);
  }
  const banner = (() => {
    if (kind === 'quiz' && (finished || failed) && !open) return <Alert severity={finished ? 'success' : 'error'} action={failed && answerable ? <Button color="inherit" onClick={() => setRetrying(true)}>{t('QuizFeedback.retryBtn')}</Button> : undefined}>
      <strong>{finished ? t('QuizFeedback.quizPassed') : t('QuizFeedback.quizFailed')}</strong>
      <Box>{t('QuizFeedback.gradeReceived')} {Math.round((form.score || 0) * 100)}%{Number.isFinite(form.minPassingScore) ? ` · ${t('QuizFeedback.toPassed')} ${Math.round(form.minPassingScore * 100)}%` : ''}</Box></Alert>;
    if (saved && !open) return <Alert severity="info" action={answerable ? <Button color="inherit" onClick={() => setResumed(true)}>{t(`${kind === 'quiz' ? 'QuizFeedback' : kind === 'survey' ? 'SurveyFeedback' : 'EditableFormFeedback'}.resumeBtn`)}</Button> : undefined}>{t(kind === 'quiz' ? 'QuizFeedback.quizSaved' : kind === 'survey' ? 'SurveyFeedback.surveySaved' : 'EditableFormFeedback.formSaved')}</Alert>;
    if (finished && kind !== 'quiz') return <Alert severity="success" action={kind === 'editableform' && answerable && !editing ? <Button color="inherit" onClick={() => setEditing(true)}>{t('EditableFormFeedback.editBtn')}</Button> : undefined}>{t(kind === 'survey' ? 'SurveyFeedback.taskCompleted' : 'EditableFormFeedback.formCompleted')}</Alert>;
    return null;
  })();
  const last = !display || step >= questions.length - 1;
  // The theme's base text is small, so the form sets its own sizes.
  return <Stack spacing={2} sx={{ '& .MuiFormControlLabel-label, & .MuiTableCell-root, & .MuiInputBase-input, & .MuiFormHelperText-root, & .MuiAlert-message': { fontSize: 16 } }}>
    <Box role="status" aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{notice}</Box>
    {banner}
    {form.body && <Html html={form.body} />}
    {failure && <Alert severity="error" role="alert" onClose={() => setFailure('')}>{failure}</Alert>}
    {questions.length === 0 ? null : <Paper variant="outlined" sx={{ p: { xs: 1, md: 2 } }}>
      {display && <Stack direction="row" alignItems="center" gap={1} sx={{ p: 1, flexWrap: 'wrap' }}>
        <IconButton aria-label={`${t('prev')}: ${t('QuestionNavigationBar.question', { count: Math.max(1, step) })}`} disabled={step <= 0} onClick={() => setStep(step - 1)} sx={{ transform: direction(locale) === 'rtl' ? 'scaleX(-1)' : 'none' }}><ChevronLeft /></IconButton>
        <TextField select size="small" label={t('QuestionNavigationBar.goToQuestion')} value={Math.min(step, questions.length - 1)} onChange={e => setStep(Number(e.target.value))} sx={{ minWidth: 200 }}>
          {questions.map((q, i) => <MenuItem key={q.id} value={i} sx={{ fontSize: 16 }}>{q.type === 'Description' ? '—' : t('QuestionNavigationBar.question', { count: numbered[q.id] })}{missing.includes(q.id) ? ' *' : ''}</MenuItem>)}</TextField>
        <IconButton aria-label={`${t('next')}: ${t('QuestionNavigationBar.question', { count: Math.min(questions.length, step + 2) })}`} disabled={last} onClick={() => setStep(step + 1)} sx={{ transform: direction(locale) === 'rtl' ? 'scaleX(-1)' : 'none' }}><ChevronRight /></IconButton>
      </Stack>}
      <Stack spacing={2}>{visible.map(q => <Question key={q.id} q={q} answers={answers} onChange={change} disabled={!open || Boolean(busy)} reveal={reveal} invalid={missing.includes(q.id)} selectionError={errors[q.id]} t={t} number={numbered[q.id]} />)}</Stack>
    </Paper>}
    {open && <Stack direction="row" useFlexGap flexWrap="wrap" gap={2} justifyContent="flex-end">
      {kind === 'editableform' && <Button variant="outlined" disabled={Boolean(busy)} onClick={() => send('save', answers)}>{busy === 'save' ? '…' : t('saveBtn')}</Button>}
      {(last || !display) && <Button variant="containedPrimary" disabled={Boolean(busy)} onClick={submit}>{busy === 'submit' ? '…' : t('submitBtn')}</Button>}
    </Stack>}
  </Stack>;
}
