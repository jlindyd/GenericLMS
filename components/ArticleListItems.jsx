import { styled } from '@mui/material';
import { formatLongDate } from '../platform/dates';

// List rows for the News and Success Stories pages, ported from the existing site's BlogPost and SuccessStoryItemList.
const Post = styled('div')(({ theme }) => ({
  color: 'var(--text-color)', position: 'relative', alignItems: 'center',
  '& a': { color: 'var(--text-color)', textDecoration: 'none' },
  [theme.breakpoints.up('md')]: { minHeight: 160, paddingLeft: 270, display: 'flex', '[dir=rtl] &': { paddingLeft: 0, paddingRight: 270 } },
}));
const PostImage = styled('div')(({ theme }) => ({
  display: 'block', borderRadius: 5, width: 250, height: 160, overflow: 'hidden', position: 'relative', marginBottom: 'var(--space)',
  '& img': { width: '100%', height: '100%', objectFit: 'cover' },
  [theme.breakpoints.up('md')]: { position: 'absolute', top: 0, left: 0, '[dir=rtl] &': { left: 'inherit', right: 0 } },
}));

export function BlogPost({ heading, publishDate, description, image, href, locale }) {
  return <Post className="blogPostWrapper">
    <a href={href} style={{ cursor: 'pointer' }}>
      <PostImage className="blogPostImage">{image ? <img src={image} alt={heading} /> : <div style={{ background: '#e0e0e0', width: '100%', height: '100%' }} />}</PostImage>
      <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', width: '100%' }}>
        <div className="blogPostHeading" style={{ fontSize: '2rem', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', margin: 'var(--space-xs) 0' }}>{heading}</div>
        {publishDate && <div className="blogPostPublishDate">{formatLongDate(publishDate, locale)}</div>}
        {description && <div className="blogPostDescription">{description}</div>}
      </div>
    </a>
  </Post>;
}

const Photo = styled('div')(({ theme }) => ({
  width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem',
  '& img': { width: '100%', height: '100%', objectFit: 'cover' },
  [theme.breakpoints.up('md')]: { width: 150, height: 150, top: '50%', position: 'absolute', transform: 'translateY(-50%)', left: 0, marginBottom: 0, '[dir=rtl] &': { left: 'inherit', right: 0 } },
}));
const StoryLink = styled('a')(({ theme }) => ({
  position: 'relative', cursor: 'pointer', textDecoration: 'none', color: 'inherit',
  [theme.breakpoints.up('md')]: { paddingLeft: 165, display: 'flex', alignItems: 'center', minHeight: 150, '[dir=rtl] &': { paddingLeft: 0, paddingRight: 165 } },
}));

export function StoryItem({ heading, quote, userName, photo, href }) {
  return <div><article>
    <StoryLink href={href}>
      <Photo>{photo ? <img src={photo} alt="" /> : <div style={{ background: '#e0e0e0', width: '100%', height: '100%' }} />}</Photo>
      <div>
        <h2 style={{ fontSize: '2.4rem', marginBottom: '1rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>{heading}</h2>
        <div style={{ position: 'relative' }}>{quote}<div style={{ paddingTop: '1rem' }}>- {userName}</div></div>
      </div>
    </StoryLink>
  </article></div>;
}
