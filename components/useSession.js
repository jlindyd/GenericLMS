import { useEffect, useState } from 'react';

// Whether the visitor is signed in, the way the existing site tells: the sign-in cookie exists (the sign-in site sets it on the shared domain,
// and it is readable by scripts). Starts as "not signed in" so the server and the first browser render agree. The name comes from /api/account.
const cookieName = process.env.NEXT_PUBLIC_AUTH_COOKIE || 'dydBearer';

export default function useSession() {
  const [session, setSession] = useState({ ready: false, signedIn: false, name: '' });
  useEffect(() => {
    const signedIn = document.cookie.split(';').some(part => part.trim().startsWith(`${cookieName}=`));
    setSession({ ready: true, signedIn, name: '' });
    if (!signedIn) return undefined;
    let current = true;
    fetch('/api/account').then(response => (response.ok ? response.json() : null)).then(user => { if (current && user) setSession(s => ({ ...s, name: user.preferred_username || user.name || '' })); }).catch(() => {});
    return () => { current = false; };
  }, []);
  return session;
}
