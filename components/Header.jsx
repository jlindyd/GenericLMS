import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, IconButton, Menu, MenuItem, InputBase, useMediaQuery, useTheme } from '@mui/material';
import { KeyboardArrowDown, Menu as MenuIcon, PhoneIphone, Search } from '@mui/icons-material';
import { connection, localeLabels, locales } from '../platform/config';
import { translate } from '../platform/i18n';
import UserMenu, { UserAvatar, initialsOf, userMenuItems } from './UserMenu';
import Bell from './Bell';
import useSession from './useSession';

// Ported from the existing learner site navigation bar (signed-out layout). Pages that GenericLMS does not have yet
// link to the current learner site, so the header never leads to a dead end.
const learner = path => connection.reference + path;

export default function Header({ locale = 'en' }) {
  const theme = useTheme();
  const router = useRouter();
  const large = useMediaQuery(theme.breakpoints.up('lg'));
  const { signedIn, name } = useSession();
  const [langAnchor, setLangAnchor] = useState(null), [open, setOpen] = useState(false), [term, setTerm] = useState('');
  const t = (key, fallback) => translate(locale, 'BasePageContainer', key, fallback);
  const search = event => { event.preventDefault(); window.location.href = `/search?${locale === 'en' ? '' : `lang=${locale}&`}search=${encodeURIComponent(term)}&page=1`; };
  const switchLanguage = next => { setLangAnchor(null); router.push({ pathname: router.pathname, query: { ...router.query, lang: next } }); };
  const logo = <a href="/" aria-label={connection.name.replace(/ Test$/, '')} style={{ display: 'block' }}><img src="/brand/logo.svg" alt={connection.name.replace(/ Test$/, '')} width={86} height={48} /></a>;
  const login = <Button variant="outlinedPrimary" href={`${connection.auth}/${locale}/login?continue=${encodeURIComponent(connection.reference)}`}>{t('loginBtn', 'Log in')}</Button>;
  const join = <Button variant="containedPrimary" href={`${connection.auth}/${locale}/signup`}>{t('joinForFree', 'Join for free')}</Button>;
  const languageButton = <>
    <Button variant="outlinedSecondary" onClick={event => setLangAnchor(event.currentTarget)} endIcon={<KeyboardArrowDown />} aria-haspopup="menu" aria-label={t('languageText', 'Language')}>{localeLabels[locale]}</Button>
    <Menu anchorEl={langAnchor} open={!!langAnchor} onClose={() => setLangAnchor(null)}>{locales.map(l => <MenuItem key={l} selected={l === locale} onClick={() => switchLanguage(l)} sx={{ fontSize: '1.6rem' }}>{localeLabels[l]}</MenuItem>)}</Menu>
  </>;
  const dashboard = <Button variant="containedPrimary" href={`/dashboard?${locale === 'en' ? '' : `lang=${locale}&`}page=1`} sx={{ width: 'fit-content', whiteSpace: 'nowrap' }}>{t('myDashboard', 'My Dashboard')}</Button>;
  const searchBox = <Box component="form" role="search" onSubmit={search} sx={{ display: 'flex', alignItems: 'center', border: '1px solid #000', borderRadius: '12px', height: 40, px: 2, width: large ? 240 : '100%' }}>
    <InputBase value={term} onChange={event => setTerm(event.target.value)} placeholder={t('searchText', 'Search for courses')} inputProps={{ 'aria-label': t('searchText', 'Search for courses') }} sx={{ flex: 1, fontSize: '1.4rem' }} />
    <IconButton type="submit" size="small" aria-label={t('search', 'Search')}><Search fontSize="small" /></IconButton>
  </Box>;
  return <Box component="header" sx={{ position: 'sticky', display: 'flex', justifyContent: 'center', top: 0, zIndex: 100, backgroundColor: 'brand.headerBackground', borderBottom: '1px solid', borderColor: 'brand.headerBorder', padding: '8px 14px', height: 'fit-content' }}>
    <Box sx={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {logo}
        {large && <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', pl: '10px' }}>
          <Button variant="containedSecondary" href={`/allcourses?${locale === 'en' ? '' : `lang=${locale}&`}page=1`} endIcon={<KeyboardArrowDown />}>{t('allCourses', 'All Courses')}</Button>
          {searchBox}
        </Box>}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: large ? 3 : 2 }}>
        <IconButton href={learner('/download/app')} aria-label={t('downloadAppTooltip', 'Download the app')} sx={{ color: 'button.primary' }}><PhoneIphone /></IconButton>
        {signedIn && <Bell locale={locale} />}
        {large ? (signedIn ? <>{dashboard}<UserMenu name={name} locale={locale} /></> : <>{login}{join}{languageButton}</>) : <IconButton onClick={() => setOpen(v => !v)} aria-label={translate(locale, 'NavigationBar', 'menu', 'Menu')} aria-expanded={open} sx={{ border: '1px solid #000', borderRadius: '8px', width: 40, height: 40 }}><MenuIcon /></IconButton>}
      </Box>
      {!large && open && <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
        {searchBox}
        <Button variant="containedSecondary" href={`/allcourses?${locale === 'en' ? '' : `lang=${locale}&`}page=1`}>{t('allCourses', 'All Courses')}</Button>
        {signedIn ? <>{dashboard}<MobileUser name={name} locale={locale} /></> : <>{login}{join}{languageButton}</>}
      </Box>}
    </Box>
  </Box>;
}

// The signed-in visitor's items in the phone menu: a collapsible list under their name, as on the existing site.
function MobileUser({ name, locale }) {
  const [open, setOpen] = useState(false);
  const items = userMenuItems(locale, typeof window === 'undefined' ? '' : window.location.href);
  return <Box>
    <Button variant="outlinedSecondary" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="mobile-user-items" sx={{ width: '100%', justifyContent: 'flex-start', gap: 2 }} endIcon={<KeyboardArrowDown sx={{ ml: 'auto', transform: open ? 'rotate(180deg)' : 'none' }} />}>
      <UserAvatar><strong>{initialsOf(name)}</strong></UserAvatar>&nbsp;{name}
    </Button>
    {open && <Box id="mobile-user-items" component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>{items.map(item => <li key={item.key}><Button href={item.href} startIcon={item.icon} sx={{ width: '100%', justifyContent: 'flex-start', color: 'text.primary', fontSize: '1.6rem' }}>{item.label}</Button></li>)}</Box>}
  </Box>;
}
