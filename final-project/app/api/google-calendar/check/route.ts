import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ hasGoogleAccount: false }, { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // First, find the user by email
    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (!user) {
      console.log('User not found in database:', session.user.email);
      return NextResponse.json({ hasGoogleAccount: false }, { status: 200 });
    }

    console.log('Found user:', user._id, 'email:', session.user.email);

    // Check if user has a Google account linked
    const account = await db.collection("accounts").findOne({
      userId: user._id,
      provider: 'google',
    });

    console.log('Google account found:', !!account);
    if (account) {
      console.log('Account details:', {
        provider: account.provider,
        hasAccessToken: !!account.access_token,
        hasRefreshToken: !!account.refresh_token,
      });
    }

    const hasGoogleAccount = !!account && !!account.access_token;
    console.log('Final result - hasGoogleAccount:', hasGoogleAccount);

    return NextResponse.json({
      hasGoogleAccount,
    });
  } catch (error) {
    console.error('Error checking Google account:', error);
    return NextResponse.json({ hasGoogleAccount: false }, { status: 200 });
  }
}

