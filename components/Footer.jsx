import { useState } from 'react';
import { Box, Stack, Typography, styled } from '@mui/material';
import { Facebook, KeyboardArrowDown, KeyboardArrowUp, LinkedIn, YouTube } from '@mui/icons-material';
import { connection } from '../platform/config';
import { translate } from '../platform/i18n';

// Ported from the existing learner site (LMSUI components/Footer, FooterMenu, brand DiagonalStripeFooter).
const learner = path => connection.reference + path;
const badgeLocale = { ar: 'AR', es: 'ES', fr: 'FR', hi: 'HI', id: 'ID', pt: 'PT', 'zh-Hans': 'ZH' };

const Footer_ = styled('footer')(({ theme }) => ({ position: 'relative', background: theme.palette.brand.footerBackground, color: theme.palette.text.secondary, '& a': { color: theme.palette.text.secondary } }));
const Wrapper = styled('div')(({ theme }) => ({ position: 'relative', display: 'flex', flexDirection: 'column', paddingBottom: 0, [theme.breakpoints.up('md')]: { padding: theme.spacing(7) } }));
const Main = styled('div')(({ theme }) => ({ display: 'flex', flexDirection: 'column', gap: '1rem', [theme.breakpoints.up('md')]: { flexDirection: 'row' }, [theme.breakpoints.down('md')]: { '& a': { color: theme.palette.text.primary } } }));
const Column = styled('div')({ display: 'flex', flexDirection: 'column' });
const MenuColumn = styled(Column)(({ theme }) => ({ [theme.breakpoints.up('md')]: { width: '60%', flexDirection: 'row' } }));
const DownloadColumn = styled(Column)(({ theme }) => ({ padding: theme.spacing(6), alignItems: 'center', [theme.breakpoints.up('md')]: { width: '40%', padding: 0 } }));
const BrandColumn = styled(Column)(({ theme }) => ({ padding: theme.spacing(0, 6, 6), alignItems: 'center', [theme.breakpoints.up('md')]: { width: '40%', gap: '1rem', alignItems: 'flex-end', padding: 0 } }));

const MenuWrap = styled('div')(({ theme }) => ({ display: 'flex', gap: '1rem', flexWrap: 'nowrap', width: '100%', color: 'var(--footer-text)', flexDirection: 'column', [theme.breakpoints.up('md')]: { flexDirection: 'row' } }));
const MenuCol = styled('div')(({ theme }) => ({ width: '100%', [theme.breakpoints.up('md')]: { width: '20ch', '& > ul': { marginBottom: theme.spacing(6) } } }));
const Title = styled('h3')(({ theme }) => ({ padding: 'var(--space-sm) var(--space)', borderBottom: '1px solid var(--border-color)', position: 'relative', fontFamily: 'var(--primary-font)', [theme.breakpoints.up('md')]: { padding: 0, border: 'none', marginBottom: 'var(--space-sm)' } }));
const Icon = styled('span')(({ theme }) => ({ position: 'absolute', top: '50%', right: 'var(--space)', transform: 'translateY(-50%)', [theme.breakpoints.up('md')]: { display: 'none' } }));
const List = styled('ul')(({ theme }) => ({ background: 'var(--white)', padding: 'var(--space-xs) 0', display: 'none', '&.is-active': { display: 'block' }, [theme.breakpoints.up('md')]: { border: 'none', background: 'transparent', padding: 0, display: 'block' } }));
const Item = styled('li')(({ theme }) => ({ marginBottom: 'var(--space-xs)', fontWeight: 300, '& a': { display: 'block', textDecoration: 'none', cursor: 'pointer', color: 'var(--text-color)', padding: 'var(--space-sm) var(--space)', fontSize: '0.9em', '&:hover': { textDecoration: 'underline' }, [theme.breakpoints.up('md')]: { color: 'var(--footer-text)', padding: 0, display: 'inline-block', fontSize: '1.4rem' } } }));

