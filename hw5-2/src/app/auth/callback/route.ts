import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, setSessionCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const payload = await verifyMagicLinkToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  await setSessionCookie(payload.userId);

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', req.url));
}


