import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");
    
    const schedules = await db.collection("schedules").find({ 
      userId: session.user.email 
    }).toArray();

    // Transform _id to id and convert dates
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      id: schedule._id.toString(),
      _id: undefined,
      createdAt: schedule.createdAt ? new Date(schedule.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: schedule.updatedAt ? new Date(schedule.updatedAt).toISOString() : new Date().toISOString(),
      activeDateRange: schedule.activeDateRange ? {
        startDate: new Date(schedule.activeDateRange.startDate).toISOString(),
        endDate: new Date(schedule.activeDateRange.endDate).toISOString(),
      } : undefined,
    }));

    return NextResponse.json(formattedSchedules);
  } catch (e) {
    console.error('Error fetching schedules:', e);
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
    const { id, ...scheduleData } = data;

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Ensure dates are stored as Date objects
    const scheduleToSave = {
      ...scheduleData,
      userId: session.user.email,
      createdAt: scheduleData.createdAt ? new Date(scheduleData.createdAt) : new Date(),
      updatedAt: new Date(),
      activeDateRange: scheduleData.activeDateRange ? {
        startDate: new Date(scheduleData.activeDateRange.startDate),
        endDate: new Date(scheduleData.activeDateRange.endDate),
      } : undefined,
      isActive: scheduleData.isActive ?? false,
    };

    const result = await db.collection("schedules").insertOne(scheduleToSave);

    return NextResponse.json({ 
      ...scheduleToSave, 
      id: result.insertedId.toString(),
      _id: undefined,
      createdAt: scheduleToSave.createdAt.toISOString(),
      updatedAt: scheduleToSave.updatedAt.toISOString(),
      activeDateRange: scheduleToSave.activeDateRange ? {
        startDate: scheduleToSave.activeDateRange.startDate.toISOString(),
        endDate: scheduleToSave.activeDateRange.endDate.toISOString(),
      } : undefined,
    });
  } catch (e) {
    console.error('Error creating schedule:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, _id, userId: bodyUserId, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Convert dates if present
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Prepare unset fields for fields that should be removed
    const unsetFields: any = {};

    if (updateData.activeDateRange !== undefined) {
      if (updateData.activeDateRange) {
        updateFields.activeDateRange = {
          startDate: new Date(updateData.activeDateRange.startDate),
          endDate: new Date(updateData.activeDateRange.endDate),
        };
      } else {
        // If activeDateRange is explicitly set to null/undefined, remove it
        unsetFields.activeDateRange = '';
      }
    }

    // Handle both MongoDB ObjectId format and string format
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid schedule ID format' }, { status: 400 });
    }

    // Build update operation
    const updateOperation: any = { $set: updateFields };
    if (Object.keys(unsetFields).length > 0) {
      updateOperation.$unset = unsetFields;
    }

    const result = await db.collection("schedules").updateOne(
      { _id: objectId, userId: session.user.email },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Fetch updated schedule
    const updatedSchedule = await db.collection("schedules").findOne({ 
      _id: objectId, 
      userId: session.user.email 
    });

    if (!updatedSchedule) {
      return NextResponse.json({ error: 'Schedule not found after update' }, { status: 404 });
    }

    return NextResponse.json({
      ...updatedSchedule,
      id: updatedSchedule._id.toString(),
      _id: undefined,
      createdAt: updatedSchedule.createdAt ? new Date(updatedSchedule.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updatedSchedule.updatedAt ? new Date(updatedSchedule.updatedAt).toISOString() : new Date().toISOString(),
      activeDateRange: updatedSchedule.activeDateRange ? {
        startDate: new Date(updatedSchedule.activeDateRange.startDate).toISOString(),
        endDate: new Date(updatedSchedule.activeDateRange.endDate).toISOString(),
      } : undefined,
    });
  } catch (e) {
    console.error('Error updating schedule:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Handle both MongoDB ObjectId format and string format
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid schedule ID format' }, { status: 400 });
    }

    const result = await db.collection("schedules").deleteOne({ 
      _id: objectId, 
      userId: session.user.email 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error deleting schedule:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

