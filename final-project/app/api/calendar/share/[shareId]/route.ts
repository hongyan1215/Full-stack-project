import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { CalendarShareConfig, CalendarEvent } from '@/types/calendar';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Get share configuration
    const share = await db.collection("calendar-shares").findOne({ shareId });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 });
    }

    const config: CalendarShareConfig = share.config;
    const userId = share.userId;

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (config.shareScope === 'single-month') {
      const year = config.year || new Date().getFullYear();
      const month = (config.month || new Date().getMonth() + 1) - 1; // Month is 0-indexed
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    } else if (config.shareScope === 'date-range') {
      startDate = config.startDate ? new Date(config.startDate) : new Date();
      endDate = config.endDate ? new Date(config.endDate) : new Date();
    } else {
      // all-events: use a very wide range
      startDate = new Date(0);
      endDate = new Date('2099-12-31');
    }

    // Fetch events from database
    const events = await db.collection("events").find({
      userId,
      start: { $gte: startDate, $lte: endDate },
    }).toArray();

    // Filter events based on visibility settings
    let filteredEvents: any[] = events.map(event => ({
      ...event,
      id: event._id.toString(),
      _id: undefined,
    }));

    // Apply category filter if specified
    if (config.shareVisibility === 'category-filter' && config.categoryIds && config.categoryIds.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        event.category && config.categoryIds!.includes(event.category)
      );
    }

    // Apply time-only filter (remove description and other details)
    if (config.shareVisibility === 'time-only') {
      filteredEvents = filteredEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        category: event.category,
        icon: event.icon,
        // Remove description, location, etc.
      }));
    }

    // Sort by start date
    filteredEvents.sort((a, b) => {
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();
      return aStart - bStart;
    });

    return NextResponse.json({
      events: filteredEvents,
      config,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (e) {
    console.error('Error fetching shared events:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

