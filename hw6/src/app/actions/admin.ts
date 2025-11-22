'use server';

import dbConnect from '@/lib/db';
import GameSession, { IGameSession } from '@/models/GameSession';
import { Types } from 'mongoose';

// Helper to serialize Mongoose documents to plain objects
function serializeSession(session: any) {
  return {
    _id: session._id.toString(),
    lineUserId: session.lineUserId,
    status: session.status,
    lastActiveAt: session.lastActiveAt.toISOString(),
    messageCount: session.history.length,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function serializeSessionDetail(session: any) {
  return {
    _id: session._id.toString(),
    lineUserId: session.lineUserId,
    status: session.status,
    lastActiveAt: session.lastActiveAt.toISOString(),
    history: session.history.map((h: any) => ({
      role: h.role,
      content: h.content,
      timestamp: h.timestamp.toISOString(),
    })),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export async function getGameSessions() {
  await dbConnect();
  try {
    const sessions = await GameSession.find({})
      .sort({ lastActiveAt: -1 })
      .lean();
      
    return sessions.map(serializeSession);
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    return [];
  }
}

export async function getSessionDetails(id: string) {
  await dbConnect();
  try {
    const session = await GameSession.findById(id).lean();
    if (!session) return null;
    
    return serializeSessionDetail(session);
  } catch (error) {
    console.error('Error fetching session details:', error);
    return null;
  }
}