const Credits = styled('div')(({ theme }) => ({ background: theme.palette.brand.footerBackground, color: theme.palette.text.secondary, marginTop: theme.spacing(8), fontSize: '0.9em', [theme.breakpoints.up('md')]: { marginTop: 0 } }));
const CreditsList = styled('ul')(({ theme }) => ({ margin: `0 0 ${theme.spacing(2)}`, padding: 0, listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', [theme.breakpoints.up('md')]: { justifyContent: 'flex-start' } }));
const CreditsItem = styled('li')(({ theme }) => ({ '& + &': { marginLeft: theme.spacing(4), paddingLeft: theme.spacing(4), position: 'relative', '&:before': { content: '"/"', display: 'inline-block', position: 'absolute', top: 0, left: '-2px', color: theme.palette.secondary.light } }, '& a': { whiteSpace: 'nowrap', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } } }));
const Copyright = styled('div')(({ theme }) => ({ textAlign: 'center', marginTop: theme.spacing(4), [theme.breakpoints.up('md')]: { textAlign: 'left' } }));

const StripeBox = styled('div')(({ theme }) => ({ position: 'relative', width: '100%', height: '175px', marginTop: theme.spacing(8), [theme.breakpoints.up('md')]: { position: 'absolute', bottom: 0, right: theme.spacing(6), width: '175px' } }));
const Stripe = styled('div')(({ theme }) => ({ position: 'absolute', top: 0, right: 0, width: '175px', height: '100%', background: theme.palette.primary.main, clipPath: 'polygon(40% 0%, 100% 0%, 60% 100%, 0% 100%)', [theme.breakpoints.up('md')]: { width: '100%' } }));

function Menu({ items }) {
  const [open, setOpen] = useState();
  return <MenuWrap>{items.map((col, i) => <MenuCol key={col.label}>
    <Title onClick={() => setOpen(open === i ? undefined : i)}>{col.label}<Icon>{open === i ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</Icon></Title>
    <List className={open === i ? 'is-active' : ''}>{col.items.map(item => <Item key={item.label}><a href={item.href}>{item.label}</a></Item>)}</List>
  </MenuCol>)}</MenuWrap>;
}

export default function Footer({ locale = 'en' }) {
  const t = (section, key, fallback) => translate(locale, section, key, fallback);
  const lang = badgeLocale[locale] || 'EN';
  const year = new Date().getFullYear();
  const categories = [['1-communication', 'Communication'], ['7-digital-business-skills', 'Digital Business Skills'], ['2-entrepreneurship', 'Entrepreneurship'], ['3-finance', 'Finance'], ['4-marketing', 'Marketing'], ['6-professional-development', 'Professional Development']];
  const menu = [
    { label: connection.name.replace(/ Test$/, ''), items: [{ label: t('BasePageContainer', 'about', 'About'), href: '/about' }, { label: t('BasePageContainer', 'successStories', 'Success Stories'), href: '/successstories' }, { label: t('BasePageContainer', 'partners', 'Partners'), href: '/partners' }, { label: t('NavigationBar', 'help', 'Help'), href: '/help' }] },
    { label: t('BasePageContainer', 'community', 'Community'), items: [{ label: t('BasePageContainer', 'news', 'News'), href: '/news' }] },
    { label: t('BasePageContainer', 'courses', 'Courses'), items: [{ label: t('BasePageContainer', 'allCourses', 'All Courses').replace('All Courses', 'All courses'), href: '/allcourses?page=1' }, ...categories.map(([slug, name]) => ({ label: name, href: '/categorylist/' + slug }))] },
  ];
  const credits = [[t('BasePageContainer', 'termsOfUseLink', 'Terms of use'), '/termsOfUse'], [t('BasePageContainer', 'privacyPolicyLink', 'Privacy'), t('BrandProgram', 'privacyLink')], [t('BasePageContainer', 'Useofcookies', 'Use of cookies'), t('BrandProgram', 'UseofcookiesLink')]];
  const icon = { color: 'white' };
  return <Footer_>
    <Wrapper className="wrapper">
      <Main>
        <MenuColumn><Menu items={menu} /></MenuColumn>
        <DownloadColumn>
          <Column sx={{ alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={300} sx={{ textAlign: { xs: 'center', md: 'left' } }}>{t('BrandProgram', 'badgeText')}</Typography>
            <Stack direction="row" gap="8px" mt={5} sx={{ maxWidth: { xs: '300px', md: 'none' } }}>
              <a href={connection.links.appStore} target="_blank" rel="noopener noreferrer"><img src={`/badge/ios/app-Store-Badge-${lang}.svg`} alt="App Store" /></a>
              <a href={connection.links.googlePlay} target="_blank" rel="noopener noreferrer"><img src={`/badge/android/google-play-badge-${lang}.svg`} alt="Google Play Store" /></a>
            </Stack>
          </Column>
        </DownloadColumn>
        <BrandColumn>
          <Box sx={{ display: 'inline-block', maxWidth: '140px', fontSize: '0.9em', mt: { xs: 4, md: 0 } }}><img src="/brand/foundation.svg" alt="HP Foundation" /></Box>
          <Box sx={{ mt: { xs: 2, md: 0 }, fontSize: { xs: '0.9em', md: '1em' }, textAlign: { xs: 'center', md: 'end' } }}>{t('BrandProgram', 'logoMessage')}</Box>
          <Box sx={{ display: 'flex', mt: { xs: 6, md: 0 }, gap: 6, alignItems: 'center' }}>
            <a href={connection.links.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><YouTube sx={icon} /></a>
            <a href={connection.links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook sx={icon} /></a>
            <a href={connection.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedIn sx={icon} /></a>
          </Box>
        </BrandColumn>
      </Main>
      <Credits>
        <CreditsList>{credits.map(([label, href]) => <CreditsItem key={label}><a href={href} target="_blank" rel="noopener noreferrer">{label}</a></CreditsItem>)}</CreditsList>
        <Copyright>{t('BrandProgram', 'trademark').replace('{year}', String(year))}</Copyright>
      </Credits>
      <StripeBox><Stripe /></StripeBox>
    </Wrapper>
  </Footer_>;
}
