import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("calendar-app");

    const entry = await db.collection("diary").findOne({
      _id: new ObjectId(id),
      userId: session.user.email,
    });

    if (!entry) {
      return NextResponse.json({ error: 'Diary entry not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...entry,
      id: entry._id.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error('Error fetching diary entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { content, mood, tags } = data;

    const client = await clientPromise;
    const db = client.db("calendar-app");

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (content !== undefined) {
      updateData.content = content.trim();
    }
    if (mood !== undefined) {
      updateData.mood = mood || null;
    }
    if (tags !== undefined) {
      updateData.tags = tags || [];
    }

    const result = await db.collection("diary").findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: session.user.email,
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Diary entry not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...result,
      id: result._id.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error('Error updating diary entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("calendar-app");

    const result = await db.collection("diary").deleteOne({
      _id: new ObjectId(id),
      userId: session.user.email,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Diary entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

