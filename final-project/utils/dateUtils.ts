import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  format,
  isWithinInterval,
  isAfter,
  isBefore,
  isSameMonth,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns';
import { TimeGrid, TimeSlot, TimePeriod } from '../types/calendar';

export const getCalendarDays = (date: Date): Date[] => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
};

export const getWeekDays = (date: Date): Date[] => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });
};

export const getDayHours = (date: Date): Date[] => {
  const dayStart = startOfDay(date);
  return Array.from({ length: 24 }, (_, i) => addHours(dayStart, i));
};

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const isEventInRange = (event: { start: Date; end: Date }, start: Date, end: Date): boolean => {
  // 事件与时间槽有重叠的条件：
  // 事件的开始时间 < 时间槽的结束时间 且 事件的结束时间 > 时间槽的开始时间
  return event.start < end && event.end > start;
};

export const getEventsForDate = (events: any[], date: Date): any[] => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  return events.filter(event => 
    isEventInRange(event, dayStart, dayEnd)
  );
};

export const getEventsForWeek = (events: any[], weekStart: Date): any[] => {
  const weekEnd = addDays(weekStart, 6);
  return events.filter(event => 
    isEventInRange(event, weekStart, weekEnd)
  );
};

export const getEventsForMonth = (events: any[], monthStart: Date): any[] => {
  const actualMonthStart = startOfMonth(monthStart);
  const monthEnd = endOfMonth(monthStart);
  return events.filter(event => 
    isEventInRange(event, actualMonthStart, monthEnd)
  );
};

export const navigateMonth = (date: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
};

export const navigateWeek = (date: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1);
};

export const navigateDay = (date: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subDays(date, 1) : addDays(date, 1);
};

export const formatDate = (date: Date, formatStr: string): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('formatDate called with invalid date:', date);
    return '';
  }
  return format(date, formatStr);
};

export const getLocalDateKey = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('getLocalDateKey called with invalid date:', date);
    return '';
  }
  return formatDate(date, 'yyyy-MM-dd');
};

export const getWeekdayNames = (): string[] => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
};

export const getHourLabels = (): string[] => {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const period = i < 12 ? 'AM' : 'PM';
    return `${hour} ${period}`;
  });
};

export const createEvent = (
  title: string,
  start: Date,
  end: Date,
  color: string = '#3b82f6',
  description?: string,
  allDay: boolean = false
) => ({
  id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title,
  start,
  end,
  color,
  description,
  allDay,
});

// Time Grid Utilities
export const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

export const createTimeFromString = (date: Date, timeString: string): Date => {
  const { hours, minutes } = parseTimeString(timeString);
  return setMilliseconds(setSeconds(setMinutes(setHours(date, hours), minutes), 0), 0);
};

export const getTimeSlots = (date: Date, timeGrid: TimeGrid): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  
  // Add early morning block (0:00 to first period start)
  if (timeGrid.periods.length > 0) {
    const firstPeriod = timeGrid.periods[0];
    const earlyMorningPeriod: TimePeriod = {
      id: 'early-morning',
      name: 'Early Morning',
      startTime: '00:00',
      endTime: firstPeriod.startTime,
      color: '#f3f4f6',
      isBreak: false,
    };
    
    timeSlots.push({
      period: earlyMorningPeriod,
      startDate: createTimeFromString(date, '00:00'),
      endDate: createTimeFromString(date, firstPeriod.startTime),
      events: [],
    });
  }
  
  // Add regular periods
  timeGrid.periods.forEach(period => {
    const startDate = createTimeFromString(date, period.startTime);
    const endDate = createTimeFromString(date, period.endTime);

    timeSlots.push({
      period,
      startDate,
      endDate,
      events: [], // Will be populated by the calling function
    });
  });
  
  // Add late evening block (last period end to 23:59)
  if (timeGrid.periods.length > 0) {
    const lastPeriod = timeGrid.periods[timeGrid.periods.length - 1];
    const lateEveningPeriod: TimePeriod = {
      id: 'late-evening',
      name: 'Late Evening',
      startTime: lastPeriod.endTime,
      endTime: '23:59',
      color: '#f3f4f6',
      isBreak: false,
    };
    
    timeSlots.push({
      period: lateEveningPeriod,
      startDate: createTimeFromString(date, lastPeriod.endTime),
      endDate: createTimeFromString(date, '23:59'),
      events: [],
    });
  }
  
  return timeSlots;
};

export const getEventsForTimeSlot = (events: any[], timeSlot: TimeSlot): any[] => {
  return events.filter(event => 
    isEventInRange(event, timeSlot.startDate, timeSlot.endDate)
  );
};

export const getTimeSlotHeight = (timeSlot: TimeSlot): number => {
  // Fixed height for all slots regardless of duration to maintain uniform grid
  if (timeSlot.period.isBreak) {
    return 30; // Fixed height for breaks
  }
  
  return 100; // Fixed height for regular periods
};

// Re-export date-fns functions for convenience
export { isSameMonth, isSameDay, isToday };

