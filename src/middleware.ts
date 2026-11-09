import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, encrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isVerifyPage = request.nextUrl.pathname.startsWith('/verify');
  const sessionToken = request.cookies.get('session')?.value;

  // Allow public access to badge verification without authentication
  if (isVerifyPage) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    if (!isLoginPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  let session: any = null;
  try {
    session = await decrypt(sessionToken);
  } catch {
    session = null;
  }

  // Ensure session exists and has a valid user object to prevent infinite redirect loops
  if (!session || !session.user) {
    if (!isLoginPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set({
        name: 'session',
        value: '',
        path: '/',
        expires: new Date(0),
      });
      return response;
    }
    return NextResponse.next();
  }

  if (isLoginPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  // Refresh session only if less than 15 minutes remaining (avoid re-encrypting on every single request)
  if (session.exp && typeof session.exp === 'number') {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const timeLeft = session.exp - nowInSeconds;
    if (timeLeft < 900) {
      try {
        session.expires = new Date(Date.now() + 60 * 60 * 1000);
        const res = NextResponse.next();
        res.cookies.set({
          name: 'session',
          value: await encrypt(session),
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          expires: session.expires,
        });
        return res;
      } catch {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|icon-192.png|apple-icon.png|uploads|fonts|id-card/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js)$).*)',
  ],
};
