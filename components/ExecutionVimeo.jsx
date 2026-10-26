import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { createProgressSaver } from '../platform/progress-saver';

const loadLimit = 60000;

// A Vimeo video in the course player. It resumes from the saved progress, keeps the learner from skipping ahead of what they have
// watched (unless the video allows skipping), and saves the furthest point reached, the way the Azure player does. Whether the video
// counts as finished is decided by the learning service, never by the player.
export default function ExecutionVimeo({ video, courseId, lessonId, onProgress }) {
  const host = useRef(null), retry = useRef(null), callback = useRef(onProgress);
  const [failure, setFailure] = useState(''), [loadFailure, setLoadFailure] = useState('');
  callback.current = onProgress;
  useEffect(() => {
    let player, disposed = false, reverting = false, duration = 0;
    let watched = Number(video.progress || 0);
    const finished = video.status === 'Finished';
    const tracked = !finished && !video.canSkipForward;
    const saver = createProgressSaver({ courseId, lessonId, taskId: video.id, initial: watched, finished, onSaved: body => { setFailure(''); callback.current(body); }, onFailure: setFailure });
    const save = (progress, force) => saver.save(progress, force);
    retry.current = () => saver.retry();
    // Jumping ahead of the watched point is undone; the position is put back and playback stays paused.
    async function revert() {
      if (reverting || !player || !(duration > 0)) return;
      reverting = true;
      try { await player.setCurrentTime(Math.max(0, watched * duration)); await player.pause(); } catch { /* the player is going away */ } finally { reverting = false; }
    }
    async function initialize() {
      try {
        const { default: Player } = await import('@vimeo/player');
        if (disposed) return;
        player = new Player(host.current, { url: video.url, responsive: true, dnt: true });
        await Promise.race([player.ready(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), loadLimit))]);
        if (disposed) return;
        host.current?.querySelector('iframe')?.setAttribute('title', video.name || 'Video');
        duration = await player.getDuration();
        if (disposed) return;
        player.on('error', () => { if (!disposed) setLoadFailure('The video could not be played. Please reload this page.'); });
        if (!finished && watched > 0 && duration > 0) { await player.setCurrentTime(Math.min(watched * duration, Math.max(0, duration - 1))); await player.pause(); }
        player.on('timeupdate', ({ seconds, percent, duration: length }) => {
          if (!tracked || reverting || !(length > 0)) return;
          duration = length;
          if (seconds > watched * length + 2) { void revert(); return; }
          watched = Math.max(watched, Math.min(1, Number.isFinite(percent) ? percent : seconds / length));
          save(watched);
        });
        player.on('seeked', ({ seconds, duration: length }) => { if (tracked && length > 0 && seconds > watched * length + 2) { duration = length; void revert(); } });
        player.on('pause', () => { if (tracked && !reverting) save(watched, true); });
        player.on('ended', () => { if (tracked && duration > 0 && watched * duration >= duration - 2) { watched = 1; save(1, true); } });
        // Like the existing player, a video that allows skipping counts as watched once it is opened.
        if (video.canSkipForward && !finished) save(1, true);
      } catch (error) {
        console.error('Vimeo player', error);
        // Vimeo names the reason: a missing or private video is not fixed by reloading.
        if (!disposed) setLoadFailure(['NotFoundError', 'PrivacyError'].includes(error?.name) ? 'This video is not available. Please contact support.' : 'The video player could not be loaded. Please reload this page.');
      }
    }
    void initialize();
    const flush = () => { if (tracked) save(watched, true); };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      flush(); disposed = true; saver.dispose(); retry.current = null;
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', visibility);
      try { void Promise.resolve(player?.destroy()).catch(() => {}); } catch { /* already gone */ }
    };
  }, [video.id, video.url, video.status, video.canSkipForward, courseId, lessonId]);
  return <Box>
    {loadFailure && <Alert severity="error" sx={{ mb: 2 }}>{loadFailure}</Alert>}
    {failure && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => retry.current?.()}>Retry</Button>}>{failure}</Alert>}
    <div ref={host} />
    {video.description && <Typography sx={{ mt: 2 }}>{video.description}</Typography>}
  </Box>;
}
