import { useEffect, useState } from 'react';
import { styled } from '@mui/material';
import { slugFromIdAndName } from '../platform/learning';

// "Explore by categories": one card per category with its picture, as on the existing site (CategoryCardGrid + CategoryCard).
// The existing site uses a sequential masonry (4 / 3 / 2 / 1 columns, cards keep their own height); this does the same:
// cards are dealt out left to right, so row order is kept and a two-line title does not stretch its neighbours.
const breakpoints = [[1170, 4], [768, 3], [450, 2], [0, 1]];
const columnsFor = width => breakpoints.find(([min]) => width >= min)[1];

const Card = styled('article')({ position: 'relative', border: '1px solid #E7E9EA', cursor: 'pointer', display: 'grid', gridTemplateColumns: '64px 1fr', alignItems: 'center', gap: 6, minHeight: 75, borderRadius: 12, background: '#fff', padding: 8 });
const Thumb = styled('figure')(({ theme }) => ({ overflow: 'hidden', borderRadius: 12, height: 56, width: 56, margin: 0, position: 'relative', backgroundColor: '#e0e0e0', '& img': { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }, [theme.breakpoints.down('md')]: { height: 58, width: 58 } }));
const Title = styled('h3')(({ theme }) => ({ fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', lineHeight: '120%', margin: 0, fontSize: '1em', [theme.breakpoints.down('md')]: { fontSize: '.9em' }, '& a, & a:hover': { color: 'inherit', textDecoration: 'none', lineHeight: 1.5 }, '& a::after': { content: '""', position: 'absolute', inset: 0 } }));

export default function CategoryCards({ categories, locale = 'en', gap = '0.5rem' }) {
  const [columns, setColumns] = useState(4); // the server draws four columns, like the existing site's default
  useEffect(() => {
    const update = () => setColumns(columnsFor(window.innerWidth));
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const lists = Array.from({ length: columns }, () => []);
  categories.forEach((category, i) => lists[i % columns].push(category));
  return <div style={{ display: 'flex', gap, width: '100%', alignItems: 'flex-start', paddingBottom: 5 /* the existing masonry's height runs this far past its tallest column */ }}>
    {lists.map((list, c) => <div key={c} style={{ display: 'flex', flexDirection: 'column', gap, flex: 1, minWidth: 0 }}>
      {list.map(category => <Card key={category.id}>
        <Thumb aria-hidden="true">{category.imageUrl && <img src={category.imageUrl} alt="" loading="lazy" />}</Thumb>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 10px 10px 0', justifyContent: 'center' }}>
          <Title><a href={`/categorylist/${slugFromIdAndName(category.id, category.name)}${locale === 'en' ? '' : `?lang=${locale}`}`} aria-label={category.name}><span aria-hidden="true">{category.name}</span></a></Title>
        </div>
      </Card>)}
    </div>)}
  </div>;
}
