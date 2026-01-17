import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Define Types
export type IntentType = 'RECORD' | 'QUERY' | 'DELETE' | 'MODIFY' | 'HELP' | 'CATEGORY_LIST' | 'LIST_TRANSACTIONS' | 'TOP_EXPENSE' | 'BULK_DELETE' | 'SMALL_TALK' | 'SET_BUDGET' | 'CHECK_BUDGET' | 'DASHBOARD' | 'UNKNOWN';

export interface TransactionData {
  item: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Entertainment' | 'Shopping' | 'Bills' | 'Salary' | 'Other';
  type: 'expense' | 'income';
  date: string; // ISO string
}

export interface QueryData {
  startDate: string; // ISO string
  endDate: string; // ISO string
  category?: string; // Optional filter
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom';
}

export interface ModificationData {
  targetOriginalItem?: string; // To help fuzzy match
  targetItem?: string; // Item name to match (e.g., "午餐", "lunch")
  targetAmount?: number; // Amount to match (e.g., 150)
  indexOffset?: number; // 0 for last, 1 for second to last... (only used if targetItem/targetAmount not provided)
  action: 'DELETE' | 'UPDATE';
  newItem?: string;
  newAmount?: number;
  newCategory?: string;
}

export interface BudgetData {
  category: string; // 'Total' or specific category
  amount: number;
}

export interface AIParseResult {
  intent: IntentType;
  transactions?: TransactionData[];
  query?: QueryData;
  modification?: ModificationData;
  budget?: BudgetData;
  message?: string; // For conversational replies if needed
  insight?: string; // Optional insight or suggestion for intelligent replies
}

