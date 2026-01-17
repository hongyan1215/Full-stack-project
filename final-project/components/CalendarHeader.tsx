'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CalendarView, WeekDay } from '../types/calendar';
import { formatDate, getWeekdayNames } from '../utils/dateUtils';
import clsx from 'clsx';
import LoginButton from './LoginButton';
import ThemePicker from './ThemePicker';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onNavigate: (direction: 'prev' | 'next') => void;
  onViewChange: (view: CalendarView) => void;
  onHeaderHeightChange?: (height: number) => void;
  weekDays?: WeekDay[];
  timeSlots?: any[];
  onShareClick?: () => void;
  onShowOnboarding?: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onNavigate,
  onViewChange,
  onHeaderHeightChange,
  weekDays,
  timeSlots,
  onShareClick,
  onShowOnboarding,
}) => {
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [mainHeaderHeight, setMainHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const viewHeaderRef = useRef<HTMLDivElement>(null);

  // Measure main header height for positioning view header
  useEffect(() => {
    const measureMainHeader = () => {
      if (headerRef.current) {
        // offsetHeight includes padding and border
        setMainHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    
    // Measure after initial render and after a delay for styles to apply
    const timer1 = setTimeout(measureMainHeader, 50);
    const timer2 = setTimeout(measureMainHeader, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [view]);

  // Measure and report total header height on mount and when view changes
  useEffect(() => {
    if (onHeaderHeightChange) {
      const measureHeight = () => {
        let totalHeight = headerRef.current?.offsetHeight || 0;
        if ((view === 'week' || view === 'day') && viewHeaderRef.current) {
          totalHeight += viewHeaderRef.current.offsetHeight;
        }
        onHeaderHeightChange(totalHeight);
      };
      
      // Measure after render
      measureHeight();
      // Also measure after a short delay to catch any layout changes
      const timer = setTimeout(measureHeight, 100);
      return () => clearTimeout(timer);
    }
  }, [view, onHeaderHeightChange, mainHeaderHeight]);

  const getTitle = () => {
    return formatDate(currentDate, 'MMMM yyyy');
  };

  return (
    <>
      {/* Always sticky header container */}
      <div ref={headerRef} className="calendar-header-wrapper always-sticky">
        {/* Top Bar: Title, Nav, View, Theme, Auth */}
        <div className="calendar-top-bar">
          <div className="header-left">
            <h1 className="calendar-title">{getTitle()}</h1>
            <div className="calendar-nav">
              <button
                className="nav-button"
                onClick={() => onNavigate('prev')}
                title="Previous"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button
                className="nav-button"
                onClick={() => onNavigate('next')}
                title="Next"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="header-center">
            <div className="view-toggle">
              <button
                className={clsx('view-button', { active: view === 'month' })}
                onClick={() => onViewChange('month')}
              >
                Month
              </button>
              <button
                className={clsx('view-button', { active: view === 'week' })}
                onClick={() => onViewChange('week')}
              >
                Week
              </button>
              <button
                className={clsx('view-button', { active: view === 'day' })}
                onClick={() => onViewChange('day')}
              >
                Day
              </button>
            </div>
          </div>

          <div className="header-right">
            {onShowOnboarding && (
              <button
                className="theme-toggle-btn"
                onClick={onShowOnboarding}
                title="重看教學"
                style={{ marginRight: '0.5rem' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </button>
            )}
            {onShareClick && (
              <button
                className="theme-toggle-btn"
                onClick={onShareClick}
                title="分享月曆"
                style={{ marginRight: '0.5rem' }}
                data-onboarding="share-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
              </button>
            )}
            <button
              className="theme-toggle-btn"
              onClick={() => setIsThemePickerOpen(true)}
              title="切換主題"
              data-onboarding="theme-toggle"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
              </svg>
            </button>
            <div className="auth-controls">
              <LoginButton />
            </div>
          </div>
        </div>

      </div>

      {/* View header for week/day views - also always sticky, positioned below main header */}
      {(view === 'week' || view === 'day') && (
        <div 
          ref={viewHeaderRef} 
          className="view-header always-sticky"
          style={{ top: mainHeaderHeight }}
        >
          {view === 'week' && weekDays && (
            <div className="sticky-week-header">
              <div className="sticky-week-header-cell">Time</div>
              {weekDays.map((day, index) => {
                const weekdayNames = getWeekdayNames();
                return (
                  <div key={index} className="sticky-week-header-cell">
                    <div>{weekdayNames[day.date.getDay()]}</div>
                    <div className="sticky-weekday-date">
                      {formatDate(day.date, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {view === 'day' && timeSlots && timeSlots.length > 0 && (
            <div className="sticky-day-header">
              <div className="sticky-day-header-cell">Time</div>
              <div className="sticky-day-header-cell">
                {formatDate(timeSlots[0]?.startDate || new Date(), 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 主題選擇器 Modal */}
      <ThemePicker 
        isOpen={isThemePickerOpen} 
        onClose={() => setIsThemePickerOpen(false)} 
      />
    </>
  );
};

export default CalendarHeader;
