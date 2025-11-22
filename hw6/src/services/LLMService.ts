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
    // Using gemini-1.5-pro (stable)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  public async generateResponse(history: IGameHistory[]): Promise<string> {
    try {
      // Convert DB history to Gemini format
      // Gemini uses 'user' and 'model' roles.
      // We map 'assistant' -> 'model'.
      
      // Re-initializing with systemInstruction for best practice.
      
      const modelWithSystem = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        systemInstruction: SYSTEM_PROMPT
      });

      const chatHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      // Start chat with history
      const chat = modelWithSystem.startChat({
        history: chatHistory,
      });

      // Send empty message to trigger generation based on history? 
      // No, startChat prepares state. We need to send the *latest* user message if it's not in history yet?
      // Usually, the Controller/Service passes the full history INCLUDING the latest user message.
      // However, Google's startChat expects history to be *past* turns, and we send the *new* message via sendMessage.
      // BUT, if our DB history ALREADY contains the latest user message, we should pop it out to send it.
      
      const pastHistory = [...chatHistory];
      const lastMessage = pastHistory.pop();

      if (!lastMessage || lastMessage.role !== 'user') {
        // If the last message isn't from user (e.g. game start), we might need to just trigger generation.
        // But 'sendMessage' requires content.
        // If it's a start of game, maybe the history only has system greeting?
        // Actually, for "Start", the GameService adds an initial assistant message.
        // Then user replies.
        // So history usually ends with User message when calling this.
        // Fallback: if last is model, we just send a "continue" signal or similar?
        // Let's assume strict flow: User sends msg -> Saved to DB -> Call LLM.
        // So last message IS user message.
        throw new Error('Invalid history state: Last message must be from user');
      }

      // Restart chat with past history
      const chatSession = modelWithSystem.startChat({
        history: pastHistory,
      });

      const result = await chatSession.sendMessage(lastMessage.parts[0].text);
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