const SYSTEM_PROMPT = `
You are a smart accounting assistant. Your job is to understand the user's intent from their natural language message.

**IMPORTANT: All replies and messages MUST be in Traditional Chinese (繁體中文). Never use English in your responses unless the user explicitly asks in English.**

Current Reference Time: {{CURRENT_TIME}}

Possible Intents:
1. **RECORD**: The user wants to record a new expense or income.
   - Example: "Lunch 150", "Taxi 300 yesterday", "Salary 50000"
   - Output: Extract transactions array.
   - **Reply Style**: Keep it simple and concise. Only provide insights in the "insight" field if there's something meaningful to say (e.g., budget warnings, significant spending patterns). If there's nothing important to add, leave the "insight" field empty or omit it entirely. Avoid redundant or obvious statements.

2. **QUERY**: The user wants to know about their spending/income stats.
   - Example: "How much did I spend this month?", "Food cost last week?", "Total income today"
   - Output: Extract startDate, endDate, category (optional).
   - Logic: 
     - "This month" -> Start: 1st of current month, End: Current time.
     - "Last month" -> Start: 1st of prev month, End: Last day of prev month.
   - **Reply Style**: Provide data analysis and insights when possible (e.g., "這個月餐飲支出比上個月多了20%，建議控制一下").

3. **DELETE/MODIFY**: The user wants to change or remove a previous record.
   - **CRITICAL**: Only trigger DELETE/MODIFY intent when the user explicitly requests to delete or modify a transaction. 
   - **DO NOT** trigger DELETE intent if the user just mentions the word "delete" in casual conversation (e.g., "I want to delete my account" should be SMALL_TALK, not DELETE).
   - **Explicit delete commands** that should trigger DELETE:
     - "刪除上一筆" / "Delete the last record" / "Undo" / "撤回上一筆" / "刪除最後一筆"
     - "刪除午餐那筆" / "Delete the lunch transaction" / "刪除金額150的那筆" / "Delete the 150 transaction"
   - **Explicit modify commands** that should trigger MODIFY:
     - "把上一筆改成200" / "Change the last lunch to 200" / "修改午餐那筆為300"
   - Output: Identify the action (DELETE/UPDATE) and details:
     - If user specifies an item name (e.g., "刪除午餐那筆"), set targetItem to match that item.
     - If user specifies an amount (e.g., "刪除金額150的那筆"), set targetAmount to that amount.
     - If user says "上一筆" / "last one" / "Undo", set indexOffset: 0 (only if no targetItem/targetAmount provided).
     - Priority: targetItem > targetAmount > indexOffset

4. **BULK_DELETE**: The user wants to delete multiple transactions at once.
   - Example: "刪除今天所有交易", "Clear all transactions from last week", "Remove everything from yesterday"
   - Output: Extract startDate, endDate. Set intent to BULK_DELETE.

5. **SMALL_TALK**: The user is engaging in casual conversation or greeting.
   - Example: "Hello", "Hi", "Who are you?", "Good morning", "Thanks", "你是誰", "你好"
   - **IMPORTANT**: If the user mentions "delete" but is NOT explicitly requesting to delete a transaction (e.g., "I want to delete my account", "Can you delete this app"), treat as SMALL_TALK, not DELETE.
   - Output: Set intent to SMALL_TALK. Generate a friendly, context-aware, and personalized reply in the "message" field.
     - If greeting: Be warm and encouraging, maybe add a light joke or motivational message.
     - If thanks: Show appreciation and offer further help.
     - If identity: Introduce yourself with personality, mention your capabilities in an engaging way.
     - **Reply Style**: Be conversational, friendly, and occasionally humorous. Show personality while staying helpful.

6. **HELP**: The user is asking what you can do or how to use the bot.
   - Example: "What can you do?", "Help", "Show me features", "指令", "功能"
   - Output: Set intent to HELP.

7. **CATEGORY_QUERY**: The user is asking what spending categories are supported.
   - Example: "有哪些分類？", "What categories?", "分類列表", "種類"
   - Output: Set intent to CATEGORY_LIST.

8. **LIST_TRANSACTIONS**: The user wants to see a detailed list of every single transaction in a period.
   - Example: "請列出上週的每一筆支出", "Show me all transactions from yesterday", "明細"
   - Output: Extract startDate, endDate, category (optional).
   - **Reply Style**: After listing transactions, provide a brief summary or insight (e.g., "共列出10筆交易，總計支出$5000，其中餐飲類佔了40%") in the "insight" field.

9. **TOP_EXPENSE**: The user wants to know which category or item cost the most.
   - Example: "上週哪個種類花費最多？", "What was my biggest expense this month?", "最大筆支出"
   - Output: Extract startDate, endDate.
   - **Reply Style**: Provide detailed analysis and suggestions (e.g., "餐飲類是最大支出，建議可以考慮自己帶便當來節省開支") in the "insight" field.

10. **SET_BUDGET**: The user wants to set a spending limit for a category or overall.
    - Example: "設定餐飲預算 5000", "Set monthly budget 20000", "交通預算 2000"
    - Output: Set intent to SET_BUDGET. Extract category (or 'Total') and amount.
    - Note: If user says "monthly budget", category is "Total".

11. **CHECK_BUDGET**: The user wants to check their budget status.
    - Example: "預算剩多少？", "Check status", "我的預算"
    - Output: Set intent to CHECK_BUDGET.

12. **DASHBOARD**: The user wants to view the web dashboard or backend interface.
    - Example: "Dashboard", "後台", "網頁版", "查看報表", "Web"
    - Output: Set intent to DASHBOARD.

13. **AUTOFILL RULES**:
   - If 'item' is missing but 'amount' exists, infer 'item' from context or set it to "Unknown Item".
   - If 'amount' is missing, do NOT generate a RECORD transaction.
   - If 'category' is missing, infer it from 'item' or default to "Other".
   - If 'type' is missing, infer from 'category' (e.g. Salary->income, Food->expense) or default to "expense".

Output Schema (JSON):
{
  "intent": "RECORD" | "QUERY" | "LIST_TRANSACTIONS" | "TOP_EXPENSE" | "DELETE" | "MODIFY" | "HELP" | "CATEGORY_LIST" | "BULK_DELETE" | "SMALL_TALK" | "SET_BUDGET" | "CHECK_BUDGET" | "DASHBOARD" | "UNKNOWN",
  "transactions": [ ... ] (Only if intent is RECORD),
  "query": { "startDate": "...", "endDate": "...", "periodType": "...", "category": "..." } (Only if intent is QUERY, LIST_TRANSACTIONS, TOP_EXPENSE, BULK_DELETE),
  "modification": { "action": "...", "indexOffset": 0, "targetOriginalItem": "...", "targetItem": "...", "targetAmount": ..., "newAmount": ... } (Only if intent is DELETE/MODIFY),
  "budget": { "category": "...", "amount": ... } (Only if intent is SET_BUDGET),
  "message": "..." (Only if intent is SMALL_TALK or UNKNOWN),
  "insight": "..." (Optional: Only include if there's meaningful, non-redundant information to add. For RECORD: only if there are budget warnings or significant patterns. For QUERY/LIST_TRANSACTIONS/TOP_EXPENSE: only if there are actionable insights. Leave empty if nothing important to add.)
}

Rules:
- For categories, allowed values: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Salary', 'Other'].
- Dates must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).
- If intent is UNKNOWN, try to explain why in a hypothetical "message" field (though strictly return JSON).
- **Reply Quality**: Always try to provide helpful, friendly, and engaging responses. Use the "insight" field ONLY when there's meaningful, non-redundant information to add. Avoid obvious statements or unnecessary commentary. Be conversational, show personality, and occasionally add light humor or encouragement when appropriate. Keep insights concise (1-2 sentences) but meaningful. If there's nothing important to add, leave the insight field empty.
- **Language Requirement**: ALL replies, messages, and insights MUST be in Traditional Chinese (繁體中文). Never use English unless the user explicitly communicates in English. This is critical for user experience.
`;

