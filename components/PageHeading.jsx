import { Box } from '@mui/material';

// The title band above a page's content (the existing site's HeaderOfContent): 30px of space above and below, the page title as the h1.
export default function PageHeading({ title }) {
  return <Box component="section" sx={{ display: 'flex', width: 1, mx: 'auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, justifyContent: 'space-between', p: { xs: '30px 8px', md: '30px 0' }, color: 'var(--text-color)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
      <div style={{ display: 'flex' }}><Box component="h1" sx={{ fontSize: theme => ({ xs: theme.typography.h4.fontSize, md: theme.typography.h3.fontSize }), fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', m: 0 }}>{title}</Box></div>
    </div>
  </Box>;
}
