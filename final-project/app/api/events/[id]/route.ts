import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

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
    const { _id, id: bodyId, userId, ...updateData } = data;

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Ensure dates are Date objects
    if (updateData.start) updateData.start = new Date(updateData.start);
    if (updateData.end) updateData.end = new Date(updateData.end);
    updateData.updatedAt = new Date();

    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(id), userId: session.user.email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
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

    const result = await db.collection("events").deleteOne({
      _id: new ObjectId(id),
      userId: session.user.email
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
