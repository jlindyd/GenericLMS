import { useRef, useState } from 'react';
import { Avatar, Divider, Menu, MenuItem, MenuList, styled, useTheme } from '@mui/material';
import { FaCertificate, FaQuestionCircle } from 'react-icons/fa';
import { AiOutlineUser } from 'react-icons/ai';
import { FiLogOut } from 'react-icons/fi';
import { WorkspacePremium } from '@mui/icons-material';
import { connection } from '../platform/config';
import { translate } from '../platform/i18n';

// The signed-in visitor's menu, ported from the existing site's AvatarDropdown and its menu items (HP LIFE shows: certificates, badges,
// profile, help, log out). Addresses on this site are relative; signing out goes through the sign-in site and returns to the same page.
const SubIcon = styled('span')(({ theme }) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.secondary.light, '[dir=rtl] &': { marginRight: 0, marginLeft: theme.spacing(5) } }));
const Item = styled(MenuItem)(({ theme }) => ({ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem', width: '100%', padding: '8px 12px', fontSize: theme.spacing(5), transition: 'background-color 0.3s, border-radius 0.3s, border-color 0.3s, color 0.3s', '&:hover': { backgroundColor: theme.palette.info.light, borderRadius: 4, borderColor: theme.palette.info.light, color: theme.palette.primary.main } }));
const Line = styled(Divider)(({ theme }) => ({ marginTop: '0 !important', marginBottom: '0 !important', borderColor: theme.palette.grey[200], '&:focus-visible': { outline: 'none' } }));
export const UserAvatar = styled(Avatar)(({ theme }) => ({ backgroundColor: theme.palette.primary.main, border: `2px solid ${theme.palette.common.white}`, color: theme.palette.background.paper, width: 36, height: 36, boxShadow: '1px 1px 4px 0px rgba(204, 204, 204, 1)', [theme.breakpoints.up('lg')]: { boxShadow: '1px 1px 20px 0px rgba(204, 204, 204, 1)' } }));

const lang = locale => (locale === 'en' ? '' : `lang=${locale}`);
const withLang = (path, locale) => { const [base, query = ''] = path.split('?'); const joined = [query, lang(locale)].filter(Boolean).join('&'); return joined ? `${base}?${joined}` : base; };

export const initialsOf = name => (name || '').split(' ').map(part => part[0]).join('').slice(0, 3) || '*';
export const signOutHref = (locale, here) => `${connection.auth}/api/logout?${new URLSearchParams({ continue: here, ...(locale ? { locale } : {}) })}`;

// [{ key, label, icon, href }] for the menu (the last one signs out).
export function userMenuItems(locale, here) {
  const t = key => translate(locale, 'BasePageContainer', key);
  return [
    { key: 'certificates', label: t('certificates'), icon: <FaCertificate size={20} />, href: withLang('/dashboard?traineeStatus=finished&page=1', locale) },
    { key: 'badges', label: t('badges'), icon: <WorkspacePremium fontSize="large" />, href: withLang('/dashboard?showBadges=true&page=1', locale) },
    { key: 'profile', label: t('profileText'), icon: <AiOutlineUser size={20} />, href: withLang('/profile', locale) },
    { key: 'help', label: translate(locale, 'NavigationBar', 'help'), icon: <FaQuestionCircle size={20} />, href: withLang('/help', locale) },
    { key: 'logout', label: t('logoutText'), icon: <FiLogOut size={20} />, href: signOutHref(locale, here) },
  ];
}

export default function UserMenu({ name, locale = 'en' }) {
  const theme = useTheme();
  const [anchor, setAnchor] = useState(null);
  const first = useRef(null);
  const open = Boolean(anchor);
  const items = userMenuItems(locale, typeof window === 'undefined' ? connection.reference : window.location.href);
  return <>
    <button type="button" onClick={event => setAnchor(event.currentTarget)} aria-label={translate(locale, 'BasePageContainer', 'userProfile')} aria-controls={open ? 'account-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}
      style={{ cursor: 'pointer', borderRadius: '50%', backgroundColor: theme.palette.background.paper, border: 'none', padding: 0 }}>
      <UserAvatar><strong>{initialsOf(name)}</strong></UserAvatar>
    </button>
    <Menu anchorEl={anchor} id="account-menu" open={open} onClose={() => setAnchor(null)} onClick={() => setAnchor(null)}
      slots={{ list: MenuList }} slotProps={{ list: { autoFocusItem: open, sx: { padding: '8px' } }, transition: { onEntering: () => first.current?.focus() }, paper: { elevation: 0, sx: { overflow: 'visible', filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))', mt: theme.spacing(3), borderRadius: 0, '&:before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0 }, '& ul .Mui-disabled': { opacity: 1 } } } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
      <Item role="presentation" aria-hidden="true" disabled><strong>{name}</strong></Item>
      <Line role="separator" aria-hidden="true" />
      {items.map((item, index) => [
        <Item key={item.key} component="a" href={item.href} tabIndex={0} ref={index === 0 ? first : undefined} sx={{ color: 'inherit', textDecoration: 'none' }}><SubIcon aria-hidden="true">{item.icon}</SubIcon>{item.label}</Item>,
        <Line key={`${item.key}-line`} role="separator" />,
      ])}
    </Menu>
  </>;
}
