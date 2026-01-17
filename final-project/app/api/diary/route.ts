import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { DiaryEntry, MoodType } from '@/types/calendar';
import { getLocalDateKey } from '@/utils/dateUtils';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const client = await clientPromise;
    const db = client.db("calendar-app");

    const query: any = {
      userId: session.user.email,
    };

    // Filter by date range if provided
    if (startDate || endDate) {
      const dateKeyRange: Record<string, string> = {};
      const dateRange: Record<string, Date> = {};

      if (startDate) {
        dateKeyRange.$gte = startDate;
        dateRange.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        dateKeyRange.$lte = endDate;
        dateRange.$lte = new Date(`${endDate}T00:00:00.000Z`);
      }

      // Support both new (dateKey) and legacy (date) records
      query.$or = [
        { dateKey: dateKeyRange },
        { date: dateRange },
      ];
    }

    const entries = await db.collection("diary").find(query).sort({ date: -1 }).toArray();

    console.log('📔 [Diary API] Raw entries from MongoDB:', entries.map(e => ({
      id: e._id.toString(),
      rawDate: e.date,
      dateType: e.date instanceof Date ? 'Date' : typeof e.date,
      dateISO: e.date instanceof Date ? e.date.toISOString() : String(e.date),
      dateLocal: e.date instanceof Date ? e.date.toString() : String(e.date),
    })));

    const formattedEntries = entries.map(entry => {
      const safeDate =
        entry.date instanceof Date ? entry.date : new Date(entry.date);
      const dateKey =
        entry.dateKey ||
        (safeDate instanceof Date && !isNaN(safeDate.getTime())
          ? getLocalDateKey(safeDate)
          : undefined);

      const formatted = {
        ...entry,
        id: entry._id.toString(),
        date: safeDate,
        dateKey,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        _id: undefined,
      };
      
      console.log('📔 [Diary API] Formatted entry:', {
        id: formatted.id,
        date: formatted.date,
        dateType: formatted.date instanceof Date ? 'Date' : typeof formatted.date,
        dateISO: formatted.date instanceof Date ? formatted.date.toISOString() : String(formatted.date),
      });
      
      return formatted;
    });

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching diary entries:', error);
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
    const { date, content, mood, tags } = data;

    if (!date || !content) {
      return NextResponse.json(
        { error: 'Date and content are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Normalize date to start of day (YYYY-MM-DD)
    console.log('📔 [Diary API] POST - Received date:', {
      rawDate: date,
      dateType: typeof date,
    });
    
    const entryDate = new Date(`${date}T00:00:00.000Z`); // normalize to UTC midnight
    const dateKey = typeof date === 'string' ? date : getLocalDateKey(entryDate);

    console.log('📔 [Diary API] POST - Parsed date (UTC midnight) and key:', {
      isoString: entryDate.toISOString(),
      localString: entryDate.toString(),
      getFullYear: entryDate.getFullYear(),
      getMonth: entryDate.getMonth(),
      getDate: entryDate.getDate(),
      dateKey,
    });

    // Check if entry already exists for this date
    const existingEntry = await db.collection("diary").findOne({
      userId: session.user.email,
      $or: [
        { dateKey },
        { date: entryDate }, // legacy fallback
      ],
    });

    const entryData: Omit<DiaryEntry, 'id'> = {
      date: entryDate,
      dateKey,
      content: content.trim(),
      mood: mood || undefined,
      tags: tags || [],
      userId: session.user.email,
      createdAt: existingEntry?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    let result;
    if (existingEntry) {
      // Update existing entry
      result = await db.collection("diary").updateOne(
        { userId: session.user.email, date: entryDate },
        { $set: entryData }
      );
      return NextResponse.json({
        ...entryData,
        id: existingEntry._id.toString(),
      });
    } else {
      // Create new entry
      result = await db.collection("diary").insertOne(entryData);
      return NextResponse.json({
        ...entryData,
        id: result.insertedId.toString(),
      });
    }
  } catch (error) {
    console.error('Error creating/updating diary entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

