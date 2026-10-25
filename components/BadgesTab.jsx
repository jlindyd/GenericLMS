import { useState } from 'react';
import { Box, Button, Card, CardActions, CardContent, CardHeader, Grid, Typography, useTheme } from '@mui/material';
import ShareDialog from './ShareDialog';
import { connection } from '../platform/config';
import { formatShortDate } from '../platform/dates';
import { fill, translate } from '../platform/i18n';

// "Badges" tab of the dashboard, ported from the existing site's MyBadgesTab: one card per badge with its picture, a short description,
// the date it was earned, and Share / Download image buttons (badges that are not earned yet are greyed out and cannot be shared).
const IMAGE = 179, DESCRIPTION_MAX = 120;

const splitPhrases = (text, max) => { const lines = []; let line = ''; for (const word of String(text).split(/\s+/)) { if ((line + ' ' + word).trim().length > max && line) { lines.push(line); line = word; } else line = (line + ' ' + word).trim(); } if (line) lines.push(line); return lines; };

// Draws the badge picture with its name under it on a canvas and saves it as a PNG, as the existing site does.
function downloadBadge(badge, theme) {
  const canvas = document.createElement('canvas');
  const picture = new window.Image();
  picture.crossOrigin = 'anonymous';
  picture.onload = () => {
    const ctx = canvas.getContext('2d');
    const title = splitPhrases(badge.name, 20);
    canvas.width = picture.naturalWidth + 60;
    canvas.height = picture.naturalHeight + 90 + title.length * 25;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(picture, 30, 30, picture.naturalWidth, picture.naturalHeight);
    ctx.fillStyle = theme.palette.common.black;
    ctx.font = `bold ${theme.typography.h4.fontSize || '20px'} ${theme.typography.fontFamily || 'Arial'}`;
    ctx.textAlign = 'center';
    let y = picture.naturalHeight + 70;
    title.forEach(part => { ctx.fillText(part, canvas.width / 2, y); y += 25; });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png', 1.0);
    link.download = `${badge.id}.png`;
    link.click();
  };
  picture.src = badge.imageUrl;
}

export default function BadgesTab({ badges, locale = 'en' }) {
  const theme = useTheme();
  const [shared, setShared] = useState('');
  const t = key => translate(locale, 'Badges', key);
  if (!badges.length) return <div style={{ display: 'flex', marginTop: 'var(--space)', fontFamily: 'var(--primary-font)', fontSize: '2.5rem' }}>{translate(locale, 'DashboardPage', 'noResultsFound')}</div>;
  const parts = translate(locale, 'BrandProgram', 'badgeDescription').split(/<a>|<\/a>/);
  return <Box sx={{ mt: '20px' }}>
    <Grid container sx={{ width: '100%' }} rowSpacing={7} columnSpacing={4}>
      <Box sx={{ p: '1rem', mt: '2rem' }}>{parts.length === 3 ? <>{parts[0]}<a href={`${connection.reference}/badges`} style={{ color: 'var(--link-color)' }}>{parts[1]}</a>{parts[2]}</> : parts.join('')}</Box>
      {badges.map((badge, index) => {
        const disabled = !badge.id || !badge.imageUrl || !badge.issueDate;
        return <Grid key={badge.id || index} size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
          <Card sx={{ background: theme.palette.grey[50], boxShadow: 'none', border: `thin solid ${theme.palette.grey[200]}`, borderRadius: '12px', position: 'relative', height: 1 }}>
            <CardHeader avatar={badge.imageUrl ? <img src={badge.imageUrl} width={IMAGE} height={IMAGE} alt={badge.name} /> : <div style={{ width: IMAGE, height: IMAGE, background: '#e0e0e0' }} role="img" aria-label={badge.name} />} title={badge.name} slotProps={{ title: { component: 'h2' } }}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', padding: theme.spacing(8, 8, 10, 8), backgroundColor: theme.palette.grey[200], opacity: disabled ? 0.5 : 1,
                '& .MuiCardHeader-avatar': { display: 'block', marginRight: 0, img: { opacity: disabled ? 0.4 : 1, filter: disabled ? 'grayscale(100%) brightness(70%)' : 'none' } },
                '& .MuiCardHeader-content': { display: 'flex', justifyContent: 'center', textAlign: 'center', width: '100%', height: '40px', paddingTop: theme.spacing(2) },
                '& .MuiCardHeader-title': { width: '80%', marginTop: theme.spacing(1), fontSize: theme.typography.h4.fontSize, fontWeight: theme.typography.fontWeightMedium } }} />
            <CardContent sx={{ padding: 0, borderTop: `thin solid ${theme.palette.grey[200]}`, height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
              <Typography component="p" variant="h5" sx={{ color: badge.issueDate ? 'text.primary' : 'text.disabled', mt: 5, mx: 4 }}>{badge.description && (badge.description.length > DESCRIPTION_MAX ? `${badge.description.substring(0, DESCRIPTION_MAX)}...` : badge.description)}</Typography>
              {badge.issueDate && <Typography component="p" variant="h5" sx={{ color: 'text.primary', width: 1 }}>{fill(t('earnedOn'), { badgeDate: formatShortDate(badge.issueDate, locale) })}</Typography>}
            </CardContent>
            <CardActions disableSpacing sx={{ width: '100%', padding: '2rem 2rem 1rem', flexDirection: 'column', gap: '1rem', ...(disabled && { position: 'absolute', bottom: 0 }) }}>
              <Button sx={{ width: 1 }} variant="containedPrimary" disabled={disabled} onClick={() => setShared(`${connection.reference}/${locale}/badges/${badge.id || ''}`)}>{t('share')}</Button>
              {!disabled && <Button sx={{ width: 1 }} variant="outlinedPrimary" onClick={() => downloadBadge(badge, theme)}>{t('downloadBadgeImage')}</Button>}
            </CardActions>
          </Card>
        </Grid>;
      })}
    </Grid>
    <ShareDialog url={shared} onClose={() => setShared('')} locale={locale} subjectKey="shareBadgeMailSubject" copiedKey="badgeURLCopied" />
  </Box>;
}
