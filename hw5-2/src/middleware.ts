import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session_token')?.value;
  const isApi = req.nextUrl.pathname.startsWith('/api/');

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login-required', req.url));
  }

  try {
    const payload = await verifySessionToken(token);

    if (!payload) {
      if (isApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth/login-required', req.url));
    }

    // Token is valid, allow request and pass userId
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-User-Id', payload.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware error:', error);
    if (isApi) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/auth/login-required', req.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/transactions/:path*',
    '/api/stats/:path*'
  ],
};
