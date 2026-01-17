import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");
    
    const events = await db.collection("events").find({ 
      userId: session.user.email 
    }).toArray();

    // Transform _id to id and ensure dates are strings (though JSON.stringify does this)
    const formattedEvents = events.map(event => ({
      ...event,
      id: event._id.toString(),
      _id: undefined
    }));

    return NextResponse.json(formattedEvents);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...eventData } = data;

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Ensure dates are stored as Date objects
    const eventToSave = {
      ...eventData,
      start: new Date(eventData.start),
      end: new Date(eventData.end),
      userId: session.user.email,
      createdAt: new Date(),
    };

    const result = await db.collection("events").insertOne(eventToSave);

    return NextResponse.json({ 
      ...eventToSave, 
      id: result.insertedId.toString(),
      _id: undefined 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
