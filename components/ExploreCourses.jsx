import { useState } from 'react';
import { Box, styled } from '@mui/material';
import CardCarousel from './CardCarousel';
import CourseCard from './CourseCard';

// "Explore our courses" on the home page: one button per category (native radio buttons, so arrow keys work) and the
// courses of the chosen category in a carousel. Ported from the existing site's CoursesExplore and StyledRadioLabel.
const Label = styled('label', { shouldForwardProp: p => p !== 'selected' })(({ selected }) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 16px', borderRadius: 12, fontSize: '1.6rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', height: 32, textTransform: 'none',
  backgroundColor: selected ? '#000000' : 'transparent', color: selected ? '#ffffff' : '#000000', boxShadow: selected ? 'none' : '0 0 0 1px #000000 inset',
  '&:hover': { backgroundColor: selected ? '#212121' : '#F3F3F3', color: selected ? '#ffffff' : '#212121', boxShadow: selected ? 'none' : '0 0 0 1px #212121 inset' },
  '&:has(input:focus-visible)': { outline: '2px solid var(--focus-outline-color)', outlineOffset: 2 },
  '& input': { position: 'absolute', opacity: 0, width: 0, height: 0 },
}));

export default function ExploreCourses({ categories, coursesByCategory, locale = 'en' }) {
  const [index, setIndex] = useState(0);
  if (!categories.length) return null;
  const selected = categories[index];
  const courses = coursesByCategory[selected.id] || [];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', rowGap: '1rem', columnGap: '1rem' }}>
      {categories.map((category, i) => <Label key={category.id} selected={i === index}><input type="radio" name="explore-tabs" checked={i === index} onChange={() => setIndex(i)} />{category.name}</Label>)}
    </fieldset>
    <Box sx={{ width: 1, padding: '0 0 4rem 0' }}>
      <Box sx={{ display: 'flex', width: '100%', margin: '0 auto', maxWidth: { xs: 450, md: 730, lg: 1090, xl: 1200 }, alignItems: 'center', position: 'relative' }}>
        <CardCarousel key={selected.id} variant="explore" label={selected.name}>{courses.map(course => <CourseCard key={course.id} course={course} categories={categories} locale={locale} />)}</CardCarousel>
      </Box>
    </Box>
  </div>;
}
