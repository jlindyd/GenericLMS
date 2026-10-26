import { useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Link, Paper, Stack, Typography } from '@mui/material';
import { DeleteOutline, InsertDriveFileOutlined } from '@mui/icons-material';
import { allowedExtensions, canRemove, canSubmit, canUpload, fileProblem, problemMessages, sizeLimit } from '../platform/assignment-rules';
import { formText } from '../platform/form-text';

const oneMegabyte = 1048576;
const percent = value => (Number.isFinite(value) ? Math.round(value * 100) : null);
const tone = { WaitingForGrading: 'info', Passed: 'success', Failed: 'error' };

// An assignment inside the course player: turn in one file, submit it, and see the grade and the grader's comment. The file goes to
// this site's own routes, which check it against the assignment's limits before it is passed to the learning service; the status
// shown afterwards is read back from the service.
export default function ExecutionAssignment({ assignment: initial, course, lessonId, taskId, locale = 'en', onProgress }) {
  const [assignment, setAssignment] = useState(initial);
  const [busy, setBusy] = useState(''), [failure, setFailure] = useState(''), [confirming, setConfirming] = useState(false), [notice, setNotice] = useState('');
  const input = useRef(null);
  const t = (key, values) => formText(locale, key, values);
  const file = assignment.files?.[0];
  const headings = { NotStarted: 'NoSubmitted', Saved: file ? null : 'NoSubmitted', WaitingForGrading: 'Submitted', Passed: 'Approved', Failed: 'Failed' };
  const heading = assignment.status in headings ? headings[assignment.status] : 'NoSubmitted'; // a saved assignment with a file has no heading, as in the existing player
  const graded = ['Passed', 'Failed'].includes(assignment.status);
  const limitMb = (sizeLimit(assignment) / oneMegabyte).toFixed(2);

  function apply(body, message) {
    setAssignment(body.assignment); setNotice(message);
    onProgress?.({ status: body.status, progress: body.progress, lessons: body.lessons });
  }
  async function call(label, request, message) {
    setBusy(label); setFailure('');
    try {
      const response = await request();
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'The change could not be saved. Reload before retrying.');
      apply(body, message); return true;
    } catch (e) { setFailure(e.message); return false; } finally { setBusy(''); }
  }
  const ids = { courseId: course.id, lessonId, taskId };
  const act = (op, extra = {}) => fetch('/api/execution/assignment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ids, op, ...extra }) });
  function choose(event) {
    const picked = event.target.files?.[0]; event.target.value = '';
    if (!picked) return;
    const problem = fileProblem(assignment, picked.name, picked.size);
    if (problem === 'size') { setFailure(t('Assignment.FileSizeValidation', { maxfileSize: limitMb })); return; }
    if (problem) { setFailure(problemMessages[problem]); return; }
    const query = new URLSearchParams({ courseId: String(course.id), lessonId: String(lessonId), taskId: String(taskId), name: picked.name });
    call('upload', () => fetch(`/api/execution/assignment-file?${query}`, { method: 'POST', headers: { 'Content-Type': picked.type || 'application/octet-stream' }, body: picked }), picked.name);
  }
  async function submit() { setConfirming(false); await call('submit', () => act('submit'), t('Assignment.Submitted')); }
  const working = Boolean(busy);
  return <Stack spacing={2}>
    <Box role="status" aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{notice}</Box>
    {assignment.body && <Box className="editor-preview" dangerouslySetInnerHTML={{ __html: assignment.body }} />}
    {failure && <Alert severity="error" role="alert" onClose={() => setFailure('')}>{failure}</Alert>}
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2}>
      {heading && <Alert severity={tone[assignment.status] || 'info'} icon={false} sx={{ fontSize: 16 }}>{t(`Assignment.${heading}`)}</Alert>}
      {canUpload(assignment) && <Box sx={{ fontSize: 16 }}><p style={{ margin: 0 }}>{t('Assignment.UploadFile')}</p><p style={{ margin: '4px 0 0' }}>{t('Assignment.UploadZip')}</p></Box>}
      {file && <Stack direction="row" alignItems="center" gap={1} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        <InsertDriveFileOutlined aria-hidden="true" sx={{ color: '#5c6770' }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>{file.url ? <Link href={file.url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 16, overflowWrap: 'anywhere' }}>{file.originalName || file.name}</Link> : <Typography sx={{ fontSize: 16, overflowWrap: 'anywhere' }}>{file.originalName || file.name}</Typography>}
          {Number.isFinite(file.size) && <Typography sx={{ fontSize: 14, color: '#4a5560' }}>{(file.size / oneMegabyte).toFixed(2)} MB</Typography>}</Box>
        {canRemove(assignment) && <IconButton aria-label={`${file.originalName || file.name}: remove`} disabled={working} onClick={() => call('remove', () => act('remove', { fileName: file.name }), '')}><DeleteOutline /></IconButton>}
      </Stack>}
      {graded && <Box sx={{ fontSize: 16 }}>
        {percent(assignment.minPassingScore) !== null && <p style={{ margin: '0 0 4px' }}><strong>{t('Assignment.MinimumGrade')}:</strong> {percent(assignment.minPassingScore)}</p>}
        {percent(assignment.score) !== null && <p style={{ margin: '0 0 4px' }}><strong>{t('Assignment.Grade')}:</strong> {percent(assignment.score)}</p>}
        {assignment.feedback && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}><strong>{t('Assignment.Feedback')}:</strong> {assignment.feedback}</p>}
      </Box>}
      <Stack direction="row" gap={2} flexWrap="wrap" useFlexGap>
        {canUpload(assignment) && <><Button variant="containedPrimary" disabled={working} onClick={() => input.current?.click()}>{busy === 'upload' ? '…' : t('Assignment.Upload')}</Button>
          <input ref={input} type="file" hidden accept={allowedExtensions(assignment).join(',')} onChange={choose} /></>}
        {canSubmit(assignment) && <Button variant="containedPrimary" disabled={working} onClick={() => setConfirming(true)}>{busy === 'submit' ? '…' : t('submitBtn')}</Button>}
      </Stack>
      {canUpload(assignment) && <Typography sx={{ fontSize: 14, color: '#4a5560' }}>{t('Assignment.FileSizeValidation', { maxfileSize: limitMb })}</Typography>}
    </Stack></Paper>
    <Dialog open={confirming} onClose={() => setConfirming(false)} aria-labelledby="assignment-confirm-title">
      <DialogTitle id="assignment-confirm-title">{t('submitBtn')}</DialogTitle>
      <DialogContent><DialogContentText>{t('Assignment.ConfirmationMessage')}</DialogContentText></DialogContent>
      <DialogActions><Button onClick={() => setConfirming(false)}>{t('cancelBtn')}</Button><Button variant="containedPrimary" onClick={submit}>{t('submitBtn')}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
