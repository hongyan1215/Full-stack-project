import { Category, CalendarEvent, EventCategory } from '../types/calendar';

// Default categories fallback (8 fixed categories)
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'category-1', name: 'Activity', color: '#1e3a5f' },
  { id: 'category-2', name: 'Deadline', color: '#c9a227' },
  { id: 'category-3', name: 'Work', color: '#2c5282' },
  { id: 'category-4', name: 'Life', color: '#64748b' },
  { id: 'category-5', name: 'Category 5', color: '#ef4444' },
  { id: 'category-6', name: 'Category 6', color: '#10b981' },
  { id: 'category-7', name: 'Category 7', color: '#8b5cf6' },
  { id: 'category-8', name: 'Category 8', color: '#f59e0b' },
];

/**
 * Get the color for an event based on its category
 * Schedule events (eventType === 'schedule') may have a direct color property
 * Regular events use their category color
 */
export function getEventColor(event: CalendarEvent, categories: Category[] = []): string {
  // Schedule events might have a color property from ScheduleTemplateEvent
  // For now, we'll check if it's a schedule event and use category if no color
  if (event.eventType === 'schedule' && (event as any).color) {
    return (event as any).color;
  }

  // Regular events use category color
  if (event.category) {
    // First check user categories, then default categories
    const category = categories.find(c => c.id === event.category) ||
                     DEFAULT_CATEGORIES.find(c => c.id === event.category);
    
    if (category) {
      return category.color;
    }
  }

  // Fallback to first category color
  const fallbackCategory = categories[0] || DEFAULT_CATEGORIES[0];
  return fallbackCategory?.color || '#64748b';
}

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: EventCategory | undefined, categories: Category[] = []): Category | undefined {
  if (!categoryId) return undefined;
  
  return categories.find(c => c.id === categoryId) ||
         DEFAULT_CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Get all categories (user + defaults)
 */
export function getAllCategories(categories: Category[] = []): Category[] {
  // Merge user categories with defaults, user categories override defaults
  const categoryMap = new Map<string, Category>();
  
  // Add defaults first
  DEFAULT_CATEGORIES.forEach(cat => {
    categoryMap.set(cat.id, cat);
  });
  
  // Override with user categories
  categories.forEach(cat => {
    if (cat.id && cat.id !== 'routine' && cat.id !== 'assignment' && cat.id !== 'activity' && cat.id !== 'other') {
      categoryMap.set(cat.id, cat);
    }
  });
  
  return Array.from(categoryMap.values());
}

