import { Avatar, Box, SvgIcon, Typography } from '@mui/material';
import { TestimonialTrack } from './TestimonialCarousel';
import { translate } from '../platform/i18n';

// "Success stories / Real people. Real results." on the home page, ported from the existing site's SuccessStoryBlock:
// the first story is featured with a large quote, the rest go in the card carousel.
function DoubleQuote() {
  return <SvgIcon viewBox="0 0 25 18" sx={{ width: 25, height: 18, position: { xs: 'static', lg: 'absolute' }, top: { lg: 4 }, insetInlineStart: { lg: -45 }, '[dir=rtl] &': { transform: 'scaleX(-1)' } }}>
    <path d="M23.2143 3.43323e-05H17.8571L14.2857 7.14289L14.2857 17.8572H25V7.14289H19.6429L23.2143 3.43323e-05ZM8.92857 3.43323e-05H3.57143L0 7.14289V17.8572L10.7143 17.8572L10.7143 7.14289H5.35714L8.92857 3.43323e-05Z" />
  </SvgIcon>;
}

const authorName = author => { const i = (author || '').indexOf(','); return i === -1 ? author || '' : author.slice(0, i); };
const heading = { fontSize: '3.2rem', fontWeight: 500, color: 'text.primary', textAlign: 'center' };

export default function HomeSuccessStories({ stories, locale = 'en' }) {
  const items = stories.filter(story => story.author && story.description && story.featuredImageUrl);
  if (!items.length) return null;
  const [first, ...rest] = items;
  const t = (section, key) => translate(locale, section, key);
  return <Box component="section" aria-label={t('SuccessStories', 'successStories')} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#f3f3f3', width: 1, py: '70px', gap: '4rem' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <Box sx={{ mx: 'auto', width: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4rem' }}>
        <Typography component="h2" sx={heading}>{t('SuccessStories', 'successStories')}</Typography>
        <Typography component="p" sx={heading}>{t('HomePage', 'realPeopleRealResults')}</Typography>
        <Box sx={{ display: 'flex', width: 1, mx: 'auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, alignItems: 'center', justifyContent: 'center', gap: 9, flexDirection: { xs: 'column', lg: 'row' }, p: { sm: '0 2rem', lg: '0 8rem' } }}>
          <Avatar variant="circular" src={first.featuredImageUrl} alt="" sx={{ width: 200, height: 200, flexShrink: 0 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
            <DoubleQuote />
            <Typography sx={{ fontSize: '2.4rem' }}>{first.description}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Typography sx={{ fontSize: '1.6rem' }}>- {authorName(first.author)}</Typography>
              <a href={`/successstories/${first.path}`} style={{ color: 'var(--link-color)' }}>{t('SuccessStories', 'viewSuccessStory')}</a>
            </Box>
          </Box>
        </Box>
      </Box>
      {rest.length > 0 && <Box sx={{ display: 'flex', position: 'relative', width: 1, mx: 'auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, alignItems: 'center' }}>
        <Box sx={{ width: 1 }}><TestimonialTrack items={rest} locale={locale} /></Box>
      </Box>}
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <a href={`/successstories${locale === 'en' ? '' : `?lang=${locale}`}`} aria-label={t('HomePage', 'seeMoreStories')} style={{ color: 'var(--link-color)' }}>{t('HomePage', 'seeMore')}</a>
    </Box>
  </Box>;
}
