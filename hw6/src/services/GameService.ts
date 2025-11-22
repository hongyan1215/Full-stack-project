import GameSession, { IGameSession } from '@/models/GameSession';
import dbConnect from '@/lib/db';
import { Types } from 'mongoose';

export class GameService {
  /**
   * Handle incoming user message.
   * For now:
   * - If text is "start" (case insensitive), create new session.
   * - Otherwise, echo back generic message (placeholder for LLM).
   */
  public async handleMessage(lineUserId: string, text: string): Promise<string> {
    await dbConnect();

    const normalizedText = text.trim().toLowerCase();

    if (normalizedText === 'start' || normalizedText === '開始') {
      return await this.startNewGame(lineUserId);
    }

    // Check for active session
    const session = await GameSession.findOne({
      lineUserId,
      status: 'active',
    }).sort({ lastActiveAt: -1 });

    if (!session) {
      return "沒有進行中的遊戲。請輸入「Start」或「開始」來開始新的冒險。";
    }

    // Update session last active time
    session.lastActiveAt = new Date();
    // Save user message to history
    session.history.push({
      role: 'user',
      content: text,
      timestamp: new Date(),
    });
    await session.save();

    // TODO: Call LLM Service here
    // For now, return a placeholder response
    const replyText = `(系統回應測試) 你說了: "${text}"。目前這只是簡單的回聲，真正的冒險即將展開。`;

    // Save assistant response to history
    session.history.push({
      role: 'assistant',
      content: replyText,
      timestamp: new Date(),
    });
    await session.save();

    return replyText;
  }

  private async startNewGame(lineUserId: string): Promise<string> {
    // Deactivate any existing active sessions? Or just create new one?
    // Spec says "系統建立新的 Game Session". 
    // Let's mark old active ones as ended to be safe/clean.
    await GameSession.updateMany(
      { lineUserId, status: 'active' },
      { $set: { status: 'ended' } }
    );

    const initialMessage = "【系統廣播】滋... 滋... 聽得到嗎？這裡是第 7 區的廣播塔。如果你還活著，請往北方移動... (遊戲開始，請輸入行動指令)";

    const newSession = new GameSession({
      lineUserId,
      status: 'active',
      history: [
        {
          role: 'assistant',
          content: initialMessage,
          timestamp: new Date(),
        }
      ],
      lastActiveAt: new Date(),
    });

    await newSession.save();
    return initialMessage;
  }
}

export const gameService = new GameService();

