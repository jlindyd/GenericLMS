import { Box, styled } from '@mui/material';

// Building blocks shared by the profile pages, ported from the existing site's MyProfileView, EditProfile and ChangePassword styles.

// Page frame: a 1200px column with the page title above (the existing site nests a second <main> here; this uses a plain div).
export const Frame = styled('div')({ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', '& .wrapper': { flexDirection: 'column', width: '100%' } });
export const TitleBox = styled('header')({ marginBottom: 'var(--space)' });
// The page title as the existing site's Title draws it: 3rem (2.5rem below 1200px), 120% line height, regular weight.
export const PageTitle = ({ children }) => <Box sx={{ width: { lg: '100%' }, '& > h1': { margin: 0, lineHeight: '120%', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', fontSize: { xs: '2.5rem', lg: '3rem' } } }}><h1>{children}</h1></Box>;

// Two columns of fields from tablet width up, with the form's own label and field styles.
export const Form = styled('form')(({ theme }) => ({
  width: '100%', display: 'flex', flexDirection: 'column',
  [theme.breakpoints.up('sm')]: { flexDirection: 'row' },
  '& label': { display: 'block', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', marginBottom: 'var(--space-xs)' },
  '& input:not([type=checkbox]), & select': { display: 'block', width: '100%', padding: 'var(--space-sm)', fontSize: 'var(--text-size)', border: '1px solid var(--border-color)', '&:disabled': { background: 'lightgray' } },
  '& input:not([type=checkbox])': { height: 34, color: '#475060' },
}));
export const Fieldset = styled('fieldset')(({ theme }) => ({
  width: '100%', border: 0, margin: 0, padding: 0, minWidth: 0,
  [theme.breakpoints.up('sm')]: { width: '45%' },
  '& + &': { [theme.breakpoints.up('sm')]: { marginLeft: '10%', '[dir=rtl] &': { marginLeft: 0, marginRight: '10%' } } },
}));
export const Group = styled('section')(({ theme }) => ({
  marginBottom: 'var(--space)', width: '100%',
  '& .label': { display: 'block', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)' },
  '& .input': { display: 'block', width: '100%', fontSize: 'var(--text-size)', minHeight: 15, [theme.breakpoints.up('md')]: { minHeight: 30, alignItems: 'center', display: 'inline-flex' } },
}));
export const Mandatory = styled('span', { shouldForwardProp: p => p !== 'red' })(({ red }) => ({ color: red ? 'red' : 'var(--danger-color)' }));
export const ButtonRow = styled('section')(({ theme }) => ({
  width: '100%', marginTop: 'var(--space)', paddingTop: 'var(--space)', borderTop: '1px solid var(--border-color-light)',
  [theme.breakpoints.up('md')]: { display: 'flex', justifyContent: 'flex-end' },
  '& a': { flex: '100%', [theme.breakpoints.up('sm')]: { flex: 'auto' } },
}));
export const Buttons = ({ children }) => <Box sx={{ display: 'flex', gap: '10px', flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: 'center' }}>{children}</Box>;

// The older square button the password pages use (the existing site's Button with primary / primary outline).
export const LegacyButton = styled('button', { shouldForwardProp: p => p !== 'outline' })(({ outline }) => ({
  minWidth: 130, height: 40, padding: '8px 16px', margin: '2px 0', cursor: 'pointer', borderRadius: 4, borderWidth: 1, borderStyle: 'solid', textAlign: 'center', transition: '0.2s', whiteSpace: 'nowrap',
  fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', fontSize: 'inherit',
  borderColor: 'var(--primary-color)', backgroundColor: outline ? 'var(--white)' : 'var(--primary-color)', color: outline ? 'var(--primary-color)' : 'var(--white)',
  '&:hover:not(:disabled)': { backgroundColor: outline ? 'var(--primary-color-light, #e6edfb)' : 'var(--primary-color-dark, #0139a8)' },
  '&:focus-visible': { outline: '2px solid var(--focus-outline-color)', outlineOffset: 2 },
  '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
}));
