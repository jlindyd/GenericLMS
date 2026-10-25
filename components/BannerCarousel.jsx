import { useEffect, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { Pause, PlayArrow } from '@mui/icons-material';
import { translate } from '../platform/i18n';
import CmsContent from './CmsContent';

// Campaign banner carousel. Each slide is a CMS page (feature scope news-banners-before-login) shown with its own CSS.
// Slides rotate every 7 seconds unless paused or the visitor prefers reduced motion.
export default function BannerCarousel({ banners, locale = 'en' }) {
  const [index, setIndex] = useState(0), [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || banners.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % banners.length), 7000);
    return () => clearInterval(timer);
  }, [paused, banners.length]);
  if (!banners.length) return null;
  const common = key => translate(locale, 'common', key);
  return <Box component="section" aria-roledescription="carousel" aria-label="Campaigns" sx={{ position: 'relative', backgroundColor: 'var(--body-bg-light)' }}>
    {banners.map((banner, i) => <div key={banner.path} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${banners.length}`} hidden={i !== index}>
      <CmsContent page={banner} id={banner.path} />
    </div>)}
    {banners.length > 1 && <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', pb: 6 }}>
      <Box sx={{ display: 'flex', gap: '10px' }}>
        {banners.map((banner, i) => <button key={banner.path} type="button" onClick={() => setIndex(i)} aria-label={`${i + 1} / ${banners.length}`} aria-current={i === index} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #5a5a5a', background: i === index ? '#5a5a5a' : 'transparent', cursor: 'pointer', padding: 0 }} />)}
      </Box>
      <IconButton onClick={() => setPaused(p => !p)} aria-label={paused ? common('playCarousel') : common('pauseCarousel')} sx={{ border: '1px solid #5a5a5a', width: 40, height: 40 }}>{paused ? <PlayArrow /> : <Pause />}</IconButton>
    </Box>}
  </Box>;
}