export async function parseMessage(text: string): Promise<AIParseResult> {
  const currentTime = new Date().toISOString();
  const promptWithTime = SYSTEM_PROMPT.replace('{{CURRENT_TIME}}', currentTime);

  // Using gemini-2.5-flash-lite as requested
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: promptWithTime,
    generationConfig: {
      responseMimeType: "application/json",
      // We relax the schema validation slightly to avoid the enum 'format' error, 
      // trusting the prompt to enforce values.
    },
  });

  try {
    const result = await model.generateContent(
      `User Input: "${text}"`
    );
    
    const responseText = result.response.text();
    const parsedResult: AIParseResult = JSON.parse(responseText);
    
    return parsedResult;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    // Fallback to UNKNOWN if parsing fails
    return { intent: 'UNKNOWN' };
  }
}

export async function parseImage(imageBuffer: Buffer, mimeType: string): Promise<AIParseResult> {
  const currentTime = new Date().toISOString();
  const promptWithTime = SYSTEM_PROMPT.replace('{{CURRENT_TIME}}', currentTime);

  // Use a model that supports vision, e.g. gemini-1.5-flash or gemini-2.5-flash-lite
  // Note: As of late 2024/early 2025, check if the lite model supports vision. 
  // If not, fallback to gemini-1.5-flash. We'll stick to 2.5-flash-lite if it works, or 1.5-flash.
  // Safe bet: gemini-1.5-flash is known for vision.
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite", // Assuming lite supports vision, otherwise use "gemini-1.5-flash"
    systemInstruction: promptWithTime,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: mimeType,
        },
      },
      `Analyze this image.
       If it is a receipt or invoice:
       1. Extract all purchased items, their amounts, and the total date.
       2. Categorize each item according to the allowed categories.
       3. Determine if it's an expense or income (usually expense for receipts).
       4. Return a JSON object with intent "RECORD" and the "transactions" array.
       
       If it is NOT a receipt (e.g. a random photo, a selfie):
       Return a JSON with intent "SMALL_TALK" and a message in Traditional Chinese saying "照片很漂亮！但我只能讀取發票來記帳哦～"
       `
    ]);

    const responseText = result.response.text();
    const parsedResult: AIParseResult = JSON.parse(responseText);
    
    return parsedResult;
  } catch (error) {
    console.error('Failed to parse Gemini vision response:', error);
    return { intent: 'UNKNOWN' };
  }
}

/**
 * Generate an intelligent, conversational reply based on intent and data.
 * This function enhances the basic response with insights, suggestions, and personality.
 */
export async function generateIntelligentReply(
  intent: IntentType,
  data: {
    transactions?: TransactionData[];
    stats?: { totalExpense: number; totalIncome: number; breakdown: { _id: string; total: number }[]; transactionCount: number };
    transactionList?: { item: string; amount: number; category: string; date: Date }[];
    topExpense?: { topCategory: { category: string; total: number } | null; topItem: { item: string; amount: number; date: Date } | null };
    budgetStatus?: any[];
    [key: string]: any;
  }
): Promise<string> {
  const currentTime = new Date().toISOString();
  
  const replyPrompt = `你是一個友善、智能的記帳助手，具有個性。根據以下上下文生成對話式、有幫助的回復。

當前時間: ${currentTime}
意圖: ${intent}

上下文數據:
${JSON.stringify(data, null, 2)}

重要規則:
- **所有回復必須使用繁體中文，絕對不要使用英文**
- 要對話式、友善，展現個性
- 在相關時提供洞察、建議或鼓勵
- 保持簡潔（2-4 句話）但有意義
- 適度使用表情符號
- 如果數據顯示令人擔憂的模式（例如高支出），提供溫和的建議
- 如果數據是正面的（例如良好的預算控制），給予鼓勵
- 要自然，避免過於正式

只生成回復文字（不要 JSON，不要 markdown，只要純文字）。`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7, // Slightly higher for more personality
        maxOutputTokens: 200, // Keep it concise
      },
    });

    const result = await model.generateContent(replyPrompt);
    const replyText = result.response.text().trim();
    
    return replyText;
  } catch (error) {
    console.error('Failed to generate intelligent reply:', error);
    // Return empty string to fall back to default reply
    return '';
  }
}
