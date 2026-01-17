'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventCategory, Category } from '../types/calendar';
import { formatDate } from '../utils/dateUtils';
import { useTheme, ThemeType } from '../contexts/ThemeContext';
import { getEventColor, getCategoryById } from '../utils/categoryUtils';

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  initialDate?: Date;
  categories?: Category[];
}

// Removed THEME_CATEGORY_COLORS - now using categories from props

// Predefined icons
const PREDEFINED_ICONS = [
  '📅', '🎂', '🎉', '🏋️', '📚', '✈️', '💊', '🍽️', 
  '💼', '🏠', '🚗', '💰', '🎨', '🎮', '🎵', '🎬',
  '🏀', '⚽', '🧘', '💤', '🧹', '🛒', '🎓', '💻'
];

const EventModal: React.FC<EventModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  categories = [],
}) => {
  const { theme } = useTheme();
  
  const getCategoryColor = (categoryId: EventCategory | undefined): string => {
    if (!categoryId) return '#1e3a5f'; // Default to first category color
    const category = getCategoryById(categoryId, categories);
    return category?.color || '#1e3a5f';
  };

  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    allDay: false,
    eventType: 'event' as 'event' | 'schedule',
    category: 'other' as EventCategory,
    icon: '',
    enableNotification: false,
    notificationMinutesBefore: 15,
  });

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [timeError, setTimeError] = useState<string>('');

  useEffect(() => {
    setTimeError(''); // Clear any previous error when modal opens or event changes
    if (event) {
      setFormData({
        title: event.title,
        start: formatDate(event.start, "yyyy-MM-dd'T'HH:mm"),
        end: formatDate(event.end, "yyyy-MM-dd'T'HH:mm"),
        description: event.description || '',
        allDay: event.allDay || false,
        eventType: event.eventType || 'event',
        category: event.category || 'category-1',
        icon: event.icon || '',
        enableNotification: event.enableNotification || false,
        notificationMinutesBefore: event.notificationMinutesBefore || 15,
      });
    } else {
      // Default start time: initialDate or now, rounded to next hour
      const startDate = initialDate ? new Date(initialDate) : new Date();
      if (!initialDate) {
        // If no specific date provided (just "Add Event"), round to next hour
        startDate.setMinutes(0, 0, 0);
        startDate.setHours(startDate.getHours() + 1);
      } else {
        // If date provided (e.g. clicked on day), set to 9 AM if it's midnight, or keep time if provided
        if (startDate.getHours() === 0 && startDate.getMinutes() === 0) {
           startDate.setHours(9, 0, 0, 0);
        }
      }
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      setFormData({
        title: '',
        start: formatDate(startDate, "yyyy-MM-dd'T'HH:mm"),
        end: formatDate(endDate, "yyyy-MM-dd'T'HH:mm"),
        description: '',
        allDay: false,
        eventType: 'event',
        category: 'category-1',
        icon: '',
        enableNotification: false,
        notificationMinutesBefore: 15,
      });
    }
  }, [event, initialDate, isOpen]);

  const handleCategoryChange = (newCategory: EventCategory) => {
    setFormData({ 
      ...formData, 
      category: newCategory,
    });
  };

  const handleIconSelect = (icon: string) => {
    setFormData({ ...formData, icon });
    setShowIconPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Validate time range
    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    
    if (startDate >= endDate) {
      setTimeError('結束時間必須晚於開始時間');
      return;
    }

    setTimeError(''); // Clear any previous error

    const eventData: CalendarEvent = {
      id: event?.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      start: startDate,
      end: endDate,
      description: formData.description,
      // color removed - events now use category color
      allDay: formData.allDay,
      eventType: formData.eventType,
      category: formData.category,
      icon: formData.icon,
      enableNotification: formData.enableNotification,
      notificationMinutesBefore: formData.enableNotification ? formData.notificationMinutesBefore : undefined,
    };

    onSave(eventData);
    onClose();
  };

  const handleDelete = () => {
    if (event) {
      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal" onClick={onClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2 className="event-modal-title">
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="start">
              Start Date & Time
            </label>
            <input
              id="start"
              type="datetime-local"
              className={timeError ? "form-input form-input-error" : "form-input"}
              value={formData.start}
              onChange={(e) => {
                setFormData({ ...formData, start: e.target.value });
                setTimeError(''); // Clear error when user changes input
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="end">
              End Date & Time
            </label>
            <input
              id="end"
              type="datetime-local"
              className={timeError ? "form-input form-input-error" : "form-input"}
              value={formData.end}
              onChange={(e) => {
                setFormData({ ...formData, end: e.target.value });
                setTimeError(''); // Clear error when user changes input
              }}
              required
            />
            {timeError && (
              <div className="form-error-message" style={{ marginTop: '0.25rem', color: '#ef4444', fontSize: '0.875rem' }}>
                {timeError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="form-input"
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value as EventCategory)}
            >
              {categories.length > 0 ? (
                categories
                  .filter(cat => {
                    // Only show regular categories (category-1 through category-8), exclude schedule category
                    const match = cat.id.match(/^category-(\d+)$/);
                    if (!match) return false;
                    const num = parseInt(match[1]);
                    return num >= 1 && num <= 8;
                  })
                  .sort((a, b) => {
                    // Sort by category number
                    const aNum = parseInt(a.id.replace('category-', '') || '0');
                    const bNum = parseInt(b.id.replace('category-', '') || '0');
                    return aNum - bNum;
                  })
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
              ) : (
                // Fallback to default 8 categories if none loaded
                <>
                  <option value="category-1">Activity</option>
                  <option value="category-2">Deadline</option>
                  <option value="category-3">Work</option>
                  <option value="category-4">Life</option>
                  <option value="category-5">Category 5</option>
                  <option value="category-6">Category 6</option>
                  <option value="category-7">Category 7</option>
                  <option value="category-8">Category 8</option>
                </>
              )}
            </select>
            {formData.category && (
              <div style={{ 
                marginTop: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Color:</span>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: getCategoryColor(formData.category),
                  border: '1px solid var(--border-light)',
                }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-selector-container">
              <div 
                className="selected-icon-display"
                onClick={() => setShowIconPicker(!showIconPicker)}
                style={{
                  padding: '0.5rem',
                  border: '2px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-input)'
                }}
              >
                <span>{formData.icon || 'Select an icon...'}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>▼</span>
              </div>
              
              {showIconPicker && (
                <div className="icon-picker-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-modal)',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  <button
                    type="button"
                    onClick={() => handleIconSelect('')}
                    style={{
                      padding: '0.25rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '1.2rem'
                    }}
                    title="No Icon"
                  >
                    🚫
                  </button>
                  {PREDEFINED_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      style={{
                        padding: '0.25rem',
                        border: formData.icon === icon ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
                        borderRadius: '4px',
                        background: formData.icon === icon ? 'var(--bg-selected)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox">
              <input
                id="allDay"
                type="checkbox"
                className="checkbox-input"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              />
              <label className="form-label" htmlFor="allDay">
                All Day Event
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox">
              <input
                id="enableNotification"
                type="checkbox"
                className="checkbox-input"
                checked={formData.enableNotification}
                onChange={(e) => setFormData({ ...formData, enableNotification: e.target.checked })}
              />
              <label className="form-label" htmlFor="enableNotification">
                啟用通知
              </label>
            </div>
          </div>

          {formData.enableNotification && (
            <div className="form-group">
              <label className="form-label" htmlFor="notificationMinutesBefore">
                提前通知時間
              </label>
              <div className="notification-time-selector">
                <select
                  id="notificationMinutesBefore"
                  className="form-input"
                  value={formData.notificationMinutesBefore}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      // For custom, we'll use a number input
                      const customValue = prompt('請輸入提前通知的分鐘數（例如：30）：');
                      if (customValue) {
                        const minutes = parseInt(customValue, 10);
                        if (!isNaN(minutes) && minutes > 0) {
                          setFormData({ ...formData, notificationMinutesBefore: minutes });
                        }
                      }
                    } else {
                      setFormData({ ...formData, notificationMinutesBefore: parseInt(value, 10) });
                    }
                  }}
                >
                  <option value="5">5 分鐘前</option>
                  <option value="15">15 分鐘前</option>
                  <option value="30">30 分鐘前</option>
                  <option value="60">1 小時前</option>
                  <option value="custom">自訂...</option>
                </select>
                {![5, 15, 30, 60].includes(formData.notificationMinutesBefore) && (
                  <span className="notification-custom-time">
                    （目前設定：{formData.notificationMinutesBefore} 分鐘前）
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            {event && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
