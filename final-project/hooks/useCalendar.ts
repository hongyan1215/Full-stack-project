'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { CalendarState, CalendarView, CalendarEvent, CalendarCell, WeekDay, DayHour, TimeGrid, TimeSlot, Schedule, ScheduleTemplateEvent, Category } from '../types/calendar';
import { useTracking } from './usePostHog';
import {
  getCalendarDays,
  getWeekDays,
  getDayHours,
  getEventsForDate,
  getEventsForWeek,
  getEventsForMonth,
  navigateMonth,
  navigateWeek,
  navigateDay,
  isSameMonth,
  isToday,
  isSameDay,
  getTimeSlots,
  getEventsForTimeSlot,
} from '../utils/dateUtils';
import { getDefaultTimeGrid, defaultTimeGrids } from '../utils/timeGrids';

// Sample schedule events (recurring class schedule)
const initialScheduleEvents: CalendarEvent[] = [
  {
    id: 'schedule-1',
    title: 'Mathematics',
    start: new Date(2024, 11, 15, 8, 0),
    end: new Date(2024, 11, 15, 8, 50),
    color: '#3b82f6',
    description: 'Algebra and Geometry',
    eventType: 'schedule',
  },
  {
    id: 'schedule-2',
    title: 'English Literature',
    start: new Date(2024, 11, 15, 9, 0),
    end: new Date(2024, 11, 15, 9, 50),
    color: '#10b981',
    description: 'Shakespeare and Poetry',
    eventType: 'schedule',
  },
  {
    id: 'schedule-3',
    title: 'Science Lab',
    start: new Date(2024, 11, 15, 10, 0),
    end: new Date(2024, 11, 15, 10, 50),
    color: '#f59e0b',
    description: 'Chemistry Experiment',
    eventType: 'schedule',
  },
  {
    id: 'schedule-4',
    title: 'History',
    start: new Date(2024, 11, 15, 11, 0),
    end: new Date(2024, 11, 15, 11, 50),
    color: '#8b5cf6',
    description: 'World War II',
    eventType: 'schedule',
  },
  {
    id: 'schedule-5',
    title: 'Physical Education',
    start: new Date(2024, 11, 15, 12, 30),
    end: new Date(2024, 11, 15, 13, 20),
    color: '#06b6d4',
    description: 'Basketball Practice',
    eventType: 'schedule',
  },
  {
    id: 'schedule-6',
    title: 'Art Class',
    start: new Date(2024, 11, 15, 13, 30),
    end: new Date(2024, 11, 15, 14, 20),
    color: '#84cc16',
    description: 'Watercolor Painting',
    eventType: 'schedule',
  },
  {
    id: 'schedule-7',
    title: 'Computer Science',
    start: new Date(2024, 11, 15, 14, 30),
    end: new Date(2024, 11, 15, 15, 20),
    color: '#f97316',
    description: 'Web Programming',
    eventType: 'schedule',
  },
];

// Sample one-time events (trips, meetings, etc.)
const initialOneTimeEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Team Meeting',
    start: new Date(2024, 11, 16, 10, 0),
    end: new Date(2024, 11, 16, 11, 0),
    color: '#3b82f6',
    description: 'Weekly team standup',
    eventType: 'event',
  },
  {
    id: 'event-2',
    title: 'Project Deadline',
    start: new Date(2024, 11, 20, 9, 0),
    end: new Date(2024, 11, 20, 17, 0),
    color: '#ef4444',
    description: 'Final project submission',
    allDay: true,
    eventType: 'event',
  },
];

// Use a fixed date for SSR to avoid hydration mismatch
const getInitialDate = () => {
  // Return a fixed date for server-side rendering
  return new Date(2024, 11, 1); // December 1, 2024
};

