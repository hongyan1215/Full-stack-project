import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { CalendarShareConfig } from '@/types/calendar';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config: CalendarShareConfig = await request.json();

    // Ensure expiration is set to 3 days from now
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Generate unique share ID
    const shareId = randomBytes(16).toString('hex');

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Prepare share document
    const shareDoc = {
      shareId,
      userId: session.user.email,
      config: {
        ...config,
        shareId,
        createdAt: new Date(),
        // Convert dates to Date objects if they exist
        startDate: config.startDate ? new Date(config.startDate) : undefined,
        endDate: config.endDate ? new Date(config.endDate) : undefined,
        expiresAt: expiresAt,
      },
      createdAt: new Date(),
      expiresAt: expiresAt,
      viewCount: 0,
    };

    const result = await db.collection("calendar-shares").insertOne(shareDoc);

    return NextResponse.json({
      shareId,
      id: result.insertedId.toString(),
    });
  } catch (e) {
    console.error('Error creating share:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json({ error: 'shareId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    const share = await db.collection("calendar-shares").findOne({ shareId });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 });
    }

    // Increment view count
    await db.collection("calendar-shares").updateOne(
      { shareId },
      { $inc: { viewCount: 1 } }
    );

    return NextResponse.json({
      id: share._id.toString(),
      shareId: share.shareId,
      config: share.config,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      viewCount: share.viewCount + 1,
    });
  } catch (e) {
    console.error('Error fetching share:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

