import { createTheme } from '@mui/material/styles';

// HP LIFE brand theme. Values are copied from the existing learner site (LMSUI brand_override/hplife/brand/theme.ts and
// src/styles/baseTheme.ts) so the new site looks the same. Change them there first if the brand changes.
const spacingRem = { 0: '0', 1: '0.25', 2: '0.5', 3: '0.75', 4: '1', 5: '1.5', 6: '2', 7: '3', 8: '4', 9: '6', 10: '8', 11: '12', 12: '16', 13: '24', 14: '32', 15: '48', 16: '64' };

const button = (name, style) => ({ props: { variant: name }, style });
const disabled = { backgroundColor: '#E0E0E0' };

export const theme = createTheme({
  breakpoints: { keys: ['xs', 'sm', 'md', 'lg', 'xl'], values: { xs: 0, sm: 450, md: 768, lg: 1170, xl: 1440 } },
  spacing: factor => `${spacingRem[factor || 0]}rem`,
  cssVariables: true,
  palette: {
    primary: { main: '#024AD8', light: '#B2D2FF', dark: '#075782' },
    secondary: { main: '#5a5a5a', light: '#cccccc', dark: '#2c3038' },
    error: { main: '#bf2026', light: '#ffeaea' },
    warning: { main: '#f0a83b', light: '#fff8ed' },
    success: { main: '#2e7d32', light: '#4caf50' },
    text: { primary: '#000', secondary: '#ffffff' },
    background: { paper: '#ffffff', default: '#024AD8' },
    info: { main: '#024AD8', light: '#E4EEFA' },
    button: { primary: '#000000', secondary: '#000000', hover: '#2C3038' },
    brand: {
      headerBackground: '#ffffff', footerBackground: '#212121', headerBorder: '#ffffff',
      navbarButtonTextPrimary: '#ffffff', navbarButtonTextSecondary: '#000000',
      navbarSideMenuTextPrimary: '#ffffff', navbarSideMenuTextSecondary: '#000000',
      iconPrimary: '#000', iconPrimaryLight: '#000',
    },
  },
  typography: { fontFamily: '"FormaDJRUIRegular", Arial, sans-serif', fontWeightLight: 300, fontWeightRegular: 400, fontWeightMedium: 500, fontWeightBold: 700 },
  components: {
    MuiButtonBase: { styleOverrides: { root: { '&.Mui-focusVisible': { outline: '2px solid var(--focus-outline-color)', outlineOffset: '2px', borderRadius: '20px' } } } },
    MuiInputBase: { styleOverrides: { input: { '&:focus-visible': { outline: '2px solid var(--focus-outline-color)', outlineOffset: '2px', borderRadius: '20px' } } } },
    MuiButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { borderRadius: '12px', whiteSpace: 'nowrap', fontSize: '1.6rem', fontWeight: 400, width: 'fit-content', height: '40px', textTransform: 'none' },
        sizeSmall: { height: '32px', padding: '4px 16px' },
        sizeMedium: { height: '40px', padding: '8px 16px' },
        sizeLarge: { height: '48px', padding: '12px 16px' },
      },
      variants: [
        button('text', { backgroundColor: 'transparent', '&:hover': { backgroundColor: 'transparent' }, '&:active': { backgroundColor: 'transparent' }, '&:disabled': { color: '#A3A3A3' } }),
        button('containedPrimary', { backgroundColor: '#024AD8', color: '#ffffff', boxShadow: 'none', '&:hover': { backgroundColor: '#0036C4', border: 'none' }, '&:active': { backgroundColor: '#001CB0' }, '&:disabled': disabled }),
        button('containedSecondary', { backgroundColor: '#000000', color: '#ffffff', border: 'none', '&:hover': { backgroundColor: '#212121', color: '#ffffff' }, '&:active': { backgroundColor: '#3D3D3D', color: '#ffffff' }, '&:disabled': { ...disabled, color: '#A3A3A3' } }),
        button('textPrimary', { backgroundColor: 'transparent', border: 'none', color: '#024AD8', '&:hover': { backgroundColor: '#C9E0FC', border: 'none', color: '#0036C4' }, '&:active': { backgroundColor: '#B2D2FF', border: 'none', color: '#001CB0' }, '&:disabled': { backgroundColor: 'transparent', border: 'none', color: '#A3A3A3' } }),
        button('textSecondary', { backgroundColor: 'transparent', border: 'none', color: '#000000', '&:hover': { backgroundColor: 'transparent', border: 'none', color: '#3D3D3D' }, '&:active': { backgroundColor: '#B2D2FF', border: 'none', color: '#3D3D3D' }, '&:disabled': { backgroundColor: 'transparent', border: 'none', color: '#A3A3A3' } }),
        button('outlinedPrimary', { backgroundColor: 'transparent', color: '#024AD8', boxShadow: '0 0 0 1px #024AD8 inset', '&:hover': { backgroundColor: '#C9E0FC', boxShadow: '0 0 0 1px #024AD8 inset', color: '#0036C4' }, '&:active': { backgroundColor: '#B2D2FF', boxShadow: 'none', color: '#001CB0' }, '&:disabled': { backgroundColor: 'transparent', boxShadow: '0 0 0 1px #A3A3A3 inset', color: '#A3A3A3' } }),
        button('outlinedSecondary', { backgroundColor: 'transparent', color: '#000000', boxShadow: '0 0 0 1px #000000 inset', '&:hover': { backgroundColor: '#F3F3F3', boxShadow: '0 0 0 1px #212121 inset', color: '#212121' }, '&:active': { backgroundColor: '#E0E0E0', boxShadow: '0 0 0 1px #3D3D3D inset', color: '#3D3D3D' }, '&:disabled': { backgroundColor: 'transparent', boxShadow: '0 0 0 1px #A3A3A3 inset', color: '#A3A3A3' } }),
      ],
    },
  },
});
