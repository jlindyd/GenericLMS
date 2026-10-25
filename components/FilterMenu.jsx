import { useRef, useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';

// A black-outlined dropdown button with a list of links (the existing site's PopperDropdown). Each item is an ordinary link,
// so the page works without scripts and the choice stays in the address.
export default function FilterMenu({ label, items }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef(null);
  return <>
    <Button ref={anchor} variant="outlinedPrimary" size="medium" aria-haspopup="true" aria-label={`toggle ${label} selector`} onClick={() => setOpen(v => !v)}
      endIcon={open ? <ArrowDropUp sx={{ fontSize: 20 }} /> : <ArrowDropDown sx={{ fontSize: 20 }} />}
      sx={{ fontWeight: 400, textTransform: 'capitalize', paddingLeft: '10px', paddingRight: '10px', '&:hover': { zIndex: 200 } }}>{label}</Button>
    <Menu anchorEl={anchor.current} open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { borderRadius: '8px', mt: 0.5 } } }}>
      {items.map(item => <MenuItem key={item.label} component="a" href={item.href} selected={item.selected} onClick={() => setOpen(false)} sx={{ fontSize: '1.6rem', padding: '8px 12px', minWidth: 120, '&:hover': { backgroundColor: 'info.light', borderRadius: '4px', color: 'primary.main' } }}>{item.label}</MenuItem>)}
    </Menu>
  </>;
}
