export type EventType = 'event' | 'schedule';
export type EventCategory = string; // Now a string ID referencing a Category

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color code
  userId?: string; // For user-specific categories (undefined for default categories)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  // color is optional - only used for schedule events (eventType === 'schedule')
  // Regular events (eventType === 'event') use category color instead
  color?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
  eventType: EventType; // 'event' for one-time events, 'schedule' for recurring class schedule
  category?: EventCategory; // Category ID (for eventType === 'event')
  icon?: string; // Emoji or icon for the event
  googleCalendarId?: string; // ID from Google Calendar for syncing
  enableNotification?: boolean; // Whether to send notification for this event
  notificationMinutesBefore?: number; // Minutes before event start to send notification (default: 15)
}

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  selectedDate?: Date;
  selectedEvent?: CalendarEvent;
}

export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  diaryEntry?: DiaryEntry | null; // Optional diary entry for this date
}

export interface WeekDay {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

export interface DayHour {
  hour: number;
  date: Date;
  events: CalendarEvent[];
}

export interface TimePeriod {
  id: string;
  name: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  color?: string;
  isBreak?: boolean; // For break periods that shouldn't show events
}

export interface TimeGrid {
  id: string;
  name: string;
  periods: TimePeriod[];
}

export interface TimeSlot {
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  events: CalendarEvent[];
}

// Schedule template event (before generating actual calendar events)
export interface ScheduleTemplateEvent {
  id: string;
  dayIndex: number; // 0-6 (Sun-Sat)
  periodId: string; // References a TimePeriod
  title: string;
  color: string;
  location?: string;
  notes?: string;
  shortcutKey?: string; // Track which shortcut key created this event
}

// Keyboard shortcut binding for schedule editor
export interface ShortcutBinding {
  id: string;
  key: string; // '1' through '8'
  title: string;
  color: string;
  location?: string;
  notes?: string;
}

// A Schedule is a collection of template events using a specific TimeGrid
export interface Schedule {
  id: string;
  name: string;
  timeGridId: string; // References a TimeGrid
  templateEvents: ScheduleTemplateEvent[];
  shortcutBindings?: ShortcutBinding[]; // Keyboard shortcuts for quick event creation
  isActive: boolean; // Whether this schedule is currently applied
  activeDateRange?: { // Date range when this schedule is active
    startDate: Date;
    endDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mood types for diary entries
export type MoodType = 
  | 'happy'      // 😊
  | 'sad'        // 😢
  | 'angry'      // 😠
  | 'anxious'    // 😰
  | 'excited'    // 🤩
  | 'calm'       // 😌
  | 'tired'      // 😴
  | 'confused'   // 😕
  | 'grateful'   // 🙏
  | 'love'       // 😍
  | 'neutral';   // 😐

export interface DiaryEntry {
  id: string;
  date: Date; // Date of the diary entry (YYYY-MM-DD)
  dateKey?: string; // Local date key (yyyy-MM-dd) to avoid timezone drift
  content: string; // Diary content
  mood?: MoodType; // Mood for the day
  tags?: string[]; // Optional tags
  userId?: string; // User ID for multi-user support
  createdAt: Date;
  updatedAt: Date;
}

// Mood configuration with emoji and color
export const MOOD_CONFIG: Record<MoodType, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '😊', color: '#fbbf24', label: '開心' },
  sad: { emoji: '😢', color: '#60a5fa', label: '難過' },
  angry: { emoji: '😠', color: '#f87171', label: '生氣' },
  anxious: { emoji: '😰', color: '#a78bfa', label: '焦慮' },
  excited: { emoji: '🤩', color: '#f472b6', label: '興奮' },
  calm: { emoji: '😌', color: '#34d399', label: '平靜' },
  tired: { emoji: '😴', color: '#94a3b8', label: '疲憊' },
  confused: { emoji: '😕', color: '#fbbf24', label: '困惑' },
  grateful: { emoji: '🙏', color: '#f59e0b', label: '感恩' },
  love: { emoji: '😍', color: '#ec4899', label: '愛' },
  neutral: { emoji: '😐', color: '#9ca3af', label: '普通' },
};

// Calendar Share Types
export type ShareScope = 'single-month' | 'date-range' | 'all-events';
export type ShareVisibility = 'all-events' | 'public-only' | 'category-filter' | 'time-only';
export type ShareMethod = 'public-link' | 'image' | 'pdf';

export interface CalendarShareConfig {
  shareScope: ShareScope;
  startDate?: Date; // For date-range
  endDate?: Date; // For date-range
  month?: number; // For single-month
  year?: number; // For single-month
  shareVisibility: ShareVisibility;
  categoryIds?: string[]; // For category-filter
  shareMethod: ShareMethod;
  shareId?: string; // Unique identifier for share link
  createdAt?: Date;
  expiresAt?: Date; // Optional expiration date
}

export interface CalendarShare {
  id: string;
  shareId: string; // Unique identifier for URL
  userId: string; // User who created the share
  config: CalendarShareConfig;
  createdAt: Date;
  expiresAt?: Date;
  viewCount: number;
}

