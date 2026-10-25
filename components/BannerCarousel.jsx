import { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material';
import { Pause, PlayArrow } from '@mui/icons-material';
import { direction as directionOf } from '../platform/config';
import { translate } from '../platform/i18n';
import CmsContent from './CmsContent';

// Campaign banner carousel, as on the existing site (BeforeLoginNewsBanner + EmblaCarousel): every slide is a CMS page
// (feature scope news-banners-before-login) as wide as the viewport, in a grey band with padded slides, round dots and
// a play/pause button below. It slides on a loop every 4 seconds unless paused or the visitor prefers reduced motion;
// slides that are out of view are hidden from keyboard and screen readers.
// The band is as tall as the slide in view, so a short banner does not leave empty space below it on small screens.
const Viewport = styled('div', { shouldForwardProp: p => p !== 'after' })(({ after }) => ({ backgroundColor: after ? 'transparent' : '#f3f3f3', overflow: after ? 'hidden' : 'clip', '@media (prefers-reduced-motion: no-preference)': { transition: 'height 300ms ease' } }));
const Track = styled('div')({ display: 'flex', alignItems: 'flex-start', transition: 'transform 450ms ease' });
const Slide = styled('div', { shouldForwardProp: p => p !== 'after' })(({ theme, after }) => after
  ? { flex: '0 0 100%', minWidth: 0, display: 'flex', justifyContent: 'center', overflow: 'hidden', '& > div': { width: '100%', display: 'flex', justifyContent: 'center' } }
  : {
    flex: '0 0 100%', minWidth: 0, padding: '16px 16px 14px 16px',
    '& > div': { display: 'flex', justifyContent: 'center' },
    [theme.breakpoints.up('lg')]: { padding: '40px 40px 19px 40px' },
    [theme.breakpoints.between('md', 'lg')]: { padding: '20px 20px 16px 20px' },
  });
const Controls = styled('div', { shouldForwardProp: p => p !== 'after' })(({ theme, after }) => after
  ? { display: 'grid', justifyContent: 'center', gap: '1.2rem', padding: '10px 0', [theme.breakpoints.up('xl')]: { padding: '20px 0' } }
  : {
    display: 'grid', justifyContent: 'center', gap: '1.2rem', paddingBottom: 14, backgroundColor: '#f3f3f3',
    [theme.breakpoints.up('lg')]: { paddingBottom: 19 },
    [theme.breakpoints.between('md', 'lg')]: { paddingBottom: 16 },
  });
const Dots = styled('div')({ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 8 });
const Dot = styled('button', { shouldForwardProp: p => p !== 'isSelected' })(({ isSelected }) => ({
  appearance: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #808080', padding: 0, margin: 0,
  width: 12, height: 12, boxSizing: 'border-box', borderRadius: '50%', backgroundColor: isSelected ? '#36313d' : 'transparent',
  '&:focus-visible': { outline: '2px solid var(--focus-outline-color)', outlineOffset: 2 },
}));
const PlayPause = styled('button')(({ theme }) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'center', width: 36, height: 36,
  border: `1px solid ${theme.palette.grey[500]}`, background: theme.palette.common.white, color: theme.palette.text.primary, borderRadius: '50%', padding: 0, cursor: 'pointer',
  '&:hover': { background: theme.palette.grey[100] },
  '&:focus-visible': { outline: '2px solid var(--focus-outline-color)', outlineOffset: 2 },
  '& svg': { fontSize: '1.25rem' },
}));

// after: the signed-in home's news banners (no grey band or padding, 6 second slides) instead of the public home's campaign banners.
export default function BannerCarousel({ banners, locale = 'en', after = false, label = 'Campaigns' }) {
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(true);
  const many = banners.length > 1;
  const slides = useRef([]), [height, setHeight] = useState(null);
  useEffect(() => {
    const el = slides.current[index];
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const watcher = window.ResizeObserver ? new ResizeObserver(measure) : null;
    watcher?.observe(el);
    return () => watcher?.disconnect();
  }, [index, banners.length]);
  useEffect(() => {
    if (!playing || !many) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [playing, many, banners.length]);
  if (!banners.length) return null;
  const common = key => translate(locale, 'common', key);
  const rtl = directionOf(locale) === 'rtl';
  // A visitor who picks a slide takes control, as with the existing site's autoplay.
  const choose = i => { setPlaying(false); setIndex(i); };
  return <section dir={rtl ? 'rtl' : 'ltr'} aria-roledescription="carousel" aria-label={label}>
    <Viewport after={after ? 1 : undefined} style={height ? { height } : undefined}>
      <Track style={{ transform: `translateX(${(rtl ? 1 : -1) * index * 100}%)` }} aria-live={playing ? 'off' : 'polite'}>
        {banners.map((banner, i) => <Slide after={after ? 1 : undefined} key={banner.path} ref={el => { slides.current[i] = el; }} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${banners.length}`} aria-hidden={i !== index || undefined} inert={i !== index}>
          <CmsContent page={banner} id={banner.path} />
        </Slide>)}
      </Track>
    </Viewport>
    {many && <Controls after={after ? 1 : undefined}>
      <Dots>{banners.map((banner, i) => <Dot key={banner.path} type="button" isSelected={i === index} onClick={() => choose(i)} aria-label={`${i + 1} / ${banners.length}`} aria-current={i === index || undefined} />)}</Dots>
      <PlayPause type="button" onClick={() => setPlaying(p => !p)} aria-label={playing ? common('pauseCarousel') : common('playCarousel')}>{playing ? <Pause aria-hidden="true" /> : <PlayArrow aria-hidden="true" />}</PlayPause>
    </Controls>}
  </section>;
}