export const useCalendar = () => {
  const { data: session } = useSession();
  const userId = session?.user?.email || 'guest'; // Use email as ID for simplicity, fallback to guest
  const { track, identify } = useTracking();

  // Start with empty events and fixed date to avoid hydration mismatch
  const [state, setState] = useState<CalendarState>({
    currentDate: getInitialDate(),
    view: 'month',
    events: [], // Start empty, load on client
    selectedDate: undefined,
    selectedEvent: undefined,
  });
  
  const [isHydrated, setIsHydrated] = useState(false);
  const isGeneratingEvents = useRef(false);
  const hasGeneratedEvents = useRef<string | null>(null); // Track which schedule we've generated events for
  const hasLoadedEvents = useRef<string | null>(null); // Track which userId we've loaded events for (to allow reloading when user changes)

  // Function to load events (extracted so it can be called manually)
  const loadEvents = async (force = false) => {
    // Only load if we haven't loaded for this userId yet, unless forced
    if (!force && hasLoadedEvents.current === userId) {
      console.log('⏭️ Skipping event load - already loaded for user:', userId);
      return;
    }
    
    if (userId !== 'guest') {
      try {
        console.log('📡 Fetching events from MongoDB for user:', userId);
        const response = await fetch('/api/events');
        if (response.ok) {
          const events = await response.json();
          const parsedEvents = events.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }));
          
          console.log('✅ Loaded events from MongoDB:', parsedEvents.length);
          
          // Also load schedules from API (TODO: Implement schedule API)
          // For now, we only persist events in MongoDB
          
          setState(prev => {
            // Preserve any existing generated schedule events (events with id starting with 'sched-')
            const existingScheduleEvents = prev.events.filter(e => e.id.startsWith('sched-'));
            return { 
              ...prev, 
              currentDate: new Date(),
              events: [...parsedEvents, ...existingScheduleEvents] 
            };
          });
          setIsHydrated(true);
          hasLoadedEvents.current = userId; // Track which user we loaded for
          return;
        } else {
          console.warn('⚠️ Failed to fetch events from MongoDB, status:', response.status);
        }
      } catch (error) {
        console.error('❌ Failed to fetch events from API', error);
      }
    }

    // Fallback to localStorage for guest or if API fails
    const savedEvents = window.localStorage.getItem(`calendar-events-${userId}`);
    
    let oneTimeEvents: CalendarEvent[] = userId === 'guest' ? initialOneTimeEvents : [];
    
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        oneTimeEvents = parsed.map((event: CalendarEvent) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          // Preserve eventType if it exists, otherwise default to 'event'
          eventType: event.eventType || 'event' as const,
        }));
      } catch (error) {
        console.error('Failed to parse stored events', error);
      }
    }
    
    // Don't load schedule events from localStorage - they'll be generated from schedules
    // Only load manually created schedule events (not generated ones)
    const manualScheduleEvents = oneTimeEvents.filter(e => e.eventType === 'schedule' && !e.id.startsWith('sched-'));
    oneTimeEvents = oneTimeEvents.filter(e => e.eventType !== 'schedule');
    
    // For guest users, also include initial schedule events if no schedules exist
    let initialScheduleEventsForGuest: CalendarEvent[] = [];
    if (userId === 'guest') {
      // Check if we have any schedules - if not, use initial schedule events
      const savedSchedules = window.localStorage.getItem(`calendar-schedules-${userId}`);
      if (!savedSchedules || JSON.parse(savedSchedules).length === 0) {
        initialScheduleEventsForGuest = initialScheduleEvents.map(e => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        console.log('📚 Using initial schedule events for guest user:', initialScheduleEventsForGuest.length);
      }
    }
    
    console.log('📥 Loaded events from localStorage:', {
      oneTimeEvents: oneTimeEvents.length,
      manualScheduleEvents: manualScheduleEvents.length,
      initialScheduleEvents: initialScheduleEventsForGuest.length,
      total: oneTimeEvents.length + manualScheduleEvents.length + initialScheduleEventsForGuest.length
    });
    
    setState(prev => {
      // Preserve any existing generated schedule events (events with id starting with 'sched-')
      const existingScheduleEvents = prev.events.filter(e => e.id.startsWith('sched-'));
      return { 
        ...prev, 
        currentDate: new Date(),
        events: [...oneTimeEvents, ...manualScheduleEvents, ...initialScheduleEventsForGuest, ...existingScheduleEvents] 
      };
    });
    setIsHydrated(true);
    hasLoadedEvents.current = userId; // Track which user we loaded for
  };

  // Identify user in PostHog when session changes
  useEffect(() => {
    if (session?.user) {
      identify(userId, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session, userId, identify]);

  // Load events from API or localStorage
  useEffect(() => {
    loadEvents();
  }, [userId]);

  // Function to manually refresh events (e.g., after syncing from Google Calendar)
  const refreshEvents = async () => {
    hasLoadedEvents.current = null; // Reset to allow reload
    await loadEvents(true); // Force reload
  };

  // Separate storage for events and schedule
  // Only save one-time events, NOT generated schedule events (they're generated from schedules)
  useEffect(() => {
    if (!isHydrated) return;
    // Don't save while generating events to avoid race conditions
    if (isGeneratingEvents.current) return;
    
    // If guest, save to localStorage
    if (userId === 'guest') {
      if (typeof window !== 'undefined') {
        // Only save one-time events, not generated schedule events
        // Generated schedule events (with id starting with 'sched-') should not be saved
        const oneTimeEvents = state.events.filter(e => 
          e.eventType === 'event' || 
          (e.eventType === 'schedule' && !e.id.startsWith('sched-'))
        );
        window.localStorage.setItem(`calendar-events-${userId}`, JSON.stringify(oneTimeEvents));
        // Don't save generated schedule events - they'll be regenerated from schedules
      }
    }
    // If logged in, changes are handled by add/update/delete functions calling API
  }, [state.events, isHydrated, userId]);

  const [currentTimeGrid, setCurrentTimeGrid] = useState<TimeGrid>(getDefaultTimeGrid());
  
  // Wrapper to track time grid changes
  const handleTimeGridChange = (timeGrid: TimeGrid) => {
    track('time_grid_changed', {
      from_time_grid_id: currentTimeGrid.id,
      from_time_grid_name: currentTimeGrid.name,
      to_time_grid_id: timeGrid.id,
      to_time_grid_name: timeGrid.name,
      view: state.view,
    });
    setCurrentTimeGrid(timeGrid);
  };
  
  // Filter toggles for showing/hiding event types
  const [showOneTimeEvents, setShowOneTimeEvents] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`showOneTimeEvents-${userId}`);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  
  // Base layer visibility filter (for schedule events - the background layer)
  // This controls both visibility AND visual styling (opacity)
  const [showBaseLayer, setShowBaseLayer] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`showBaseLayer-${userId}`);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  
  // Persist filter states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`showOneTimeEvents-${userId}`, String(showOneTimeEvents));
      localStorage.setItem(`showBaseLayer-${userId}`, String(showBaseLayer));
    }
  }, [showOneTimeEvents, showBaseLayer, userId]);
  
  // Category management
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Category filters - dynamic based on categories
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({});

  // Initialize category visibility when categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      setCategoryVisibility(prev => {
        const updated = { ...prev };
        // Ensure all categories have visibility state (default to true)
        categories.forEach(cat => {
          if (updated[cat.id] === undefined) {
            updated[cat.id] = true;
          }
        });
        return updated;
      });
    }
  }, [categories]);

  // Load category visibility from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`category-visibility-${userId}`);
      if (saved) {
        try {
          const savedVisibility = JSON.parse(saved);
          setCategoryVisibility(prev => ({ ...prev, ...savedVisibility }));
        } catch (e) {
          console.error('Failed to parse saved category visibility', e);
        }
      }
    }
  }, [userId]);

  // Save category visibility to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`category-visibility-${userId}`, JSON.stringify(categoryVisibility));
    }
  }, [categoryVisibility, userId]);

  // Toggle category visibility
  const toggleCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const isVisible = categoryVisibility[categoryId] !== false;
    
    track('category_toggled', {
      category_id: categoryId,
      category_name: category?.name,
      is_visible: !isVisible, // New visibility state
    });
    setCategoryVisibility(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Filtered events based on toggle states
  const filteredEvents = useMemo(() => {
    const filtered = state.events.filter(event => {
      // Base layer (schedule events) visibility controlled by showBaseLayer
      // Schedule events skip category filtering - they're controlled by the Layers toggle
      if (event.eventType === 'schedule' && !showBaseLayer) return false;
      if (event.eventType === 'event' && !showOneTimeEvents) return false;
      
      // Category filtering - only applies to regular events (not schedule events)
      if (event.eventType === 'event') {
        if (event.category) {
          const isVisible = categoryVisibility[event.category] !== false; // Default to true if not set
          if (!isVisible) return false;
        } else {
          // Events without category are shown if category-1 is visible (default)
          const isVisible = categoryVisibility['category-1'] !== false;
          if (!isVisible) return false;
        }
      }

      return true;
    });
    
    return filtered;
  }, [state.events, showBaseLayer, showOneTimeEvents, categoryVisibility]);
  
  // Get only one-time events
  const oneTimeEvents = useMemo(() => {
    return state.events.filter(e => e.eventType === 'event');
  }, [state.events]);
  
  // Get only schedule events
  const scheduleEvents = useMemo(() => {
    return state.events.filter(e => e.eventType === 'schedule');
  }, [state.events]);
  
  // Add schedule event (from ScheduleEditor)
  const addScheduleEvent = (event: Omit<CalendarEvent, 'eventType'>) => {
    setState(prev => ({
      ...prev,
      events: [...prev.events, { ...event, eventType: 'schedule' as const }],
    }));
  };
  
  // Add one-time event (from EventModal)
  const addOneTimeEvent = async (event: Omit<CalendarEvent, 'eventType'>) => {
    const newEvent = { ...event, eventType: 'event' as const };
    
    if (userId !== 'guest') {
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent),
        });
        
        if (response.ok) {
          const savedEvent = await response.json();
          // Convert dates back to Date objects
          savedEvent.start = new Date(savedEvent.start);
          savedEvent.end = new Date(savedEvent.end);
          
          track('event_created', {
            event_id: savedEvent.id,
            title: savedEvent.title,
            category: savedEvent.category,
            all_day: savedEvent.allDay || false,
            has_description: !!savedEvent.description,
            has_icon: !!savedEvent.icon,
          });
          
          setState(prev => ({
            ...prev,
            events: [...prev.events, savedEvent],
          }));
          return;
        }
      } catch (error) {
        console.error('Failed to save event to API', error);
      }
    }
    
    // Fallback or guest mode
    track('event_created', {
      event_id: newEvent.id,
      title: newEvent.title,
      category: newEvent.category,
      all_day: newEvent.allDay || false,
      has_description: !!newEvent.description,
      has_icon: !!newEvent.icon,
      is_guest: true,
    });
    
    setState(prev => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));
  };
  
  // Clear all schedule events
  const clearScheduleEvents = () => {
    setState(prev => ({
      ...prev,
      events: prev.events.filter(e => e.eventType !== 'schedule'),
    }));
  };
  const [customTimeGrids, setCustomTimeGrids] = useState<TimeGrid[]>([]);
  const [allTimeGrids, setAllTimeGrids] = useState<TimeGrid[]>([...defaultTimeGrids]);
  const [showBreakPeriods, setShowBreakPeriods] = useState<boolean>(true);
  
  // Schedule management
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  
  // Helper function to normalize schedules from API/localStorage
  const normalizeSchedules = (parsed: any[]): Schedule[] => {
    // First, normalize the schedules and identify which should be active
    const normalizedSchedules = parsed.map((s: any) => {
      // Parse activeDateRange if it exists (dates are stored as ISO strings in JSON)
      let activeDateRange = undefined;
      if (s.activeDateRange) {
        try {
          activeDateRange = {
            startDate: new Date(s.activeDateRange.startDate),
            endDate: new Date(s.activeDateRange.endDate),
          };
          // Validate dates
          if (isNaN(activeDateRange.startDate.getTime()) || isNaN(activeDateRange.endDate.getTime())) {
            console.warn('⚠️ Invalid dates in activeDateRange for schedule', s.id, s.activeDateRange);
            activeDateRange = undefined;
          }
        } catch (error) {
          console.warn('⚠️ Error parsing activeDateRange for schedule', s.id, error);
          activeDateRange = undefined;
        }
      }
      
      // Migrate shortcuts from localStorage if they exist and schedule doesn't have them
      let shortcutBindings = s.shortcutBindings;
      if (!shortcutBindings && typeof window !== 'undefined') {
        try {
          const savedShortcuts = localStorage.getItem(`schedule-shortcuts-${s.id}`);
          if (savedShortcuts) {
            shortcutBindings = JSON.parse(savedShortcuts);
            console.log(`🔄 Migrated shortcuts from localStorage for schedule ${s.id}`);
            // Clear the old localStorage entry after migration
            localStorage.removeItem(`schedule-shortcuts-${s.id}`);
          }
        } catch (error) {
          console.warn('⚠️ Error migrating shortcuts for schedule', s.id, error);
        }
      }
      
      return {
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        activeDateRange,
        shortcutBindings: shortcutBindings || undefined,
        // Ensure isActive is a boolean (might be string from JSON, or undefined)
        isActive: s.isActive === true || s.isActive === 'true' || false,
      };
    });
    
    // Find the schedule that should be active
    // Only restore schedules that are explicitly marked as active
    // If a schedule has activeDateRange but isActive is false, it was deactivated
    let activeScheduleToRestore = normalizedSchedules.find((s: Schedule) => s.isActive === true);
    
    // Ensure only one schedule is active
    return normalizedSchedules.map((s: Schedule) => ({
      ...s,
      isActive: activeScheduleToRestore && s.id === activeScheduleToRestore.id,
      // Clear activeDateRange if schedule is not active
      activeDateRange: (activeScheduleToRestore && s.id === activeScheduleToRestore.id) 
        ? s.activeDateRange 
        : undefined,
    }));
  };

  // Clear localStorage and state when user logs out (session becomes null)
  useEffect(() => {
    if (!session && typeof window !== 'undefined') {
      // User has logged out - clear all user-specific localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('calendar-events-') ||
          key.startsWith('calendar-schedules-') ||
          key.startsWith('showOneTimeEvents-') ||
          key.startsWith('showBaseLayer-') ||
          key.startsWith('customTimeGrids-') ||
          key.startsWith('schedule-shortcuts-')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove localStorage key: ${key}`, error);
        }
      });
      if (keysToRemove.length > 0) {
        console.log('🧹 Cleared localStorage on logout:', keysToRemove.length, 'keys');
      }
      
      // Clear state to prevent showing previous user's data
      setSchedules([]);
      setCurrentScheduleId(null);
      setState(prev => ({ ...prev, events: [] }));
      
      // Reset loading flags to allow fresh load for guest
      hasLoadedEvents.current = null;
      hasGeneratedEvents.current = null;
    }
  }, [session]);

  // Track previous userId to detect user changes
  const prevUserIdRef = useRef<string | null>(null);

  // Load schedules from MongoDB API or localStorage (for guests)
  useEffect(() => {
    const loadSchedules = async () => {
      // If userId changed from a logged-in user to guest, clear schedules first
      if (prevUserIdRef.current && prevUserIdRef.current !== 'guest' && userId === 'guest') {
        console.log('🔄 User logged out - clearing schedules state');
        setSchedules([]);
        setCurrentScheduleId(null);
      }
      prevUserIdRef.current = userId;

      if (userId !== 'guest') {
        // Load from MongoDB API
        try {
          console.log('📡 Fetching schedules from MongoDB for user:', userId);
          const response = await fetch('/api/schedules');
          if (response.ok) {
            const schedules = await response.json();
            const normalizedSchedules = normalizeSchedules(schedules);
            
            console.log('✅ Loaded schedules from MongoDB:', {
              count: normalizedSchedules.length,
              schedules: normalizedSchedules.map((s: Schedule) => ({
                id: s.id,
                name: s.name,
                isActive: s.isActive,
                templateEventsCount: s.templateEvents?.length || 0,
                hasActiveDateRange: !!s.activeDateRange,
              }))
            });
            
            setSchedules(normalizedSchedules);
            
            // Set current schedule to the active one
            const activeSchedule = normalizedSchedules.find(s => s.isActive);
            if (activeSchedule) {
              console.log('✅ Restored active schedule:', activeSchedule.id);
              setCurrentScheduleId(activeSchedule.id);
            } else {
              setCurrentScheduleId(null);
            }
            return;
          } else {
            console.warn('⚠️ Failed to fetch schedules from MongoDB, status:', response.status);
          }
        } catch (error) {
          console.error('❌ Failed to fetch schedules from API', error);
        }
      }

      // Fallback to localStorage for guest users or if API fails
      if (typeof window !== 'undefined') {
        const savedSchedules = localStorage.getItem(`calendar-schedules-${userId}`);
        if (savedSchedules) {
          try {
            const parsed = JSON.parse(savedSchedules);
            const normalizedSchedules = normalizeSchedules(parsed);
            
            console.log('📋 Loaded schedules from localStorage:', {
              count: normalizedSchedules.length,
              schedules: normalizedSchedules.map((s: Schedule) => ({
                id: s.id,
                name: s.name,
                isActive: s.isActive,
                templateEventsCount: s.templateEvents?.length || 0,
                hasActiveDateRange: !!s.activeDateRange,
              }))
            });
            
            setSchedules(normalizedSchedules);
            
            // Set current schedule to the active one
            const activeSchedule = normalizedSchedules.find(s => s.isActive);
            if (activeSchedule) {
              console.log('✅ Restored active schedule:', activeSchedule.id);
              setCurrentScheduleId(activeSchedule.id);
            } else {
              setCurrentScheduleId(null);
            }
          } catch (error) {
            console.error('Failed to load schedules from localStorage:', error);
            setSchedules([]);
            setCurrentScheduleId(null);
          }
        } else {
          // Explicitly clear schedules if no data found for guest
          if (userId === 'guest') {
            setSchedules([]);
            setCurrentScheduleId(null);
          }
        }
      }
    };
    
    loadSchedules();
  }, [userId]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (userId !== 'guest') {
          const response = await fetch('/api/categories');
          if (response.ok) {
            const cats = await response.json();
            setCategories(cats.map((cat: any) => ({
              ...cat,
              createdAt: cat.createdAt ? new Date(cat.createdAt) : undefined,
              updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : undefined,
            })));
          }
        } else {
          // For guest users, use default categories from localStorage or defaults
          const defaultCategories = [
            { id: 'category-1', name: 'Activity', color: '#1e3a5f' },
            { id: 'category-2', name: 'Deadline', color: '#c9a227' },
            { id: 'category-3', name: 'Work', color: '#2c5282' },
            { id: 'category-4', name: 'Life', color: '#64748b' },
            { id: 'category-5', name: 'Category 5', color: '#ef4444' },
            { id: 'category-6', name: 'Category 6', color: '#10b981' },
            { id: 'category-7', name: 'Category 7', color: '#8b5cf6' },
            { id: 'category-8', name: 'Category 8', color: '#f59e0b' },
          ];
          
          const saved = localStorage.getItem('categories-guest');
          if (saved) {
            try {
              const cats = JSON.parse(saved);
              // Merge saved categories with defaults (saved names override defaults, but colors stay fixed)
              const merged = defaultCategories.map(def => {
                const saved = cats.find((c: Category) => c.id === def.id);
                return saved ? { ...def, name: saved.name } : def;
              });
              setCategories(merged);
              localStorage.setItem('categories-guest', JSON.stringify(merged));
            } catch (e) {
              console.error('Failed to parse saved categories', e);
              setCategories(defaultCategories);
              localStorage.setItem('categories-guest', JSON.stringify(defaultCategories));
            }
          } else {
            setCategories(defaultCategories);
            localStorage.setItem('categories-guest', JSON.stringify(defaultCategories));
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    loadCategories();
  }, [userId]);

  // Category management functions
  const updateCategory = async (id: string, updates: { name: string }): Promise<Category> => {
    track('category_updated', {
      category_id: id,
      old_name: categories.find(c => c.id === id)?.name,
      new_name: updates.name,
    });
    
    if (userId === 'guest') {
      const updated = categories.map(cat => 
        cat.id === id ? { ...cat, name: updates.name } : cat
      );
      setCategories(updated);
      localStorage.setItem('categories-guest', JSON.stringify(updated));
      return updated.find(c => c.id === id)!;
    } else {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: updates.name }),
      });
      if (response.ok) {
        const updatedCategory = await response.json();
        // Update the categories state with the new category data
        setCategories(prev => {
          const updated = prev.map(c => {
            if (c.id === id || (c as any).defaultCategoryId === id) {
              return {
                ...c,
                name: updatedCategory.name,
                // Preserve color - it cannot be changed
                color: updatedCategory.color || c.color,
                // Ensure we preserve the id correctly
                id: updatedCategory.id || c.id,
              };
            }
            return c;
          });
          // If it's a default category override, we might need to add it if it doesn't exist
          const defaultIds = ['category-1', 'category-2', 'category-3', 'category-4', 'category-5', 'category-6', 'category-7', 'category-8'];
          if (defaultIds.includes(id) && !updated.find(c => c.id === id || (c as any).defaultCategoryId === id)) {
            // Add the override if it's new
            return [...updated, updatedCategory];
          }
          return updated;
        });
        return updatedCategory;
      }
      throw new Error('Failed to update category');
    }
  };

  // Create a stable key for schedules to detect changes
  const schedulesKey = useMemo(() => {
    if (schedules.length === 0) return '';
    const activeSchedule = schedules.find(s => s.isActive);
    if (!activeSchedule) return '';
    return `${activeSchedule.id}-${activeSchedule.templateEvents.length}-${activeSchedule.updatedAt.getTime()}`;
  }, [schedules]);
  
  // Auto-generate events for active schedule when schedules and time grids are loaded
  useEffect(() => {
    // Prevent infinite loops by checking if we're already generating
    if (isGeneratingEvents.current) {
      console.log('⏸️ Skipping auto-generation - already generating');
      return;
    }
    
    if (schedules.length > 0 && allTimeGrids.length > 0 && isHydrated) {
      const activeSchedule = schedules.find(s => s.isActive);
      
      console.log('🔍 Auto-generation check:', {
        schedulesCount: schedules.length,
        timeGridsCount: allTimeGrids.length,
        isHydrated,
        schedulesKey,
        hasGeneratedKey: hasGeneratedEvents.current,
        allSchedules: schedules.map(s => ({
          id: s.id,
          name: s.name,
          isActive: s.isActive,
          templateEventsCount: s.templateEvents?.length || 0,
        })),
        activeSchedule: activeSchedule ? {
          id: activeSchedule.id,
          name: activeSchedule.name,
          templateEventsCount: activeSchedule.templateEvents.length,
          isActive: activeSchedule.isActive
        } : null
      });
      
      if (activeSchedule && activeSchedule.templateEvents.length > 0) {
        // Only generate if we haven't already generated for this exact schedule version
        if (hasGeneratedEvents.current !== schedulesKey) {
          console.log('🚀 Auto-generating schedule events for:', activeSchedule.id, 'Key:', schedulesKey);
          
          // Use the schedule's active date range if it exists, otherwise use a wide range
          let startDate: Date;
          let endDate: Date;
          
          if (activeSchedule.activeDateRange) {
            // Use the stored active date range
            startDate = new Date(activeSchedule.activeDateRange.startDate);
            endDate = new Date(activeSchedule.activeDateRange.endDate);
            console.log('📅 Using stored active date range:', {
              start: startDate.toISOString().split('T')[0],
              end: endDate.toISOString().split('T')[0]
            });
          } else {
            // Generate events for a wide date range (3 months back, 6 months forward) as fallback
            const now = new Date();
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            endDate = new Date(now);
            endDate.setMonth(now.getMonth() + 6);
            console.log('📅 Using default date range (no active range stored)');
          }
          
          hasGeneratedEvents.current = schedulesKey;
          // Auto-generation: don't update activeDateRange, use existing if available
          generateScheduleEvents(activeSchedule.id, startDate, endDate, false);
        } else {
          console.log('⏭️ Skipping - already generated for key:', schedulesKey);
        }
      } else {
        console.log('❌ No active schedule or schedule has no template events');
        // No active schedule, reset the flag
        if (hasGeneratedEvents.current !== null) {
          hasGeneratedEvents.current = null;
        }
      }
    } else {
      console.log('⏳ Auto-generation conditions not met:', {
        schedulesCount: schedules.length,
        timeGridsCount: allTimeGrids.length,
        isHydrated
      });
    }
  }, [schedulesKey, allTimeGrids.length, isHydrated]);
  
  // Save schedules to MongoDB API or localStorage (for guests)
  // Note: This effect runs when schedules change, but individual operations (create/update/delete)
  // should handle their own API calls. This is mainly for syncing state.
  // We'll keep localStorage sync for guests and as a backup.
  useEffect(() => {
    if (typeof window !== 'undefined' && schedules.length > 0) {
      // For guest users, save to localStorage
      if (userId === 'guest') {
        const schedulesToSave = schedules.map(s => ({
          ...s,
          isActive: s.isActive ?? false,
        }));
        
        const serialized = JSON.stringify(schedulesToSave);
        localStorage.setItem(`calendar-schedules-${userId}`, serialized);
        
        const activeSchedule = schedulesToSave.find(s => s.isActive);
        if (activeSchedule) {
          console.log('💾 Saving schedules to localStorage (guest):', {
            totalSchedules: schedulesToSave.length,
            activeScheduleId: activeSchedule.id,
          });
        }
      }
      // For logged-in users, schedules are saved via API in create/update/delete functions
    }
  }, [schedules, userId]);
  
  // Get current schedule
  const currentSchedule = useMemo(() => {
    return schedules.find(s => s.id === currentScheduleId) || null;
  }, [schedules, currentScheduleId]);
  
  // Create a new schedule
  const createSchedule = async (name: string, timeGridId: string): Promise<Schedule> => {
    const newSchedule: Schedule = {
      id: `schedule-${Date.now()}`, // Temporary ID, will be replaced by MongoDB _id
      name,
      timeGridId,
      templateEvents: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    track('schedule_created', {
      schedule_name: name,
      time_grid_id: timeGridId,
    });
    
    // Optimistically update UI
    setSchedules(prev => [...prev, newSchedule]);
    
    // Save to MongoDB if logged in
    if (userId !== 'guest') {
      try {
        const response = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSchedule),
        });
        
        if (response.ok) {
          const savedSchedule = await response.json();
          // Replace temporary ID with MongoDB ID
          setSchedules(prev => prev.map(s => 
            s.id === newSchedule.id 
              ? {
                  ...savedSchedule,
                  createdAt: new Date(savedSchedule.createdAt),
                  updatedAt: new Date(savedSchedule.updatedAt),
                  activeDateRange: savedSchedule.activeDateRange ? {
                    startDate: new Date(savedSchedule.activeDateRange.startDate),
                    endDate: new Date(savedSchedule.activeDateRange.endDate),
                  } : undefined,
                }
              : s
          ));
          return {
            ...savedSchedule,
            createdAt: new Date(savedSchedule.createdAt),
            updatedAt: new Date(savedSchedule.updatedAt),
            activeDateRange: savedSchedule.activeDateRange ? {
              startDate: new Date(savedSchedule.activeDateRange.startDate),
              endDate: new Date(savedSchedule.activeDateRange.endDate),
            } : undefined,
          };
        } else {
          console.error('Failed to save schedule to MongoDB');
          // Keep the optimistic update for now
        }
      } catch (error) {
        console.error('Error saving schedule to MongoDB:', error);
        // Keep the optimistic update for now
      }
    }
    
    return newSchedule;
  };
  
  // Update a schedule
  const updateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
    track('schedule_updated', {
      schedule_id: scheduleId,
      updated_fields: Object.keys(updates),
      time_grid_changed: 'timeGridId' in updates,
      name_changed: 'name' in updates,
      active_changed: 'isActive' in updates,
    });
    
    // Optimistically update UI
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { ...s, ...updates, updatedAt: new Date() }
        : s
    ));
    
    // Save to MongoDB if logged in
    if (userId !== 'guest') {
      try {
        const response = await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: scheduleId, ...updates }),
        });
        
        if (response.ok) {
          const updatedSchedule = await response.json();
          // Update with server response
          setSchedules(prev => prev.map(s => 
            s.id === scheduleId 
              ? {
                  ...updatedSchedule,
                  createdAt: new Date(updatedSchedule.createdAt),
                  updatedAt: new Date(updatedSchedule.updatedAt),
                  activeDateRange: updatedSchedule.activeDateRange ? {
                    startDate: new Date(updatedSchedule.activeDateRange.startDate),
                    endDate: new Date(updatedSchedule.activeDateRange.endDate),
                  } : undefined,
                }
              : s
          ));
        } else {
          console.error('Failed to update schedule in MongoDB');
        }
      } catch (error) {
        console.error('Error updating schedule in MongoDB:', error);
      }
    }
  };
  
  // Delete a schedule
  const deleteSchedule = async (scheduleId: string) => {
    const scheduleToDelete = schedules.find(s => s.id === scheduleId);
    
    track('schedule_deleted', {
      schedule_id: scheduleId,
      schedule_name: scheduleToDelete?.name,
      template_events_count: scheduleToDelete?.templateEvents?.length || 0,
    });
    
    // Optimistically update UI
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    if (currentScheduleId === scheduleId) {
      setCurrentScheduleId(null);
    }
    // Also remove generated events from this schedule
    setState(prev => ({
      ...prev,
      events: prev.events.filter(e => !e.id.startsWith(`sched-${scheduleId}`)),
    }));
    
    // Delete from MongoDB if logged in
    if (userId !== 'guest') {
      try {
        const response = await fetch(`/api/schedules?id=${scheduleId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.error('Failed to delete schedule from MongoDB');
          // Could revert optimistic update here if needed
        }
      } catch (error) {
        console.error('Error deleting schedule from MongoDB:', error);
        // Could revert optimistic update here if needed
      }
    }
  };
  
  // Add template event to a schedule
  const addTemplateEvent = (scheduleId: string, event: Omit<ScheduleTemplateEvent, 'id'>) => {
    const newEvent: ScheduleTemplateEvent = {
      ...event,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId
        ? { ...s, templateEvents: [...s.templateEvents, newEvent], updatedAt: new Date() }
        : s
    ));
  };
  
  // Update template event in a schedule
  const updateTemplateEvent = (scheduleId: string, eventId: string, updates: Partial<ScheduleTemplateEvent>) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId
        ? { 
            ...s, 
            templateEvents: s.templateEvents.map(e => 
              e.id === eventId ? { ...e, ...updates } : e
            ),
            updatedAt: new Date()
          }
        : s
    ));
  };
  
  // Delete template event from a schedule
  const deleteTemplateEvent = (scheduleId: string, eventId: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId
        ? { 
            ...s, 
            templateEvents: s.templateEvents.filter(e => e.id !== eventId),
            updatedAt: new Date()
          }
        : s
    ));
  };
  
  // Generate calendar events from a schedule for a date range
  // If updateActiveRange is true, the provided dates will update the schedule's activeDateRange
  // If false, the existing activeDateRange (if any) will be used to constrain generation
  const generateScheduleEvents = (
    scheduleId: string, 
    startDate: Date, 
    endDate: Date,
    updateActiveRange: boolean = true
  ) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      console.warn(`Schedule ${scheduleId} not found`);
      return;
    }
    
    const timeGrid = allTimeGrids.find(g => g.id === schedule.timeGridId);
    if (!timeGrid) {
      console.warn(`Time grid ${schedule.timeGridId} not found for schedule ${scheduleId}`);
      return;
    }
    
    if (schedule.templateEvents.length === 0) {
      console.warn(`Schedule ${scheduleId} has no template events`);
      return;
    }
    
    // Determine the effective date range
    let effectiveStartDate: Date;
    let effectiveEndDate: Date;
    
    if (updateActiveRange) {
      // User is explicitly activating with new dates - update the activeDateRange
      effectiveStartDate = new Date(startDate);
      effectiveEndDate = new Date(endDate);
      
      track('schedule_activated', {
        schedule_id: scheduleId,
        schedule_name: schedule.name,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        template_events_count: schedule.templateEvents.length,
      });
      
      // Store the active date range in the schedule
      const updatedSchedule = {
        isActive: true,
        activeDateRange: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        updatedAt: new Date()
      };
      
      setSchedules(prev => prev.map(s => 
        s.id === scheduleId
          ? { ...s, ...updatedSchedule }
          : { ...s, isActive: false } // Deactivate other schedules
      ));
      
      // Save to MongoDB if logged in
      if (userId !== 'guest') {
        updateSchedule(scheduleId, updatedSchedule).catch(error => {
          console.error('Error saving schedule activation to MongoDB:', error);
        });
      }
    } else {
      // Auto-generation: use existing activeDateRange if it exists, otherwise use provided range
      const existingActiveRange = schedule.activeDateRange;
      if (existingActiveRange) {
        // Use the existing active date range to constrain generation
        effectiveStartDate = new Date(existingActiveRange.startDate);
        effectiveEndDate = new Date(existingActiveRange.endDate);
      } else {
        // No existing range, use the provided range (but don't store it)
        effectiveStartDate = new Date(startDate);
        effectiveEndDate = new Date(endDate);
      }
      
      // Update isActive status
      const isActiveUpdate = { isActive: true, updatedAt: new Date() };
      setSchedules(prev => prev.map(s => 
        s.id === scheduleId
          ? { ...s, ...isActiveUpdate }
          : { ...s, isActive: false }
      ));
      
      // Save to MongoDB if logged in
      if (userId !== 'guest') {
        updateSchedule(scheduleId, isActiveUpdate).catch(error => {
          console.error('Error saving schedule activation to MongoDB:', error);
        });
      }
    }
    
    const generatedEvents: CalendarEvent[] = [];
    
    // Only generate events within the active date range
    for (let d = new Date(effectiveStartDate); d <= effectiveEndDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      
      const dayTemplates = schedule.templateEvents.filter(t => t.dayIndex === dayOfWeek);
      
      dayTemplates.forEach(template => {
        const period = timeGrid.periods.find(p => p.id === template.periodId);
        if (!period) return;
        
        const [startHour, startMinute] = period.startTime.split(':').map(Number);
        const [endHour, endMinute] = period.endTime.split(':').map(Number);
        
        const eventStart = new Date(d);
        eventStart.setHours(startHour, startMinute, 0, 0);
        
        const eventEnd = new Date(d);
        eventEnd.setHours(endHour, endMinute, 0, 0);
        
        generatedEvents.push({
          id: `sched-${scheduleId}-${template.id}-${d.toISOString().split('T')[0]}`,
          title: template.title,
          start: new Date(eventStart),
          end: new Date(eventEnd),
          color: template.color,
          description: template.notes || '',
          location: template.location,
          eventType: 'schedule',
        });
      });
    }
    
    // Update the generation tracking key immediately
    const updatedSchedule = schedules.find(s => s.id === scheduleId);
    const newScheduleKey = `${scheduleId}-${updatedSchedule?.templateEvents.length || schedule.templateEvents.length}-${updatedSchedule?.updatedAt?.getTime() || schedule.updatedAt.getTime()}`;
    hasGeneratedEvents.current = newScheduleKey;
    console.log('🔑 Set generation key:', newScheduleKey);
    
    // Remove old generated events from this schedule AND add new events in one update
    isGeneratingEvents.current = true;
    setState(prev => {
      const filteredEvents = prev.events.filter(e => !e.id.startsWith(`sched-${scheduleId}`));
      const newEvents = [...filteredEvents, ...generatedEvents];
      return {
        ...prev,
        events: newEvents,
      };
    });
    
    // Reset flag after a short delay to allow state to update
    setTimeout(() => {
      isGeneratingEvents.current = false;
      console.log('✅ Generation complete, flag reset');
    }, 200);
  };
  
  // Deactivate a schedule (remove its generated events)
  const deactivateSchedule = async (scheduleId: string) => {
    const scheduleToDeactivate = schedules.find(s => s.id === scheduleId);
    
    track('schedule_deactivated', {
      schedule_id: scheduleId,
      schedule_name: scheduleToDeactivate?.name,
    });
    
    // Remove generated events for this schedule
    setState(prev => ({
      ...prev,
      events: prev.events.filter(e => !e.id.startsWith(`sched-${scheduleId}`)),
    }));
    
    // Clear activeDateRange and set isActive to false
    const deactivateUpdate = { 
      isActive: false, 
      activeDateRange: undefined,
      updatedAt: new Date() 
    };
    
    // Optimistically update UI
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { ...s, ...deactivateUpdate }
        : s
    ));
    
    // Save to MongoDB if logged in
    if (userId !== 'guest') {
      try {
        await updateSchedule(scheduleId, deactivateUpdate);
      } catch (error) {
        console.error('Error saving schedule deactivation to MongoDB:', error);
        // Revert on error
        setSchedules(prev => prev.map(s => 
          s.id === scheduleId 
            ? { ...s, isActive: true, activeDateRange: s.activeDateRange }
            : s
        ));
      }
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    setState(prev => {
      const newDate = (() => {
        switch (prev.view) {
          case 'month':
            return navigateMonth(prev.currentDate, direction);
          case 'week':
            return navigateWeek(prev.currentDate, direction);
          case 'day':
            return navigateDay(prev.currentDate, direction);
          default:
            return prev.currentDate;
        }
      })();
      
      track('calendar_navigate', {
        direction,
        view: prev.view,
        from_date: prev.currentDate.toISOString(),
        to_date: newDate.toISOString(),
      });
      
      return {
        ...prev,
        currentDate: newDate,
      };
    });
  };

  const setView = (view: CalendarView) => {
    setState(prev => {
      track('calendar_view_change', {
        from_view: prev.view,
        to_view: view,
        date: prev.currentDate.toISOString(),
      });
      return { ...prev, view };
    });
  };

  const setSelectedDate = (date: Date) => {
    setState(prev => {
      // Update currentDate when selecting a date so that when switching views,
      // week view shows the week containing the selected date,
      // and day view shows the selected date
      return { ...prev, selectedDate: date, currentDate: date };
    });
  };

  const setSelectedEvent = (event: CalendarEvent | undefined) => {
    setState(prev => ({ ...prev, selectedEvent: event }));
  };

  const addEvent = async (event: CalendarEvent) => {
    if (event.eventType === 'event') {
      await addOneTimeEvent(event);
    } else {
      // For schedule events, we usually don't add them directly via addEvent
      // but if we do:
      setState(prev => ({
        ...prev,
        events: [...prev.events, event],
      }));
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    const eventToUpdate = state.events.find(e => e.id === eventId);
    
    track('event_updated', {
      event_id: eventId,
      event_type: eventToUpdate?.eventType,
      updated_fields: Object.keys(updates),
      category_changed: 'category' in updates,
      title_changed: 'title' in updates,
    });
    
    if (userId !== 'guest') {
      // Check if it's a one-time event (persisted in DB)
      if (eventToUpdate && eventToUpdate.eventType === 'event') {
        try {
          const response = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updates, id: eventId }),
          });
          
          if (!response.ok) {
            console.error('Failed to update event in API');
            // We might want to revert state if failed, but for now let's just update local state
          }
        } catch (error) {
          console.error('Failed to update event in API', error);
        }
      }
    }

    setState(prev => ({
      ...prev,
      events: prev.events.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      ),
    }));
  };

  const deleteEvent = async (eventId: string) => {
    const eventToDelete = state.events.find(e => e.id === eventId);
    
    track('event_deleted', {
      event_id: eventId,
      event_type: eventToDelete?.eventType,
      title: eventToDelete?.title,
      category: eventToDelete?.category,
    });
    
    if (userId !== 'guest') {
      if (eventToDelete && eventToDelete.eventType === 'event') {
        try {
          await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Failed to delete event in API', error);
        }
      }
    }

    setState(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId),
      selectedEvent: prev.selectedEvent?.id === eventId ? undefined : prev.selectedEvent,
    }));
  };

  // Time Grid Management Functions
  const addCustomTimeGrid = (timeGrid: TimeGrid) => {
    const newTimeGrid = { ...timeGrid, id: `custom-${Date.now()}` };
    
    track('time_grid_created', {
      time_grid_id: newTimeGrid.id,
      time_grid_name: newTimeGrid.name,
      periods_count: newTimeGrid.periods?.length || 0,
    });
    
    setCustomTimeGrids(prev => [...prev, newTimeGrid]);
    setAllTimeGrids(prev => [...prev, newTimeGrid]);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      const savedGrids = [...customTimeGrids, newTimeGrid];
      localStorage.setItem(`customTimeGrids-${userId}`, JSON.stringify(savedGrids));
    }
  };

  const updateCustomTimeGrid = (timeGridId: string, updates: Partial<TimeGrid>) => {
    track('time_grid_updated', {
      time_grid_id: timeGridId,
      updated_fields: Object.keys(updates),
    });
    
    setCustomTimeGrids(prev => 
      prev.map(grid => grid.id === timeGridId ? { ...grid, ...updates } : grid)
    );
    setAllTimeGrids(prev => 
      prev.map(grid => grid.id === timeGridId ? { ...grid, ...updates } : grid)
    );
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      const updatedGrids = customTimeGrids.map(grid => 
        grid.id === timeGridId ? { ...grid, ...updates } : grid
      );
      localStorage.setItem(`customTimeGrids-${userId}`, JSON.stringify(updatedGrids));
    }
  };

  const deleteCustomTimeGrid = (timeGridId: string) => {
    const gridToDelete = customTimeGrids.find(g => g.id === timeGridId);
    
    track('time_grid_deleted', {
      time_grid_id: timeGridId,
      time_grid_name: gridToDelete?.name,
    });
    
    setCustomTimeGrids(prev => prev.filter(grid => grid.id !== timeGridId));
    setAllTimeGrids(prev => prev.filter(grid => grid.id !== timeGridId));
    
    // If current grid is being deleted, switch to default
    if (currentTimeGrid.id === timeGridId) {
      setCurrentTimeGrid(getDefaultTimeGrid());
    }
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      const updatedGrids = customTimeGrids.filter(grid => grid.id !== timeGridId);
      localStorage.setItem(`customTimeGrids-${userId}`, JSON.stringify(updatedGrids));
    }
  };

  // Load custom time grids from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGrids = localStorage.getItem(`customTimeGrids-${userId}`);
      if (savedGrids) {
        try {
          const parsedGrids = JSON.parse(savedGrids);
          setCustomTimeGrids(parsedGrids);
          setAllTimeGrids([...defaultTimeGrids, ...parsedGrids]);
        } catch (error) {
          console.error('Error loading custom time grids:', error);
        }
      } else {
        setCustomTimeGrids([]);
        setAllTimeGrids([...defaultTimeGrids]);
      }
    }
  }, [userId]);

  const monthCells = useMemo((): CalendarCell[] => {
    const days = getCalendarDays(state.currentDate);
    const monthEvents = getEventsForMonth(filteredEvents, state.currentDate);

    return days.map(date => {
      const dayEvents = getEventsForDate(monthEvents, date);
      return {
        date,
        isCurrentMonth: isSameMonth(date, state.currentDate),
        isToday: isToday(date),
        isSelected: state.selectedDate ? isSameDay(date, state.selectedDate) : false,
        events: dayEvents,
      };
    });
  }, [state.currentDate, filteredEvents, state.selectedDate]);

  const weekDays = useMemo((): WeekDay[] => {
    const days = getWeekDays(state.currentDate);
    const weekEvents = getEventsForWeek(filteredEvents, days[0]);
    

    return days.map(date => {
      const dayEvents = getEventsForDate(weekEvents, date);
      return {
        date,
        isToday: isToday(date),
        isSelected: state.selectedDate ? isSameDay(date, state.selectedDate) : false,
        events: dayEvents,
      };
    });
  }, [state.currentDate, filteredEvents, state.selectedDate]);

  const dayTimeSlots = useMemo((): TimeSlot[] => {
    const timeSlots = getTimeSlots(state.currentDate, currentTimeGrid);
    const dayEvents = getEventsForDate(filteredEvents, state.currentDate);
    

    const processedTimeSlots = timeSlots.map(timeSlot => ({
      ...timeSlot,
      events: getEventsForTimeSlot(dayEvents, timeSlot),
    }));

    // Filter out break periods if toggle is off
    if (!showBreakPeriods) {
      return processedTimeSlots.filter(timeSlot => !timeSlot.period.isBreak);
    }

    return processedTimeSlots;
  }, [state.currentDate, filteredEvents, currentTimeGrid, showBreakPeriods]);

  // Keep the old dayHours for backward compatibility with existing components
  const dayHours = useMemo((): DayHour[] => {
    const hours = getDayHours(state.currentDate);
    const dayEvents = getEventsForDate(filteredEvents, state.currentDate);

    return hours.map(hourDate => ({
      hour: hourDate.getHours(),
      date: hourDate,
      events: getEventsForDate(dayEvents, hourDate),
    }));
  }, [state.currentDate, filteredEvents]);

  return {
    state,
    navigate,
    setView,
    setSelectedDate,
    setSelectedEvent,
    addEvent,
    updateEvent,
    deleteEvent,
    monthCells,
    weekDays,
    dayHours,
    dayTimeSlots,
    currentTimeGrid,
    setCurrentTimeGrid: handleTimeGridChange,
    allTimeGrids,
    customTimeGrids,
    addCustomTimeGrid,
    updateCustomTimeGrid,
    deleteCustomTimeGrid,
    showBreakPeriods,
    setShowBreakPeriods,
    // Event type management
    showOneTimeEvents,
    setShowOneTimeEvents,
    // Base layer visibility (for schedule events - controls both visibility and visual styling)
    showBaseLayer,
    setShowBaseLayer,
    // Category filters
    categories,
    categoryVisibility,
    toggleCategory,
    oneTimeEvents,
    scheduleEvents,
    addScheduleEvent,
    addOneTimeEvent,
    clearScheduleEvents,
    // Schedule management
    schedules,
    currentSchedule,
    currentScheduleId,
    setCurrentScheduleId,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    addTemplateEvent,
    updateTemplateEvent,
    deleteTemplateEvent,
    generateScheduleEvents,
    deactivateSchedule,
    // Category management
    updateCategory,
    // Event refresh
    refreshEvents,
  };
};

