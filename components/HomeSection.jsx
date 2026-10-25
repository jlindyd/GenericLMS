import { Box, styled } from '@mui/material';

// A full-width band with a centered, width-limited content column, as on the existing home page (HomePageSection + ResponsiveSection).
const Inner = styled('section')(({ theme }) => ({
  display: 'flex', width: '100%', margin: '0 auto', maxWidth: 450,
  flexDirection: 'column', alignItems: 'center', padding: '0 1rem',
  [theme.breakpoints.between('md', 'lg')]: { maxWidth: 730, alignItems: 'flex-start', padding: 0 },
  [theme.breakpoints.up('lg')]: { maxWidth: 1090, alignItems: 'flex-start', padding: 0 },
  [theme.breakpoints.up('xl')]: { maxWidth: 1200 },
}));

export default function HomeSection({ bgcolor, children, sx }) {
  return <Box sx={{ width: '100%', color: 'text.primary', bgcolor, ...sx }}><Inner><Box sx={{ display: 'flex', width: '100%', mt: 0, flexDirection: 'column', justifyContent: 'space-between' }}>{children}</Box></Inner></Box>;
}
