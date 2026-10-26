// Saves how far a learner has watched a video (a fraction from 0 to 1) to this site's own route, which passes it on to the learning
// service. Used by both video players. Only the furthest point reached is ever sent, at most one request at a time, at most every two
// seconds unless forced (pause, end, leaving the page), and a failed save can be retried. Nothing is sent for a finished video.
export function createProgressSaver({ courseId, lessonId, taskId, initial = 0, finished = false, onSaved = () => {}, onFailure = () => {}, fetcher = (...args) => fetch(...args), now = () => Date.now(), interval = 2000 }) {
  let inFlight = false, pending = null, failed = null, sent = Number(initial) || 0, lastSentAt = 0, disposed = false;
  async function drain() {
    if (inFlight || pending === null) return;
    const progress = pending; pending = null; inFlight = true;
    try {
      const response = await fetcher('/api/execution/video-progress', {
        method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lessonId, taskId, progress }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Unable to save video progress.');
      sent = Math.max(sent, progress); failed = null;
      if (!disposed) onSaved(body);
    } catch (error) {
      failed = Math.max(progress, pending ?? 0); pending = null;
      if (!disposed) onFailure(error.message || 'Unable to save video progress.');
    } finally {
      inFlight = false;
      if (pending !== null) void drain();
    }
  }
  return {
    save(progress, force = false) {
      if (finished || !Number.isFinite(progress) || progress <= sent) return;
      pending = Math.max(pending ?? 0, Math.min(1, progress));
      if (force || now() - lastSentAt >= interval) { lastSentAt = now(); void drain(); }
    },
    retry() { if (failed !== null) { pending = Math.max(failed, pending ?? 0); void drain(); } },
    dispose() { disposed = true; },
  };
}
