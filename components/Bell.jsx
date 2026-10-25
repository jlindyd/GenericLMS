import { useEffect, useState } from 'react';
import { Avatar, Badge, Box, Divider, IconButton, MenuItem, Popover, Typography, useTheme } from '@mui/material';
import { Close, Notifications as NotificationsIcon } from '@mui/icons-material';
import { formatShortDate } from '../platform/dates';
import { translate } from '../platform/i18n';

// The notifications bell of signed-in visitors, ported from the existing site's Bell: a count of unread notifications, and a list where
// a click marks one as read and opens what it is about, the cross dismisses it, and "Clear all" empties the list.
const where = (item, locale) => {
  const lang = locale === 'en' ? '' : `&lang=${locale}`;
  switch (item.type) {
    case 'CourseCertificateEarned': return `/dashboard?traineeStatus=finished&page=1${lang}`;
    case 'BadgeEarned': return `/dashboard?showBadges=true&page=1${lang}`;
    case 'NewArticleAvailable': return `/${item.resourceId}`;
    case 'NewCourseAvailable': return `/course/${item.resourceId}`;
    default: return null;
  }
};

const call = (url, method) => fetch(url, { method }).then(response => { if (!response.ok) throw new Error('failed'); });

function Picture({ item }) {
  const src = item.imageUrl || (item.type === 'CourseCertificateEarned' ? '/badge/notificationIcon_certificates.png' : item.type === 'News' ? '/badge/NewspaperOutlined.png' : '');
  return <Avatar alt="" src={src || undefined} sx={{ width: 40, height: 40 }} />;
}

export default function Bell({ locale = 'en' }) {
  const theme = useTheme();
  const tNav = key => translate(locale, 'NavigationBar', key);
  const tBase = key => translate(locale, 'BasePageContainer', key);
  const [items, setItems] = useState(null), [anchor, setAnchor] = useState(null);
  useEffect(() => {
    let current = true;
    fetch('/api/notifications').then(response => (response.ok ? response.json() : null)).then(data => { if (current) setItems((data && data.results) || []); }).catch(() => { if (current) setItems([]); });
    return () => { current = false; };
  }, []);
  const list = items || [];
  const unread = list.filter(item => !item.isRead).length;
  const label = list.length === 0 ? tNav('noNotificationTooltip') : `${unread} ${unread === 1 ? tNav('notificationTooltip') : tNav('notificationTooltipPlural')}`;
  // Changes show at once and are put back if the request fails, as on the existing site.
  const change = (next, request) => { const before = items; setItems(next); request().catch(() => setItems(before)); };
  const open = item => { change(list.map(n => (n.id === item.id ? { ...n, isRead: true } : n)), () => call(`/api/notifications/${item.id}`, 'POST')); const target = where(item, locale); if (target) window.location.assign(target); };
  const dismiss = (event, item) => { event.stopPropagation(); change(list.filter(n => n.id !== item.id), () => call(`/api/notifications/${item.id}`, 'DELETE')); };
  return <>
    <button type="button" aria-label={label} aria-haspopup={list.length ? 'menu' : undefined} onClick={event => list.length && setAnchor(event.currentTarget)} style={{ cursor: 'pointer', padding: 2, border: 'none', backgroundColor: 'inherit', color: theme.palette.background.paper, marginInlineEnd: theme.spacing(4) }}>
      <Badge badgeContent={unread} max={99} sx={{ '& .MuiBadge-badge': { backgroundColor: '#d32f2f', fontSize: '1.6rem', color: '#fff' } }}>
        <NotificationsIcon sx={{ color: theme.palette.button.primary, fontSize: '3rem' }} />
      </Badge>
    </button>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { borderRadius: 0, maxWidth: '40rem', maxHeight: 'calc(100vh - 5.6rem)', boxShadow: '0px 2px 16px 0px rgba(0, 0, 0, 0.32)' } } }}>
      <Box component="ul" role="menu" aria-label={tNav('notificationTooltipPlural')} sx={{ m: 0, p: 0, listStyle: 'none' }}>
        <MenuItem onClick={() => { change([], () => call('/api/notifications', 'DELETE')); setAnchor(null); }} sx={{ display: 'flex', justifyContent: 'flex-end', fontSize: theme.spacing(5), height: 50, textTransform: 'none', color: '#1976d2', padding: '0.6rem 1.8rem 0.6rem 0', '&:hover, &:focus': { backgroundColor: '#fff' } }}>{tBase('clearAll')}</MenuItem>
        <Divider />
        {list.map(item => <MenuItem key={item.id} disableRipple onClick={() => open(item)} aria-label={`${item.title}${item.isRead ? '' : `, ${tNav('unread')}`}`} sx={{ padding: 0, display: 'block', whiteSpace: 'normal' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: theme.spacing(5), backgroundColor: item.isRead ? '#fff' : theme.palette.primary.light, padding: '2rem 1rem 2rem 2rem', cursor: 'pointer' }}>
            <Box sx={{ display: 'flex', gap: '1.6rem', alignItems: 'center' }}>
              <Picture item={item} />
              <Box aria-hidden="true" sx={{ display: 'flex', flexDirection: 'column', maxWidth: 400, wordWrap: 'break-word', gap: theme.spacing(1) }}>
                <Typography fontSize="1.4rem" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{item.title}</Typography>
                {item.body && <Typography sx={{ fontSize: '1.2rem', color: 'rgba(0, 0, 0, 0.6)', fontWeight: 400 }}>{item.body}</Typography>}
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 400, color: '#8C949E' }}>{formatShortDate(item.creationDate || '2020-01-01', locale)}</span>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', '&:hover': { backgroundColor: theme.palette.info.light } }}>
              <IconButton onClick={event => dismiss(event, item)} aria-label={tBase('pressDeleteToDismiss')}><Close sx={{ fontSize: '2.5rem' }} /></IconButton>
            </Box>
          </Box>
          <Divider />
        </MenuItem>)}
      </Box>
    </Popover>
  </>;
}
