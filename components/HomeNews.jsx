import { Box, Divider, styled } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import HomeSection from './HomeSection';
import { formatLongDate } from '../platform/dates';
import { translate } from '../platform/i18n';

// "HP LIFE News" strip at the bottom of the home page, ported from the existing site's NewsBannerSection and NewsCard:
// one highlighted article with its picture and up to three more as text, shown from tablet width up (phones do not get it).
const Card = styled('div')({ display: 'flex', flexDirection: 'column', width: '100%' });
const Picture = styled('div')({ display: 'block', borderRadius: 5, width: '100%', paddingBottom: '64%', overflow: 'hidden', position: 'relative', marginBottom: 'var(--space)', '& img, & div': { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 } });
const Body = styled('div')({ display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left', '[dir=rtl] &': { textAlign: 'right' } });
const CardLink = styled('a')({ color: 'var(--text-color)', textDecoration: 'none', cursor: 'pointer' });

function NewsCard({ item, locale, showImage }) {
  return <Card><CardLink href={`/news/${item.path}${locale === 'en' ? '' : `?lang=${locale}`}`}>
    {showImage && <Picture>{item.featuredImageUrl ? <img src={item.featuredImageUrl} alt={item.heading || ''} /> : <div style={{ background: '#e0e0e0' }} />}</Picture>}
    <Body>
      <div style={{ fontSize: '2rem', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', margin: 'var(--space-xs) 0' }}>{item.heading}</div>
      {item.publishDate && <div className="newsCardPublishDate">{formatLongDate(item.publishDate, locale)}</div>}
      {item.description && <div className="newsCardDescription">{item.description}</div>}
    </Body>
  </CardLink></Card>;
}

const Wrapper = styled('div')(({ theme }) => ({ display: 'flex', flexDirection: 'column', gap: '3rem', textAlign: 'center', [theme.breakpoints.up('lg')]: { flexDirection: 'row' } }));
const Highlight = styled('div')(({ theme }) => ({ display: 'flex', flexDirection: 'column', width: '100%', [theme.breakpoints.up('lg')]: { width: '50%' } }));
const List = styled('div')(({ theme }) => ({
  display: 'flex', flexDirection: 'column', gap: '3rem', marginTop: 'var(--space-xlg)',
  [theme.breakpoints.up('md')]: { width: '100%', textAlign: 'left', marginTop: 0, '[dir=rtl] &': { textAlign: 'right' } },
  [theme.breakpoints.up('lg')]: { width: '50%' },
}));

export default function HomeNews({ news, locale = 'en' }) {
  if (!news.length) return null;
  const t = (section, key) => translate(locale, section, key);
  return <Box sx={{ display: { xs: 'none', md: 'block' } }}>
    <HomeSection sx={{ margin: '5rem 0' }}>
      <h2 style={{ alignSelf: 'center', fontSize: 32, fontWeight: 500, lineHeight: 1.5, margin: 0, maxWidth: '100%' }}>{t('BrandProgram', 'newsBannerSection')}</h2>
      <div style={{ display: 'flex', width: '100%', marginTop: '5rem', flexDirection: 'column', justifyContent: 'space-between', gap: '3rem' }}>
        <Wrapper>
          <Highlight><NewsCard item={news[0]} locale={locale} showImage /></Highlight>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: { lg: '50%' } }}>
            <Divider orientation="horizontal" sx={{ display: { lg: 'none' } }} />
            <List sx={{ width: { lg: '100%' } }}>{news.slice(1, 4).map(item => <NewsCard key={item.path} item={item} locale={locale} />)}</List>
          </Box>
        </Wrapper>
        <a href={`/news${locale === 'en' ? '' : `?lang=${locale}`}`} aria-label={t('HomePage', 'seeMoreNews')} style={{ alignSelf: 'center', color: 'var(--link-color)', display: 'inline-flex', alignItems: 'center' }}>{t('HomePage', 'seeMore')}<KeyboardArrowRight sx={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} /></a>
      </div>
    </HomeSection>
  </Box>;
}
