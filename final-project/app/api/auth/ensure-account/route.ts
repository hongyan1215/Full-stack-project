import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

/**
 * API route to ensure account record exists in MongoDB
 * This is useful for Credentials Provider (Dev User) to create an account record
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Find user by email
    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if account already exists
    const existingAccount = await db.collection("accounts").findOne({
      userId: user._id,
      provider: provider,
    });

    if (existingAccount) {
      return NextResponse.json({ 
        success: true, 
        message: 'Account already exists',
        account: existingAccount 
      });
    }

    // Create account record
    const accountData = {
      userId: user._id,
      type: provider === 'credentials' ? 'credentials' : 'oauth',
      provider: provider,
      providerAccountId: provider === 'credentials' ? `dev-user-${user._id}` : session.user.email,
      // For credentials provider, we don't have access_token
      // For OAuth providers, this should be handled by NextAuth
      access_token: provider === 'google' ? null : undefined,
      refresh_token: provider === 'google' ? null : undefined,
      expires_at: null,
      token_type: provider === 'credentials' ? null : 'Bearer',
      scope: provider === 'google' ? 'openid email profile https://www.googleapis.com/auth/calendar.readonly' : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("accounts").insertOne(accountData);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      accountId: result.insertedId.toString(),
    });
  } catch (error: any) {
    console.error('Error ensuring account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to ensure account' },
      { status: 500 }
    );
  }
}


