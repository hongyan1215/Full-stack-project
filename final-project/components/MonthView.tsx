'use client';

import React, { useState } from 'react';
import { CalendarCell, Category, MOOD_CONFIG } from '../types/calendar';
import { formatDate, getWeekdayNames } from '../utils/dateUtils';
import { getEventColor } from '../utils/categoryUtils';
import clsx from 'clsx';

interface MonthViewProps {
  cells: CalendarCell[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: any) => void;
  showBaseLayer?: boolean;
  categories?: Category[];
  onDiaryClick?: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  cells,
  onDateSelect,
  onEventClick,
  showBaseLayer = true,
  categories = [],
  onDiaryClick,
}) => {
  const weekdayNames = getWeekdayNames();
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  const handleToggleExpand = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发日期选择
    const dateKey = formatDate(date, 'yyyy-MM-dd');
    setExpandedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  return (
    <div className="month-view">
      <div className="weekdays">
        {weekdayNames.map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="days-grid">
        {cells.map((cell, index) => (
          <div
            key={index}
            className={clsx('day-cell', {
              'other-month': !cell.isCurrentMonth,
              'today': cell.isToday,
              'selected': cell.isSelected,
            })}
            onClick={() => onDateSelect(cell.date)}
          >
            <div className="day-number">
              {formatDate(cell.date, 'd')}
              {cell.diaryEntry?.mood && (
                <span 
                  className="mood-indicator"
                  title={`${MOOD_CONFIG[cell.diaryEntry.mood].label} - 點擊查看日記`}
                  style={{ color: MOOD_CONFIG[cell.diaryEntry.mood].color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDiaryClick?.(cell.date);
                  }}
                >
                  {MOOD_CONFIG[cell.diaryEntry.mood].emoji}
                </span>
              )}
              {onDiaryClick && (
                <button
                  className="diary-add-button"
                  title={cell.diaryEntry ? "編輯日記" : "寫日記"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDiaryClick(cell.date);
                  }}
                  style={{ 
                    display: cell.diaryEntry ? 'none' : 'flex',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                  </svg>
                </button>
              )}
            </div>
            <div className="day-events">
              {(() => {
                const dateKey = formatDate(cell.date, 'yyyy-MM-dd');
                const isExpanded = expandedCells.has(dateKey);
                const eventsToShow = isExpanded ? cell.events : cell.events.slice(0, 3);
                
                return (
                  <>
                    {eventsToShow.map((event) => {
                      const isBaseLayer = event.eventType === 'schedule';
                      const isTopLayer = event.eventType === 'event';
                      const eventColor = getEventColor(event, categories);
                      return (
                        <div
                          key={event.id}
                          className={clsx('event-item', {
                            'event-base-layer': isBaseLayer,
                            'event-top-layer': isTopLayer,
                            'base-layer-hidden': isBaseLayer && !showBaseLayer,
                            'all-day': event.allDay,
                          })}
                          style={{ 
                            backgroundColor: isBaseLayer ? 'transparent' : undefined,
                            color: isBaseLayer ? eventColor : 'var(--text-primary)',
                            borderColor: isBaseLayer ? eventColor : undefined,
                            '--base-layer-color': isBaseLayer ? eventColor : undefined,
                          } as React.CSSProperties}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          title={event.title}
                        >
                          {event.icon && <span style={{ marginRight: '4px' }}>{event.icon}</span>}
                          {event.title}
                        </div>
                      );
                    })}
                    {cell.events.length > 3 && (
                      <div 
                        className="event-item event-top-layer event-more-toggle"
                        onClick={(e) => handleToggleExpand(cell.date, e)}
                        title={isExpanded ? "收起" : "展开查看更多事件"}
                      >
                        {isExpanded ? '收起' : `+${cell.events.length - 3} more`}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;

