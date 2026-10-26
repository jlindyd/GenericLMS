// SCORM 1.2 adapter for the same xAPI state/statement contracts used by LMSEXECUTION.
export function createScormApi({ endpoint, stateEndpoint, activityId, studentId, studentName, initialStates = [], fetcher = fetch, onError = () => {} }) {
  const state = new Map(), pending = new Map(), statements = [];
  let initialized = false, error = '0', detail = '', timer, running = false;
  const persistable = new Set(['cmi.core.lesson_location', 'cmi.suspend_data', 'cmi.core.lesson_status', 'cmi.core.score.raw']);
  for (const entry of initialStates) {
    if (!entry.stateId || typeof entry.content !== 'string') continue;
    let value = entry.content;
    // The old runtime persists {content}; package-written xAPI state can be raw text.
    try { const parsed = JSON.parse(value); if (typeof parsed?.content === 'string') value = parsed.content; } catch { /* raw state */ }
    state.set(entry.stateId, value);
  }
  const fail = message => { error = '101'; detail = message; onError(message); };
  const success = () => { error = '0'; detail = ''; };
  const ready = () => { if (initialized) { success(); return true; } error = '301'; detail = 'LMSInitialize must be called first.'; return false; };
  const request = async (url, method, payload, keepalive = false) => {
    const response = await fetcher(url, { method, keepalive, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(response.status === 401 ? 'Your session has expired. Sign in again before continuing.' : 'Unable to save activity progress. Please retry.');
  };
  async function drain() {
    if (running) return;
    running = true;
    try {
      while (pending.size || statements.length) {
        if (pending.size) {
          const [key, value] = pending.entries().next().value;
          await request(`${stateEndpoint}?stateId=${encodeURIComponent(key)}`, 'PUT', { content: value });
          if (pending.get(key) === value) pending.delete(key);
        } else {
          const statement = statements[0];
          await request(endpoint, 'POST', [statement]); statements.shift();
        }
      }
      onError('');
    } catch (e) { fail(e.message); } finally { running = false; }
  }
  const flush = () => { clearTimeout(timer); void drain(); };
  const statement = (verb, result) => {
    statements.push({ id: crypto.randomUUID(), verb: { id: `http://adlnet.gov/expapi/verbs/${verb}` }, object: { id: String(activityId) }, ...(result ? { result } : {}) });
    flush();
  };
  return {
    LMSInitialize() { if (initialized) return 'true'; initialized = true; success(); statement(state.size ? 'resumed' : 'attempted'); return 'true'; },
    LMSGetValue(element) {
      if (!ready()) return '';
      if (element === 'cmi.core.student_id') return String(studentId);
      if (element === 'cmi.core.student_name') return studentName || '';
      if (element === 'cmi.core._children') return 'student_id,student_name,lesson_status,score';
      if (element === 'cmi.core.entry') return initialStates.length ? 'resume' : 'ab-initio';
      return state.get(element) ?? '';
    },
    LMSSetValue(element, value) {
      if (!ready()) return 'false';
      value = String(value); state.set(element, value);
      if (persistable.has(element)) {
        pending.set(element, value);
        clearTimeout(timer); timer = setTimeout(flush, element === 'cmi.suspend_data' ? 300 : 0);
      }
      if (element === 'cmi.core.lesson_status' && ['passed', 'failed', 'completed'].includes(value.toLowerCase())) {
        const raw = state.get('cmi.core.score.raw');
        const result = raw?.trim() && Number.isFinite(Number(raw)) ? { score: { raw: Number(raw) } } : undefined;
        statement(value.toLowerCase(), result);
      }
      return 'true';
    },
    LMSCommit() { if (!ready()) return 'false'; flush(); return 'true'; },
    LMSFinish() { if (!ready()) return 'false'; statement('terminated'); initialized = false; return 'true'; },
    LMSGetLastError: () => error,
    LMSGetErrorString: code => ({ '0': 'No error', '101': 'General Exception', '301': 'Not Initialized' }[code] || ''),
    LMSGetDiagnostic: () => detail,
    _retry: flush,
    _finishWithKeepalive() {
      clearTimeout(timer);
      if (!initialized && !pending.size && !statements.length) return;
      // Same payloads, using keepalive so a route change can flush pending resume data.
      for (const [key, value] of pending) void request(`${stateEndpoint}?stateId=${encodeURIComponent(key)}`, 'PUT', { content: value }, true).catch(e => fail(e.message));
      pending.clear();
      const outstanding = statements.splice(0);
      if (initialized) outstanding.push({ verb: { id: 'http://adlnet.gov/expapi/verbs/terminated' }, object: { id: String(activityId) } });
      if (outstanding.length) void request(endpoint, 'POST', outstanding, true).catch(e => fail(e.message));
      initialized = false;
    },
  };
}
