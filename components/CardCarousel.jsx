import { useRef } from 'react';
import { Box, IconButton } from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';

// Cards in a row you can scroll: three across on wide screens, two on tablets, one on phones, with previous and next arrows.
// The two existing carousels differ only in their gutters (course page: 25px/35px, "Explore our courses": 30px/37px at wide widths).
const gutters = { course: { lg: [-25, 35] }, explore: { lg: [-30, 37] }, latest: { lg: [-22, 37] } };

export default function CardCarousel({ children, variant = 'course', label = '' }) {
  const track = useRef(null);
  const slides = Array.isArray(children) ? children : [children];
  const [margin, pad] = gutters[variant].lg;
  const move = direction => { const el = track.current; if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  return <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: 1 }}>
    {slides.length > 1 && <IconButton onClick={() => move(-1)} aria-label="Previous" sx={{ position: 'absolute', insetInlineStart: { xs: -8, lg: -48 }, zIndex: 2, display: { xs: 'none', md: 'inline-flex' } }}><NavigateBefore sx={{ color: 'grey.600', width: 40, height: 40 }} /></IconButton>}
    <Box ref={track} role="region" tabIndex={0} aria-label={label} sx={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', py: '2rem', width: 1, maxWidth: { xs: 420, md: 'none' }, mx: 'auto', px: { md: '1rem' }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, '& > *:first-of-type': { ml: { xs: '-50px', md: '-31px', lg: `${margin}px` } } }}>
      {slides.map((slide, i) => <Box key={i} sx={{ flex: { xs: '0 0 100%', md: '0 0 50%', lg: '0 0 33%' }, pl: { xs: '50px', md: '31px', lg: `${pad}px` }, scrollSnapAlign: 'start', display: 'flex' }}>{slide}</Box>)}
    </Box>
    {slides.length > 1 && <IconButton onClick={() => move(1)} aria-label="Next" sx={{ position: 'absolute', insetInlineEnd: { xs: -8, lg: -48 }, zIndex: 2, display: { xs: 'none', md: 'inline-flex' } }}><NavigateNext sx={{ color: 'grey.600', width: 40, height: 40 }} /></IconButton>}
  </Box>;
}
