import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGameHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IGameSession extends Document {
  lineUserId: string;
  status: 'active' | 'ended';
  history: IGameHistory[];
  lastActiveAt: Date;
}

const GameHistorySchema = new Schema<IGameHistory>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false }); // Subdocument generally doesn't need _id unless specified

const GameSessionSchema = new Schema<IGameSession>(
  {
    lineUserId: {
      type: String,
      required: true,
      index: true, // Index for fast queries, but allow multiple sessions per user
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    history: [GameHistorySchema],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite in hot reload
const GameSession: Model<IGameSession> =
  mongoose.models.GameSession ||
  mongoose.model<IGameSession>('GameSession', GameSessionSchema);

export default GameSession;

