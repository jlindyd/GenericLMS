import { useRef } from 'react';
import { Avatar, Box, Card, CardContent, IconButton, Stack, SvgIcon, Typography } from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import { translate } from '../platform/i18n';

// Success story cards, as on the existing About page: three cards across on wide screens, two on tablets, one on phones.
function QuoteIcon() {
  return <SvgIcon viewBox="0 0 25 18" sx={{ width: 25, height: 18, '[dir=rtl] &': { transform: 'scaleX(-1)' } }}>
    <path d="M23.2143 3.43323e-05H17.8571L14.2857 7.14289L14.2857 17.8572H25V7.14289H19.6429L23.2143 3.43323e-05ZM8.92857 3.43323e-05H3.57143L0 7.14289V17.8572L10.7143 17.8572L10.7143 7.14289H5.35714L8.92857 3.43323e-05Z" />
  </SvgIcon>;
}

function Testimonial({ story, locale }) {
  const view = translate(locale, 'SuccessStories', 'viewSuccessStory');
  return <Card sx={{ position: 'relative', maxWidth: 368, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 7, borderRadius: '12px', p: '20px 20px 10px 20px', boxShadow: '0px 1px 18px 0px #0000001F, 0px 6px 10px 0px #00000024, 0px 3px 5px -1px #00000033' }}>
    <Stack direction="row" sx={{ gap: 6, alignItems: 'center' }}>
      <Avatar variant="circular" src={story.featuredImageUrl} alt="" sx={{ width: 100, height: 100 }} />
      <Stack>
        <Typography component="p" sx={{ fontSize: 14, textAlign: 'start' }}>{story.author}</Typography>
        <a href={`/successstories/${story.path}`} aria-label={`${view} ${story.author || ''}`} style={{ fontSize: 14, textAlign: 'start', color: 'var(--link-color)' }}>{view}</a>
      </Stack>
    </Stack>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 0 }}>
      <QuoteIcon />
      <Typography sx={{ fontSize: 16, textAlign: 'start' }}>{story.description}</Typography>
    </CardContent>
  </Card>;
}

// The row of cards with its arrows (also used by the home page's success stories block).
export function TestimonialTrack({ items, locale = 'en' }) {
  const track = useRef(null);
  const move = direction => { const el = track.current; if (el) el.scrollBy({ left: direction * (el.clientWidth * 0.9), behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  return (
  <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    {items.length > 1 && <IconButton onClick={() => move(-1)} aria-label="Previous" sx={{ position: 'absolute', insetInlineStart: { xs: -8, lg: -48 }, zIndex: 2, display: { xs: 'none', md: 'inline-flex' } }}><NavigateBefore sx={{ color: 'grey.600', width: 40, height: 40 }} /></IconButton>}
    <Box ref={track} tabIndex={0} aria-label={translate(locale, 'SuccessStories', 'successStories')} sx={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', py: '2rem', width: 1, maxWidth: { xs: 420, md: 'none' }, mx: 'auto', px: { md: '1rem' }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, '& > *:first-of-type': { ml: { xs: '-50px', md: '-31px', lg: '-22px' } } }}>
      {items.map(story => <Box key={story.path} sx={{ flex: { xs: '0 0 100%', md: '0 0 50%', lg: '0 0 33%' }, pl: { xs: '50px', md: '31px', lg: '37px' }, scrollSnapAlign: 'start', display: 'flex' }}><Testimonial story={story} locale={locale} /></Box>)}
    </Box>
    {items.length > 1 && <IconButton onClick={() => move(1)} aria-label="Next" sx={{ position: 'absolute', insetInlineEnd: { xs: -8, lg: -48 }, zIndex: 2, display: { xs: 'none', md: 'inline-flex' } }}><NavigateNext sx={{ color: 'grey.600', width: 40, height: 40 }} /></IconButton>}
  </Box>
  );
}

// padTop: the success story page adds 40px above the title; the About page does not.
export default function TestimonialCarousel({ stories, locale = 'en', padTop = false }) {
  const items = stories.filter(story => story.featuredImageUrl && story.description);
  if (!items.length) return null;
  return <Box component="section" sx={{ bgcolor: 'var(--body-bg-light)', pb: '4rem', pt: padTop ? '40px' : 0 }} aria-label={translate(locale, 'SuccessStories', 'successStories')}>
    <Stack sx={{ gap: 5, width: 1, textAlign: 'center', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, mx: 'auto' }}>
      <Typography component="p" sx={{ fontSize: 28 }}>{translate(locale, 'SuccessStories', 'successStories')}</Typography>
      <TestimonialTrack items={items} locale={locale} />
    </Stack>
  </Box>;
}
