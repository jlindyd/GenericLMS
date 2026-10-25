import { NextResponse } from 'next/server';

// As on the existing site: the home address shows the signed-in home to visitors who carry the sign-in cookie, and the public home to everyone else.
// The public home is never cached for a signed-in visitor, and the signed-in home is never cached at all.
export function middleware(request) {
  const signedIn = request.cookies.has(process.env.NEXT_PUBLIC_AUTH_COOKIE || 'dydBearer');
  if (request.nextUrl.pathname === '/' && signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/home-authenticated';
    const response = NextResponse.rewrite(url);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  return NextResponse.next();
}

export const config = { matcher: ['/'] };
