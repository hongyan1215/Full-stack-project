'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { use } from 'react';
import { CalendarEvent, CalendarCell, Category } from '@/types/calendar';
import { getCalendarDays, formatDate } from '@/utils/dateUtils';
import { getEventColor } from '@/utils/categoryUtils';
import MonthView from '@/components/MonthView';
import clsx from 'clsx';
import '@/styles/Calendar.css';
import '@/app/globals.css';

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { shareId } = use(params);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shareTitle, setShareTitle] = useState('');

  useEffect(() => {
    const loadShare = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/calendar/share/${shareId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('分享連結不存在');
          } else if (response.status === 410) {
            setError('分享連結已過期');
          } else {
            setError('載入分享失敗');
          }
          return;
        }

        const data = await response.json();
        
        // Convert date strings to Date objects
        const parsedEvents: CalendarEvent[] = data.events.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));

        setEvents(parsedEvents);

        // Set title based on date range
        if (data.dateRange) {
          const start = new Date(data.dateRange.start);
          const end = new Date(data.dateRange.end);
          
          // Validate dates
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date range');
          }
          
          if (data.config.shareScope === 'single-month') {
            setShareTitle(formatDate(start, 'MMMM yyyy'));
            setCurrentDate(start);
          } else if (data.config.shareScope === 'date-range') {
            setShareTitle(`${formatDate(start, 'yyyy/MM/dd')} - ${formatDate(end, 'yyyy/MM/dd')}`);
            // Set current date to start of range for month view
            setCurrentDate(start);
          } else {
            setShareTitle('所有事件');
            setCurrentDate(new Date());
          }
        }
      } catch (err) {
        console.error('Error loading share:', err);
        setError('載入分享時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [shareId]);

  // Generate month cells for the current month
  const monthCells = useMemo((): CalendarCell[] => {
    // Ensure currentDate is valid
    const validDate = currentDate && !isNaN(currentDate.getTime()) ? currentDate : new Date();
    
    try {
      const days = getCalendarDays(validDate);
      
      return days.map(date => {
        // getCalendarDays returns Date[], so date should already be a Date object
        // But let's validate it anyway
        if (!(date instanceof Date) || isNaN(date.getTime())) {
          // Skip invalid dates
          return null;
        }
        
        const dayEvents = events.filter(event => {
          // Ensure event.start is a valid Date
          let eventStart: Date;
          if (event.start instanceof Date) {
            eventStart = event.start;
          } else if (typeof event.start === 'string') {
            eventStart = new Date(event.start);
          } else {
            return false;
          }
          
          if (isNaN(eventStart.getTime())) return false;
          
          return (
            eventStart.getFullYear() === date.getFullYear() &&
            eventStart.getMonth() === date.getMonth() &&
            eventStart.getDate() === date.getDate()
          );
        });
        
        return {
          date,
          isCurrentMonth: date.getMonth() === validDate.getMonth() && date.getFullYear() === validDate.getFullYear(),
          isToday: date.toDateString() === new Date().toDateString(),
          isSelected: false,
          events: dayEvents,
        };
      }).filter((cell): cell is CalendarCell => cell !== null);
    } catch (error) {
      console.error('Error generating month cells:', error);
      return [];
    }
  }, [currentDate, events]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.125rem',
        color: 'var(--text-secondary)',
      }}>
        載入中...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
      }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>⚠️</div>
        <div style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>{error}</div>
      </div>
    );
  }

  // Empty categories array since we don't have category data in share view
  const emptyCategories: Category[] = [];

  return (
    <div className="share-page-container">
      <div className="share-page-content">
        {/* Header */}
        <div className="share-page-header">
          <h1 className="share-page-title">
            {shareTitle || '分享的月曆'}
          </h1>
          <p className="share-page-description">
            這是一個只讀的月曆分享
          </p>
        </div>

        {/* Navigation */}
        <div className="share-page-navigation">
          <div className="share-page-nav-controls">
            <button
              onClick={() => handleNavigate('prev')}
              className="share-page-nav-button"
            >
              上個月
            </button>
            <h2 className="share-page-month-title">
              {currentDate && !isNaN(currentDate.getTime()) 
                ? formatDate(currentDate, 'MMMM yyyy')
                : formatDate(new Date(), 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => handleNavigate('next')}
              className="share-page-nav-button"
            >
              下個月
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <MonthView
          cells={monthCells}
          onDateSelect={() => {}}
          onEventClick={() => {}}
          showBaseLayer={true}
          categories={emptyCategories}
        />
      </div>
    </div>
  );
}

