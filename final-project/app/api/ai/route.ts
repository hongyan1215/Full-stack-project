import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ParsedEvent {
  title: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  category: string; // Category ID like 'category-1', 'category-2', etc.
  description?: string;
  location?: string;
  allDay?: boolean;
  icon?: string;
  enableNotification?: boolean; // Whether to enable notification
  notificationMinutesBefore?: number; // Minutes before event to notify (default: 15, common values: 5, 15, 30, 60)
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, currentDate, categories = [] } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Build context from conversation history
    const historyContext = conversationHistory
      .map((msg: Message) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Build category information for the prompt
    const categoriesList = (categories as Category[]).map((cat: Category) => 
      `- "${cat.name}" (ID: ${cat.id})`
    ).join('\n');

    const categoryIds = (categories as Category[]).map((cat: Category) => cat.id).join('", "');

    const systemPrompt = `You are a helpful calendar assistant that helps users create events. 
Current date and time: ${currentDate}

Available categories:
${categoriesList || '- No categories available'}

When a user describes an event, extract the following information and respond in JSON format:
{
  "action": "create_event" | "clarify" | "chat",
  "event": {
    "title": "event title",
    "start": "ISO 8601 datetime string",
    "end": "ISO 8601 datetime string", 
    "category": "one of the category IDs: ${categoryIds || 'category-1'}",
    "description": "optional description",
    "location": "optional location",
    "allDay": true/false,
    "icon": "suggested emoji",
    "enableNotification": true/false (optional, default false),
    "notificationMinutesBefore": number (optional, default 15, common values: 5, 15, 30, 60)
  },
  "message": "Your friendly response to the user in Traditional Chinese"
}

Guidelines:
- If the user's request is clear enough to create an event, set action to "create_event"
- If you need more information (like time or date), set action to "clarify"
- If it's just a casual chat, set action to "chat"
- For category: Match the user's description to the most appropriate category NAME, then use the corresponding category ID
  * If it sounds like work/business/professional: match to category with work-related name or use category-3
  * If it sounds like a deadline/homework/assignment: match to category with deadline/assignment name or use category-2
  * If it sounds like social/activity/fun: match to category with activity/event name or use category-1
  * If it sounds like daily life/personal: match to category with life/personal name or use category-4
  * For other cases, choose the most semantically similar category based on the category names provided
- IMPORTANT: Always return the category ID (e.g., "category-1", "category-2") NOT the category name
- Choose an appropriate emoji icon based on the event type
- For notifications (enableNotification):
  * Enable notification if user mentions "提醒", "通知", "鬧鐘", "提醒我", "記得通知我", "提前通知", or similar phrases
  * Set notificationMinutesBefore based on user's request:
    - "5分鐘前提醒" / "提前5分鐘" -> 5
    - "15分鐘前提醒" / "提前15分鐘" -> 15
    - "半小時前提醒" / "提前30分鐘" -> 30
    - "1小時前提醒" / "提前1小時" / "提前一小時" -> 60
    - If user just says "提醒我" without specific time, default to 15 minutes
  * For important events (meetings, deadlines, appointments), consider enabling notification by default
- Always respond in Traditional Chinese
- If user says "確認", "ok", "好", "是" etc. after you showed an event, confirm creation
- Parse relative dates like "明天", "下週一", "這週五" correctly based on current date

Examples:
- "明天下午3點開會" -> create_event with meeting tomorrow at 15:00, category matching "work" or "meeting", enableNotification: true (meetings are important)
- "12月25日聖誕派對" -> create_event on Dec 25, category matching "activity" or "social"
- "週三晚上健身，提前15分鐘提醒我" -> create_event for next Wednesday evening, category matching "activity" or "life", enableNotification: true, notificationMinutesBefore: 15
- "作業下週一要交，記得提醒我" -> create_event as deadline due next Monday, category matching "deadline" or "assignment", enableNotification: true, notificationMinutesBefore: 15 (default)
- "明天早上9點面試，提前30分鐘通知" -> create_event for tomorrow 9 AM, category matching "work", enableNotification: true, notificationMinutesBefore: 30`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nConversation history:\n${historyContext}\n\nUser: ${message}\n\nRespond with valid JSON only.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from Gemini API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the text from Gemini response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      return NextResponse.json(
        { error: 'No response from Gemini' },
        { status: 500 }
      );
    }

    // Parse the JSON from the response
    let parsed;
    try {
      // Try to extract JSON from the response (it might have markdown code blocks)
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, textContent];
      const jsonStr = jsonMatch[1] || textContent;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textContent);
      // If parsing fails, return as a chat message
      parsed = {
        action: 'chat',
        message: textContent,
        event: null
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
