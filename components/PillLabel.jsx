import { styled } from '@mui/material';

// A native radio button drawn as a pill (the existing site's StyledRadioLabel): arrow keys move between the choices for free.
// Selected = black, others outlined black.
export const PillLabel = styled('label', { shouldForwardProp: p => p !== 'selected' })(({ selected }) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 16px', borderRadius: 12, fontSize: '1.6rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', height: 32, textTransform: 'none',
  backgroundColor: selected ? '#000000' : 'transparent', color: selected ? '#ffffff' : '#000000', boxShadow: selected ? 'none' : '0 0 0 1px #000000 inset',
  '&:hover': { backgroundColor: selected ? '#212121' : '#F3F3F3', color: selected ? '#ffffff' : '#212121', boxShadow: selected ? 'none' : '0 0 0 1px #212121 inset' },
  '&:active': { backgroundColor: selected ? '#3D3D3D' : '#E0E0E0', color: selected ? '#ffffff' : '#3D3D3D', boxShadow: selected ? 'none' : '0 0 0 1px #3D3D3D inset' },
  '&:has(input:focus-visible)': { outline: '2px solid var(--focus-outline-color)', outlineOffset: 2 },
  '& input': { position: 'absolute', opacity: 0, width: 0, height: 0 },
}));
