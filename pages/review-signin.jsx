// Local review only: signs the visitor in as the stand-in learner (the cookie "fixture"), then goes to the page they asked for.
// It does nothing unless the server was started in review mode (GENERIC_LMS_FIXTURES=1), and it never signs anyone in for real.
export function getServerSideProps({ query, res }) {
  if (process.env.GENERIC_LMS_FIXTURES !== '1') return { notFound: true };
  const next = String(query.next || '/dashboard');
  const safe = next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/dashboard';
  res.setHeader('Set-Cookie', 'dydBearer=fixture; Path=/; SameSite=Lax');
  res.setHeader('Cache-Control', 'private, no-store');
  return { redirect: { destination: safe === '/' ? '/dashboard' : safe, permanent: false } };
}
export default function ReviewSignIn() { return null; }
