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
      unique: true, // Assuming one active session per user, or strictly one document per user? 
                    // The spec implies "Session" might be reusable or new one created.
                    // "使用者輸入「Start」或「開始」，系統建立新的 Game Session。"
                    // If we create a NEW session, unique: true on lineUserId might be problematic if we keep old sessions.
                    // However, typically we might query by lineUserId.
                    // Let's check the spec again: "我們至少需要兩個 Collection... GameSession... lineUserId: String (Index)"
                    // It doesn't explicitly say unique.
                    // But usually for "Start new session", we might archive the old one or just have multiple.
                    // If we want to keep history of ALL sessions, we should index lineUserId but NOT unique.
                    // If we only keep ONE active session, we might update it.
                    // Spec says "列表顯示所有使用者的 Line ID... 點擊玩家可查看該場遊戲的完整對話紀錄".
                    // This implies we might want to store multiple sessions or one big one?
                    // "系統建立新的 Game Session" implies creating a NEW document.
                    // So index: true, but unique: false.
      index: true, 
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

