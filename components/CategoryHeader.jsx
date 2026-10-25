import { styled, Typography } from '@mui/material';

// Title band for one category page, drawn like the existing site's HP LIFE CategoryListPageHeader: text on white with
// the blue diagonal stripe on the right.
const Header = styled('header')(({ theme }) => ({ position: 'relative', minHeight: 200, padding: '0 16px', backgroundColor: theme.palette.common.white, margin: '0 auto', overflow: 'hidden', [theme.breakpoints.up('lg')]: { margin: '0 0 0 calc(100vw / 2 - 600px)' } }));
const Banner = styled('div')(({ theme }) => ({ position: 'absolute', left: 0, padding: '32px 0 40px 0', [theme.breakpoints.up('sm')]: { margin: '0 20px', padding: '40px 0 56px 0', maxWidth: 700 } }));
const Title = styled(Typography)(({ theme }) => ({ fontSize: 36, fontWeight: 500, lineHeight: '1.22em', letterSpacing: '0.02em', marginBottom: 20, [theme.breakpoints.up('sm')]: { fontSize: 48, letterSpacing: '0.03em' }, [theme.breakpoints.up('lg')]: { fontSize: 56 } }));
const Description = styled(Typography)(({ theme }) => ({ fontSize: 16, fontWeight: 400, lineHeight: '1.4em', [theme.breakpoints.up('lg')]: { fontSize: 20 } }));
const StripeOuter = styled('div')({ position: 'absolute', top: 0, left: 0, height: '100%', '@media (min-width: 768px)': { width: 'calc((100vw / 2) + 750px)' } });
const StripeBox = styled('div')({ '@media (min-width: 768px)': { position: 'absolute', top: 0, right: 0, width: 'calc(100vw / 2)' } });
const Stripe = styled('div')(({ theme }) => ({ position: 'absolute', top: 0, right: 0, '@media (min-width: 768px)': { width: '100%', background: theme.palette.primary.main, clipPath: 'polygon(22% 0%, 100% 0%, 100% 100%, 0% 100%)', height: 'calc(100vw / 4)', minHeight: 350 } }));

export default function CategoryHeader({ title, description }) {
  return <Header>
    <StripeOuter><StripeBox><Stripe /></StripeBox></StripeOuter>
    <Banner>
      <Title component="h1">{title}</Title>
      {description && <Description>{description}</Description>}
    </Banner>
  </Header>;
}
