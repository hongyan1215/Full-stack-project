'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CalendarEvent, EventCategory, Category } from '../types/calendar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  pendingEvent?: ParsedEvent;
}

interface ParsedEvent {
  title: string;
  start: string;
  end: string;
  category: EventCategory;
  description?: string;
  location?: string;
  allDay?: boolean;
  icon?: string;
  enableNotification?: boolean;
  notificationMinutesBefore?: number;
}

interface AIAssistantProps {
  onCreateEvent: (event: CalendarEvent) => void;
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onCreateEvent, isOpen, onClose, categories = [] }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '嗨！我是你的 AI 日曆助理 🤖\n\n告訴我你想建立什麼事件，例如：\n• "明天下午3點開會"\n• "下週一作業要交"\n• "週五晚上聚餐"\n• "週三早上9點面試，提前30分鐘提醒我"\n\n我也可以幫你設定通知提醒，只要告訴我「提醒我」或「提前X分鐘通知」即可！'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<ParsedEvent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCategoryColor = (categoryId: EventCategory): string => {
    // Get color from categories
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      return category.color;
    }
    // Fallback to a default color
    return '#64748b';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Check if user is confirming a pending event
    const confirmWords = ['確認', 'ok', 'OK', '好', '是', '對', 'yes', 'Yes', 'YES', '確定', '建立'];
    const isConfirming = confirmWords.some(word => userMessage.toLowerCase().includes(word.toLowerCase()));
    
    if (isConfirming && pendingEvent) {
      // Create the event
      const newEvent: CalendarEvent = {
        id: `ai-${Date.now()}`,
        title: pendingEvent.title,
        start: new Date(pendingEvent.start),
        end: new Date(pendingEvent.end),
        color: getCategoryColor(pendingEvent.category),
        category: pendingEvent.category,
        description: pendingEvent.description || '',
        location: pendingEvent.location,
        allDay: pendingEvent.allDay || false,
        icon: pendingEvent.icon,
        eventType: 'event',
        enableNotification: pendingEvent.enableNotification || false,
        notificationMinutesBefore: pendingEvent.enableNotification ? (pendingEvent.notificationMinutesBefore || 15) : undefined,
      };
      
      onCreateEvent(newEvent);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ 已成功建立事件「${pendingEvent.title}」！\n\n還需要我幫你建立其他事件嗎？`
      }]);
      
      setPendingEvent(null);
      setIsLoading(false);
      return;
    }

    // Cancel words
    const cancelWords = ['取消', '不要', '算了', 'cancel', 'no', '不'];
    const isCanceling = cancelWords.some(word => userMessage.toLowerCase().includes(word.toLowerCase()));
    
    if (isCanceling && pendingEvent) {
      setPendingEvent(null);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '好的，已取消。還需要我幫你建立其他事件嗎？'
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.slice(-6), // Last 6 messages for context
          currentDate: new Date().toISOString(),
          categories: categories, // Pass user's categories
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `抱歉，發生錯誤：${data.error}`
        }]);
      } else if (data.action === 'create_event' && data.event) {
        // Show the parsed event and ask for confirmation
        const event = data.event as ParsedEvent;
        setPendingEvent(event);
        
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        const formatDate = (d: Date) => {
          return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        // Get category name from categories
        const category = categories.find(c => c.id === event.category);
        const categoryName = category?.name || event.category;

        const notificationInfo = event.enableNotification 
          ? `🔔 通知：提前 ${event.notificationMinutesBefore || 15} 分鐘提醒\n`
          : '';

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${data.message || '我幫你整理了以下事件：'}\n\n` +
            `📌 **${event.title}** ${event.icon || ''}\n` +
            `📅 ${event.allDay ? `${startDate.getMonth() + 1}/${startDate.getDate()} (全天)` : `${formatDate(startDate)} - ${formatDate(endDate)}`}\n` +
            `🏷️ 類別：${categoryName}\n` +
            (event.location ? `📍 地點：${event.location}\n` : '') +
            (event.description ? `📝 備註：${event.description}\n` : '') +
            notificationInfo +
            `\n請回覆「確認」建立事件，或「取消」放棄。`,
          pendingEvent: event
        }]);
      } else {
        // Just a chat message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || '我不太明白，可以再說一次嗎？'
        }]);
      }
    } catch (error) {
      console.error('AI request error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，連線發生問題。請稍後再試。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-container">
        <div className="ai-assistant-header">
          <span className="ai-assistant-title">🤖 AI 事件助理</span>
          <button className="ai-assistant-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="ai-assistant-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`ai-message ai-message-${msg.role}`}>
              <div className="ai-message-content">
                {msg.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line.startsWith('**') && line.endsWith('**') 
                      ? <strong>{line.slice(2, -2)}</strong>
                      : line.includes('**') 
                        ? line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)
                        : line
                    }
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-content ai-typing">
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="ai-assistant-input-container">
          <input
            type="text"
            className="ai-assistant-input"
            placeholder="描述你想建立的事件..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            className="ai-assistant-send"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            發送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
