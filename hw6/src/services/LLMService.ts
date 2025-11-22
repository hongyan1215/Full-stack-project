import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IGameHistory } from '@/models/GameSession';

// System Prompt: Define the Persona and Game Rules
const SYSTEM_PROMPT = `
你現在是【末日生存文字冒險遊戲】的「地下城主 (DM)」。
你的身份：一名倖存的廣播員，透過無線電與玩家（倖存者）通訊。
語氣：冷靜、略帶懸疑、寫實、偶爾會有無線電雜訊的干擾感（如 "滋...滋..."）。

遊戲規則：
1. 這是末日世界，資源匱乏，危險遍布（喪屍、輻射、強盜）。
2. 根據玩家的行動，判斷成功率與後果。
3. 不要一次給出太長的劇情，保持對話互動性，每次回覆控制在 100-200 字以內，適合 Line 閱讀。
4. 結尾可以給出 2-3 個建議選項，但也允許玩家自由輸入。
5. 如果玩家死亡，遊戲結束，請宣告結局並說明如何重新開始。

請嚴格遵守此人設進行回應。
`;

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    // Using gemini-2.5-flash-lite for faster response (to avoid Vercel timeout)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }

  public async generateResponse(history: IGameHistory[]): Promise<string> {
    try {
      // Limit history to last 8 messages to reduce token count and improve speed
      const recentHistory = history.slice(-8);
      
      // Convert DB history to Gemini format
      // Gemini uses 'user' and 'model' roles.
      // We map 'assistant' -> 'model'.
      
      // Re-initializing with systemInstruction for best practice.
      
      const modelWithSystem = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
        systemInstruction: SYSTEM_PROMPT
      });

      const chatHistory = recentHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      // Extract the last user message (which we'll send via sendMessage)
      const pastHistory = [...chatHistory];
      const lastMessage = pastHistory.pop();

      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Invalid history state: Last message must be from user');
      }

      // Gemini requires history to start with 'user' role.
      // Remove any leading 'model' messages from pastHistory.
      while (pastHistory.length > 0 && pastHistory[0].role === 'model') {
        pastHistory.shift();
      }

      // If pastHistory is empty or still starts with model, we can't use history.
      // In this case, just send the message without history (first turn).
      if (pastHistory.length === 0 || pastHistory[0].role !== 'user') {
        const chatSession = modelWithSystem.startChat();
        // Add timeout wrapper (20 seconds max for LLM call)
        const result = await Promise.race([
          chatSession.sendMessage(lastMessage.parts[0].text),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('LLM timeout after 20s')), 20000)
          )
        ]);
        return result.response.text();
      }

      // Start chat with cleaned history
      const chatSession = modelWithSystem.startChat({
        history: pastHistory,
      });

      // Add timeout wrapper (20 seconds max for LLM call)
      const result = await Promise.race([
        chatSession.sendMessage(lastMessage.parts[0].text),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('LLM timeout after 20s')), 20000)
        )
      ]);
      const response = result.response;
      return response.text();
      
    } catch (error) {
      console.error('LLM Generation Error:', error);
      // Fallback response is handled by the caller (GameService) or we return a generic one here?
      // Plan says "Handle errors".
      // Throwing allows GameService to catch and do Graceful Degradation.
      throw error; 
    }
  }
}

export const llmService = new LLMService();

