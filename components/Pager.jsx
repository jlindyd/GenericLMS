import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { styled } from '@mui/material';

// Page numbers as on the existing site (components/Pagination): a window of numbers with previous and next arrows.
const Box = styled('div')({ display: 'flex' });
const Item = styled('a', { shouldForwardProp: prop => prop !== 'active' })(({ active }) => ({ display: 'block', color: 'var(--black)', lineHeight: '24px', padding: '8px 16px', textDecoration: 'none', transition: 'background-color 0.3s', backgroundColor: active ? 'var(--gray-light)' : 'var(--white)', cursor: 'pointer', '&:hover': { backgroundColor: active ? 'var(--gray-light)' : 'var(--extra-light_gray)' }, '& svg': { fontSize: '1em', verticalAlign: 'middle' } }));

export function pageWindow(totalItems, currentPage, pageSize, maxPages) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(currentPage, 1), totalPages);
  let start, end;
  if (totalPages <= maxPages) { start = 1; end = totalPages; } else {
    const before = Math.floor(maxPages / 2), after = Math.ceil(maxPages / 2) - 1;
    if (current <= before) { start = 1; end = maxPages; } else if (current + after >= totalPages) { start = totalPages - maxPages + 1; end = totalPages; } else { start = current - before; end = current + after; }
  }
  return { totalPages, current, start, end, pages: Array.from({ length: end + 1 - start }, (_, i) => start + i) };
}

export default function Pager({ totalItems, pageSize, maxPages = 5, current, hrefFor }) {
  const w = pageWindow(totalItems, current, pageSize, maxPages);
  if (w.totalPages === 1) return null;
  return <nav aria-label="Pagination"><Box>
    {w.start > 1 && <Item href={hrefFor(current - 1)} aria-label="Previous page"><ChevronLeft /></Item>}
    {w.pages.map(p => <Item key={p} href={hrefFor(p)} active={current === p ? 1 : 0} aria-current={current === p ? 'page' : undefined}>{p}</Item>)}
    {w.end < w.totalPages && <Item href={hrefFor(current + 1)} aria-label="Next page"><ChevronRight /></Item>}
  </Box></nav>;
}
