import { useRef } from 'react';
import { Box, styled } from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';

// "My courses" carousel of the existing home page (DualCardCarousel): one course is centered, two sit side by side,
// more can be scrolled with the arrows. Slides snap into place; wide screens show two at a time.
const Section = styled('section')(({ theme }) => ({
  display: 'flex', alignItems: 'center', position: 'relative', width: '100%', margin: '0 auto', maxWidth: 450,
  [theme.breakpoints.between('md', 'lg')]: { maxWidth: 730 }, [theme.breakpoints.up('lg')]: { maxWidth: 1090 }, [theme.breakpoints.up('xl')]: { maxWidth: 1200 },
}));
const Arrow = styled('button', { shouldForwardProp: p => p !== 'side' })(({ theme, side }) => ({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', backgroundColor: 'rgba(224, 224, 224, 0.85)', zIndex: 2,
  [side === 'prev' ? 'insetInlineStart' : 'insetInlineEnd']: -7, [theme.breakpoints.between('md', 'lg')]: { [side === 'prev' ? 'insetInlineStart' : 'insetInlineEnd']: -16 },
  '&:focus-visible': { outline: '3px solid var(--focus-outline-color)', outlineOffset: 2 },
}));

export default function DualCarousel({ children, label = '' }) {
  const track = useRef(null);
  const slides = Array.isArray(children) ? children : [children];
  if (!slides.length) return null;
  const move = direction => { const el = track.current; if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  const solo = slides.length === 1;
  return <Section sx={solo ? { justifyContent: 'center' } : undefined}>
    <Box ref={track} role="region" aria-label={label} tabIndex={0} sx={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, ...(solo ? { justifyContent: 'center' } : {}) }}>
      {slides.map((slide, i) => <Box key={i} sx={{ scrollSnapAlign: 'start', boxSizing: 'border-box', p: '16px', minWidth: 0, ...(solo ? { flex: '0 0 auto', width: { xs: 380, md: 610 }, maxWidth: 1 } : { flex: { xs: '0 0 100%', md: '0 0 50%' } }) }}>{slide}</Box>)}
    </Box>
    {slides.length > 2 && <>
      <Arrow side="prev" type="button" onClick={() => move(-1)} aria-label="Previous"><NavigateBefore sx={{ color: 'grey.600', width: 40, height: 40 }} /></Arrow>
      <Arrow side="next" type="button" onClick={() => move(1)} aria-label="Next"><NavigateNext sx={{ color: 'grey.600', width: 40, height: 40 }} /></Arrow>
    </>}
  </Section>;
}
