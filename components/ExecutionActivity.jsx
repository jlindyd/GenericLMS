import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { activityBase, activityComplete, activityLaunch } from '../platform/activity';
import { createScormApi } from '../platform/scorm';

export default function ExecutionActivity({ activity, user, courseId, lessonId, onProgress }) {
  const [src, setSrc] = useState(''), [failure, setFailure] = useState('');
  const callback = useRef(onProgress), retry = useRef(null);
  callback.current = onProgress;
  useEffect(() => {
    let stopped = false, complete = activityComplete(activity.status), api;
    const controller = new AbortController();
    const base = activityBase(courseId, lessonId, activity.id);
    const report = value => { if (!stopped) setFailure(value); };
    if (activity.scormSupportEnabled) {
      api = createScormApi({ endpoint: base + '/xapi/statements', stateEndpoint: base + '/xapi/activities/state', activityId: activity.id, studentId: user.uuid, studentName: user.nickName, initialStates: activity.execution?.states, onError: report });
      window.API = api;
    }
    try { setSrc(activityLaunch(activity, user, base, window.location.origin)); }
    catch (error) { report(error.message); }
    async function refresh() {
      try {
        const response = await fetch(base + '/status', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to refresh activity progress. Please retry.');
        const data = await response.json();
        if (!stopped) { callback.current(data); complete = activityComplete(data.status); }
      } catch (error) { if (!stopped) report(error.message); }
    }
    async function watch() {
      if (stopped || complete) return;
      try {
        const response = await fetch(base + '/xapi/completion', { signal: controller.signal, cache: 'no-store' });
        if (response.ok) await refresh();
        else if (response.status === 401) { report('Your session has expired. Sign in again before continuing.'); return; }
      } catch { /* A closed/expired completion wait reconnects; periodic reads cover missed events. */ }
      if (!stopped && !complete) reconnect = setTimeout(watch, 2000);
    }
    let reconnect;
    retry.current = () => { api?._retry(); void refresh(); };
    void watch();
    const poll = setInterval(() => { if (!complete && !document.hidden) void refresh(); }, 15000);
    const finish = () => api?._finishWithKeepalive();
    window.addEventListener('pagehide', finish);
    return () => {
      stopped = true; controller.abort(); clearTimeout(reconnect); clearInterval(poll);
      window.removeEventListener('pagehide', finish); finish();
      if (window.API === api) delete window.API;
      retry.current = null;
    };
  }, [activity.id, courseId, lessonId]);
  return <Box>
    {failure && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => retry.current?.()}>Retry</Button>}>{failure}</Alert>}
    {src ? <iframe src={src} title={activity.name || 'Learning activity'} allowFullScreen referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', height: 'min(780px, 78vh)', minHeight: 420, border: 0 }} /> : !failure && <CircularProgress aria-label="Loading activity" />}
  </Box>;
}
