// Pure rules for assignments (what the learner can do, and which files are accepted). No server code, so the browser can import it.
export const defaultExtensions = ['.doc', '.docx', '.zip', '.rar', '.7zip'];
export const hardMaxBytes = 104857600; // never buffer more than 100 MB, whatever the service says

// What the learner can do, by the assignment's status (as in the old player).
export const files = assignment => (Array.isArray(assignment?.files) ? assignment.files : []);
export const canUpload = assignment => Boolean(assignment) && assignment.isEnabled !== false && ['NotStarted', 'Saved'].includes(assignment.status) && files(assignment).length === 0;
export const canSubmit = assignment => Boolean(assignment) && assignment.isEnabled !== false && assignment.status === 'Saved' && files(assignment).length > 0;
export const canRemove = assignment => Boolean(assignment) && assignment.isEnabled !== false && ['Saved', 'Failed'].includes(assignment.status) && files(assignment).length > 0;

// File checks before anything is sent: one file, within the assignment's size limit, of an allowed kind.
export function allowedExtensions(assignment) {
  const listed = String(assignment?.allowedFileExtensions || '').split(/[\s,;]+/).map(item => item.trim().toLowerCase()).filter(Boolean).map(item => (item.startsWith('.') ? item : `.${item}`));
  return listed.length ? listed : defaultExtensions;
}
export const sizeLimit = assignment => (Number.isFinite(assignment?.maxFileSize) && assignment.maxFileSize > 0 ? Math.min(assignment.maxFileSize, hardMaxBytes) : hardMaxBytes);
export function fileProblem(assignment, name, size) {
  const fileName = String(name ?? '');
  if (!fileName || fileName.length > 200 || /[\\/\u0000-\u001f]/.test(fileName)) return 'invalid';
  if (!Number.isInteger(size) || size <= 0) return 'empty';
  if (size > sizeLimit(assignment)) return 'size';
  const dot = fileName.lastIndexOf('.');
  if (dot < 0 || !allowedExtensions(assignment).includes(fileName.slice(dot).toLowerCase())) return 'type';
  if (Number.isFinite(assignment?.maxFileCount) && assignment.maxFileCount > 0 && files(assignment).length >= assignment.maxFileCount) return 'count';
  return null;
}
export const problemMessages = { invalid: 'That file name cannot be used.', empty: 'That file is empty.', size: 'That file is too large.', type: 'That kind of file is not accepted for this assignment.', count: 'No more files can be added.' };

