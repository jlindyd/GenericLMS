import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

export default function ExecutionVideo({ video, courseId, lessonId, onProgress }) {
  const host = useRef(null), retry = useRef(null), callback = useRef(onProgress);
  const [failure, setFailure] = useState('');
  callback.current = onProgress;
  useEffect(() => {
    let player, disposed = false, inFlight = false, pending = null, failed = null;
    let sent = Number(video.progress || 0), watched = sent, lastSentAt = 0;
    const finished = video.status === 'Finished';
    const tracked = !finished && !video.canSkipForward;
    async function drain() {
      if (inFlight || pending === null) return;
      const progress = pending; pending = null; inFlight = true;
      try {
        const response = await fetch('/api/execution/video-progress', {
          method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, lessonId, taskId: video.id, progress }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || 'Unable to save video progress.');
        sent = Math.max(sent, progress); failed = null;
        if (!disposed) { setFailure(''); callback.current(body); }
      } catch (error) {
        failed = Math.max(progress, pending ?? 0); pending = null;
        if (!disposed) setFailure(error.message || 'Unable to save video progress.');
      } finally {
        inFlight = false;
        if (pending !== null) void drain();
      }
    }
    function save(progress, force = false) {
      if (finished || progress <= sent) return;
      pending = Math.max(pending ?? 0, progress);
      if (force || Date.now() - lastSentAt >= 2000) { lastSentAt = Date.now(); void drain(); }
    }
    retry.current = () => { if (failed !== null) { pending = Math.max(failed, pending ?? 0); void drain(); } };
    async function initialize() {
      try {
        const { default: videojs } = await import('video.js');
        if (disposed) return;
        const element = document.createElement('video-js');
        host.current.appendChild(element);
        const url = video.url || '';
        player = videojs(element, {
          controls: true, fluid: true, responsive: true, preload: 'metadata',
          playbackRates: [0.5, 1, 1.5, 2],
          sources: [{ src: url, type: /\.m3u8(?:\?|$)/i.test(url) ? 'application/x-mpegURL' : 'video/mp4' }],
        });
        player.one('loadedmetadata', () => {
          if (!finished && watched > 0 && Number.isFinite(player.duration())) player.currentTime(watched * player.duration());
        });
        player.on('seeking', () => {
          if (tracked && player.currentTime() > watched * player.duration() + 1) player.currentTime(watched * player.duration());
        });
        player.on('timeupdate', () => {
          if (!tracked || player.seeking() || !Number.isFinite(player.duration()) || player.duration() <= 0) return;
          const seconds = player.currentTime(), duration = player.duration();
          // Do not allow a timeupdate event after a seek to advance the saved watermark.
          if (seconds > watched * duration + 2) { player.currentTime(watched * duration); return; }
          watched = Math.max(watched, Math.min(1, seconds / duration));
          save(watched);
        });
        player.on('pause', () => { if (tracked) save(watched, true); });
        player.on('ended', () => { if (tracked && watched * player.duration() >= player.duration() - 2) { watched = 1; save(1, true); } });
        player.on('error', () => { if (!disposed) setFailure('The video could not be loaded. Please reload this page.'); });
        // Match the original player: skippable videos are validated on opening.
        if (video.canSkipForward && !finished) save(1, true);
      } catch { if (!disposed) setFailure('The video player could not be loaded. Please reload this page.'); }
    }
    void initialize();
    const flush = () => { if (tracked) save(watched, true); };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      flush(); disposed = true; retry.current = null;
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', visibility);
      if (player && !player.isDisposed()) player.dispose();
    };
  }, [video.id, video.url, video.progress, video.canSkipForward, video.status, courseId, lessonId]);
  return <Box>
    {failure && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => retry.current?.()}>Retry</Button>}>{failure}</Alert>}
    <div ref={host} data-vjs-player />
    {video.description && <Typography sx={{ mt: 2 }}>{video.description}</Typography>}
  </Box>;
}
