import { useState } from 'react';
import { Box } from '@mui/material';
import { PillLabel as Label } from './PillLabel';
import CardCarousel from './CardCarousel';
import CourseCard from './CourseCard';

// "Explore our courses" on the home page: one button per category (native radio buttons, so arrow keys work) and the
// courses of the chosen category in a carousel. Ported from the existing site's CoursesExplore and StyledRadioLabel.

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
