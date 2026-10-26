// Local review only: clears the stand-in learner's cookie and returns to the home page. Does nothing unless review mode is on.
export function getServerSideProps({ res }) {
  if (process.env.GENERIC_LMS_FIXTURES !== '1') return { notFound: true };
  res.setHeader('Set-Cookie', 'dydBearer=; Path=/; Max-Age=0; SameSite=Lax');
  res.setHeader('Cache-Control', 'private, no-store');
  return { redirect: { destination: '/', permanent: false } };
}
export default function ReviewSignOut() { return null; }
