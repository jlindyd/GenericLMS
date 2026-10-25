import { Alert } from '@mui/material';
import Layout from '../../components/Layout';
import { CourseHeader, CourseOverview } from '../../components/CourseDetail';
import PageNotice from '../../components/PageNotice';
import { connection, resolveLocale } from '../../platform/config';
import { fill, translate } from '../../platform/i18n';
import { categoriesPath, categoryItem, coursePath, idFromSlug, readLearning, slugFromIdAndName } from '../../platform/learning';
import { cleanHtml } from '../../platform/sanitize';
import { failureProps } from '../../platform/catalogue';

export async function getServerSideProps({ params, query, res }) {
  const locale = resolveLocale(Array.isArray(query.lang) ? query.lang[0] : query.lang);
  try {
    const id = idFromSlug(params.slug);
    const [course, categories] = await Promise.all([
      readLearning(coursePath(id)),
      readLearning(categoriesPath(locale)).then(list => (Array.isArray(list) ? list : []).map(categoryItem)),
    ]);
    if (course.status === 'Archived') { res.statusCode = 404; return { props: failureProps(new Error('x'), { locale, message: 'This course was not found.' }) }; }
    const category = categories.find(c => c.id === course.categoryId);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: {
      locale, categories,
      course: {
        id: course.id, slug: slugFromIdAndName(course.id, course.name), name: course.name ?? '', description: course.description ?? '', imageUrl: course.imageUrl ?? null,
        body: cleanHtml(course.body), language: course.language ?? null, type: course.type ?? null, author: course.author ?? null, code: course.code ?? null,
        hasCertificate: !!course.hasCertificate, traineeCount: course.traineeCount ?? 0, offline: Array.isArray(course.books) && course.books.length > 0,
        published: course.status === 'Published' && course.revisionStatus === 'Revised',
        seo: { description: course.seo?.description ?? course.description ?? null, keywords: course.seo?.keywords ?? null, title: course.seo?.title ?? null },
      },
      lessons: (course.lessons || []).map(l => ({ id: l.id, name: l.name ?? '', tasks: (l.tasks || []).map(t => ({ id: t.id, name: t.name ?? '', type: t.type ?? '', isRequired: t.isRequired !== false })) })),
      category: category ? { name: category.name, slug: slugFromIdAndName(category.id, category.name) } : null,
    } };
  } catch (error) {
    res.statusCode = error.status === 404 || error.status === 400 ? 404 : 502;
    return { props: failureProps(error, { locale, message: res.statusCode === 404 ? 'This course was not found.' : failureProps(error).message }) };
  }
}

export default function Course({ locale, course, lessons = [], category, categories = [], message }) {
  if (message) return <PageNotice locale={locale} message={message} />;
  const t = key => translate(locale, 'CoursePage', key);
  const tb = key => translate(locale, 'BrandProgram', key);
  const shareUrl = `${connection.reference}/${locale}/course/${encodeURIComponent(course.slug)}`;
  const mail = { x: `${tb('xText').replace(/\s/g, '%20')} ${shareUrl}`, subject: locale === 'ar' ? tb('brand') : t('mailSubject'), body: `${tb('mailFirstBody')} ${shareUrl} ${tb('mailSecondBody')}` };
  const title = course.seo.title || `${course.name} | HP LIFE`;
  return <Layout locale={locale} title={title} description={course.seo.description} keywords={course.seo.keywords} image={course.imageUrl}>
    {course.language && course.language !== locale && <Alert severity="info" sx={{ borderRadius: 0 }}>{t('courseLanguageAlert')}</Alert>}
    <CourseHeader course={course} category={category} locale={locale} subject={category?.name} />
    <section><CourseOverview course={course} lessons={lessons} shareUrl={shareUrl} mail={mail} locale={locale} /></section>
  </Layout>;
}
