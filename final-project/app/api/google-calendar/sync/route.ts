import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { CalendarEvent } from '@/types/calendar';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // First, find the user by email
    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please sign in again.' },
        { status: 404 }
      );
    }

    // Get Google account with access token from MongoDB (userId is ObjectId)
    const account = await db.collection("accounts").findOne({
      userId: user._id,
      provider: 'google',
    });

    if (!account || !account.access_token) {
      return NextResponse.json(
        { error: 'Google account not linked or access token not available. Please sign in with Google.' },
        { status: 400 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Set the credentials
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    // Refresh token if expired
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      
      // Update token in database
      await db.collection("accounts").updateOne(
        { userId: user._id, provider: 'google' },
        {
          $set: {
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : undefined,
          },
        }
      );
    }

    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ahead

    // Fetch events from Google Calendar
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500, // Maximum allowed
    });

    const googleEvents = response.data.items || [];

    // Transform Google Calendar events to our CalendarEvent format
    const transformedEvents: (Omit<CalendarEvent, 'id'> & { googleCalendarId: string })[] = googleEvents.map((event) => {
      const start = event.start?.dateTime 
        ? new Date(event.start.dateTime)
        : event.start?.date 
        ? new Date(event.start.date + 'T00:00:00')
        : new Date();

      const end = event.end?.dateTime
        ? new Date(event.end.dateTime)
        : event.end?.date
        ? new Date(event.end.date + 'T23:59:59')
        : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour

      const allDay = !event.start?.dateTime && !!event.start?.date;

      return {
        title: event.summary || 'Untitled Event',
        start,
        end,
        description: event.description || undefined,
        location: event.location || undefined,
        allDay,
        eventType: 'event' as const,
        googleCalendarId: event.id || '',
      };
    });

    // Save events to database
    const savedEvents: CalendarEvent[] = [];
    const userId = session.user.email;

    for (const eventData of transformedEvents) {
      // Check if event already exists by Google Calendar ID
      const existingEvent = await db.collection("events").findOne({
        userId,
        googleCalendarId: eventData.googleCalendarId,
      });

      if (!existingEvent) {
        const result = await db.collection("events").insertOne({
          ...eventData,
          userId,
          createdAt: new Date(),
        });

        savedEvents.push({
          ...eventData,
          id: result.insertedId.toString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: savedEvents.length,
      total: googleEvents.length,
      events: savedEvents,
    });
  } catch (error: any) {
    console.error('Google Calendar sync error:', error);
    
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Google Calendar access token expired. Please sign in again with Google.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to sync Google Calendar' },
      { status: 500 }
    );
  }
}

