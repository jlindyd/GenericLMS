import { Box, styled } from '@mui/material';

// "Start today" call-to-action card with the blue diagonal stripe. Ported from the existing learner site
// (components/HighlightedSection and brand DiagonalStripeHighlightedSection).
const Wrapper = styled('div')({ backgroundColor: 'var(--body-bg-light)', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const Card = styled('div')(({ theme }) => ({ position: 'relative', backgroundColor: '#FFFFFF', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '24px', width: '100%', overflow: 'hidden', padding: '40px 16px', maxWidth: '1170px', textAlign: 'center', [theme.breakpoints.up('sm')]: { padding: '40px', textAlign: 'left', alignItems: 'flex-start' } }));
const Boundary = styled('div')(({ theme }) => ({ position: 'absolute', top: 0, width: '100vw', height: '100%', [theme.breakpoints.up('sm')]: { width: '700px' }, [theme.breakpoints.up('md')]: { width: '1100px' }, [theme.breakpoints.up('lg')]: { width: '1200px' } }));
const Positioner = styled('div')(({ theme }) => ({ position: 'relative', width: '100%', height: '100%', [theme.breakpoints.up('sm')]: { position: 'absolute', bottom: 0, right: 0, width: '300px', '[dir=rtl] &': { right: 'auto', left: 0 } }, [theme.breakpoints.up('md')]: { width: '475px' } }));
const Stripe = styled('div')(({ theme }) => ({ position: 'absolute', top: 0, right: 0, width: '420px', height: '100%', '[dir=rtl] &': { right: 'auto', left: 0 }, [theme.breakpoints.up('sm')]: { width: '100%', background: theme.palette.primary.main, clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)', zIndex: 5 } }));
const Heading = styled('div')(({ theme }) => ({ fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', color: '#000000', [theme.breakpoints.up('sm')]: { maxWidth: '400px' }, [theme.breakpoints.up('md')]: { maxWidth: '600px' }, [theme.breakpoints.up('lg')]: { maxWidth: '700px' } }));
const Buttons = styled('div')(({ theme }) => ({ flexGrow: 0, flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', [theme.breakpoints.up('sm')]: { justifyContent: 'flex-start' } }));

export default function HighlightedSection({ title, subtitle, children }) {
  return <Wrapper>
    <Card>
      <Boundary><Positioner><Stripe /></Positioner></Boundary>
      <Heading>
        <Box component="h2" sx={{ fontSize: '3rem', lineHeight: 1.2, fontWeight: 'bold', m: 0 }}>{title}</Box>
        {subtitle && <div style={{ marginTop: 'var(--space-sm)' }}>{subtitle}</div>}
      </Heading>
      <Buttons role="group" aria-label={title}>{children}</Buttons>
    </Card>
  </Wrapper>;
}
