import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me_in_production';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function signMagicLinkToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // Link valid for 15 minutes
    .sign(encodedSecret);
}

export async function verifyMagicLinkToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    if (typeof payload.userId === 'string') {
      return { userId: payload.userId };
    }
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function signSessionToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Session valid for 7 days
      .sign(encodedSecret);
  }

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
    return verifyMagicLinkToken(token); // Logic is same, just different expiration checked by verify
}

export async function setSessionCookie(userId: string) {
  const token = await signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
}

