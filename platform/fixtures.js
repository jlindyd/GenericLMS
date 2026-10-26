import { readService } from './server.js';
import { fixtureAssignment, fixtureAssignmentChange, fixtureCourse, fixtureForm, fixtureSubmit } from './fixture-forms.js';

// Stand-in answers for the signed-in reads, used only when GENERIC_LMS_FIXTURES=1 and the access cookie is the word "fixture".
// It lets the signed-in pages be built and compared on a computer that cannot receive the real sign-in cookie (it belongs to the
// shared domain of the sign-in site). Public reads go to the real service; nothing here writes anywhere.
export const fixturesEnabled = token => process.env.GENERIC_LMS_FIXTURES === '1' && token === 'fixture';

export async function fixtureResponse(service, path) {
  if (service === 'identity' && path.startsWith('api/account/profile')) return { id: 1, fullName: 'Fixture Learner', preferredName: 'Fixture', gender: 'Female', picture: null, email: 'fixture@example.test', emailConfirmed: false, phoneNumber: null, phoneNumberConfirmed: false, language: 'en', timeZone: 'America/Chicago', country: 'US' };
  if (service === 'identity' && path.startsWith('api/account/manageinfo')) return { localLoginProvider: 'DYD', email: 'fixture@example.test', logins: [{ loginProvider: 'DYD', providerKey: 'k' }], externalLoginProviders: [] };
  if (service === 'emailmarketing') return { isSubscribed: true };
  if (service === 'identity') return { sub: 1, name: 'Fixture Learner', preferred_username: 'Fixture Learner', email: 'fixture@example.test' };
  if (service === 'notifications') return { page: 0, pagesCount: 1, resultsCount: 2, results: [
    { id: 1, type: 'CourseCertificateEarned', resourceId: 'x', creationDate: '2026-07-01T00:00:00Z', isRead: false, title: 'You earned a certificate', body: 'Well done', imageUrl: '' },
    { id: 2, type: 'News', resourceId: 'news', creationDate: '2026-06-01T00:00:00Z', isRead: true, title: 'New article available', body: '', imageUrl: '' },
  ] };
  if (service === 'rewards') return [
    { id: 'b1', name: 'Digital Business Skills', description: 'Completed every course in the category.', imageUrl: null, issueDate: '2026-06-01T00:00:00Z' },
    { id: null, name: 'Finance', description: 'Not earned yet.', imageUrl: null, issueDate: null },
  ];
  if (service !== 'learning') throw new Error('No fixture for this service.');
  if (path === 'api/trainee/courses/1') return fixtureCourse();
  if (/^api\/trainee\/assignment\/[0-9]+$/.test(path)) return fixtureAssignment(Number(path.split('/').pop()));
  if (/^api\/trainee\/form\/[0-9]+$/.test(path)) return fixtureForm(Number(path.split('/').pop()));
  const catalogue = await readService('learning', 'api/marketplace/courses?page=0&resultsPerPage=12&language=en');
  const courses = catalogue.results || [];
  if (path.startsWith('api/myTraineeCourses') && path.includes('Archived')) return { page: 0, pagesCount: 0, resultsCount: 0, results: [] };
  if (path.startsWith('api/myTraineeCourses') && path.includes('traineeStatus=finished')) {
    const done = courses.slice(3, 5).map(c => ({ ...c, enrollmentStatus: 'Enrolled', progress: 1, startDate: '2026-05-01T00:00:00Z', finishDate: '2026-06-01T00:00:00Z', hasCertificate: true, certificateId: '0f0e0d0c-aaaa-bbbb-cccc-000000000001' }));
    return { page: 0, pagesCount: 1, resultsCount: done.length, results: done };
  }
  if (path.startsWith('api/myTraineeCourses')) {
    const mine = courses.slice(0, 3).map((c, i) => ({ ...c, enrollmentStatus: 'Enrolled', progress: [0.6, 0, 0.2][i], startDate: '2026-07-29T00:00:00Z', finishDate: null, hasCertificate: true, lastLessonId: i === 1 ? null : 11, lastTaskId: i === 1 ? null : 22, lastTaskType: i === 1 ? null : 'Content', certificateId: null }));
    return { page: 0, pagesCount: 1, resultsCount: mine.length, results: mine };
  }
  if (path.startsWith('api/myCoachCourses')) return { page: 0, pagesCount: 1, resultsCount: 0, results: [] };
  if (path.startsWith('api/marketplace/courses')) return { ...catalogue, results: courses.slice(0, 10).map((c, i) => ({ ...c, traineeEnrollmentStatus: i % 3 === 0 ? 'Enrolled' : 'NotEnrolled', progress: i % 3 === 0 ? 0.5 : 0 })) };
  throw new Error('No fixture for this request.');
}

// In review mode a form task keeps the learner's answers in memory so a save or submit can be seen working.
export function recordFixtureChange(service, path, method, body) {
  const assignment = /^api\/trainee\/assignment\/([0-9]+)(?:\/files(?:\/.+)?)?$/.exec(path);
  if (service === 'learning' && assignment) { fixtureAssignmentChange(Number(assignment[1]), method, body); return; }
  if (service === 'learning' && method === 'POST' && /^api\/trainee\/form\/[0-9]+$/.test(path)) fixtureSubmit(Number(path.split('/').pop()), body);
}
