'use client';

import React from 'react';
import { WeekDay, TimeSlot, Category } from '../types/calendar';
import { formatDate, getEventsForTimeSlot, getTimeSlotHeight } from '../utils/dateUtils';
import { getEventColor } from '../utils/categoryUtils';
import clsx from 'clsx';

interface WeekTimeSlotViewProps {
  days: WeekDay[];
  timeSlots: TimeSlot[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: any) => void;
  onTimeSlotClick: (timeSlot: TimeSlot, day: WeekDay) => void;
  showBaseLayer?: boolean;
  categories?: Category[];
}

const WeekTimeSlotView: React.FC<WeekTimeSlotViewProps> = ({
  days,
  timeSlots,
  onDateSelect,
  onEventClick,
  onTimeSlotClick,
  showBaseLayer = true,
  categories = [],
}) => {
  // Helper to get all-day events for a specific day
  const getAllDayEvents = (day: WeekDay) => {
    return day.events.filter(event => event.allDay);
  };

  return (
    <div className="week-view">
      {/* All Day Row */}
      <div className="week-all-day-row" style={{ 
        display: 'grid', 
        gridTemplateColumns: '60px repeat(7, 1fr)', 
        gap: '4px',
        marginBottom: '4px'
      }}>
        <div className="time-slot all-day-label" style={{ 
          fontSize: '0.7rem', 
          color: 'var(--text-secondary)',
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center'
        }}>
          All Day
        </div>
        {days.map((day, index) => {
          const allDayEvents = getAllDayEvents(day);
          return (
            <div key={`allday-${index}`} className="week-day-cell all-day-cell" style={{ minHeight: 'auto', padding: '4px' }}>
              {allDayEvents.map(event => {
                const isBaseLayer = event.eventType === 'schedule';
                const isTopLayer = event.eventType === 'event';
                const eventColor = getEventColor(event, categories);
                return (
                  <div
                    key={event.id}
                    className={clsx('event-item', 'all-day', {
                      'event-base-layer': isBaseLayer,
                      'event-top-layer': isTopLayer,
                      'base-layer-hidden': isBaseLayer && !showBaseLayer,
                    })}
                      style={{ 
                        backgroundColor: isBaseLayer ? 'transparent' : undefined,
                        color: isBaseLayer ? eventColor : 'var(--text-primary)',
                        borderColor: isBaseLayer ? eventColor : undefined,
                        '--base-layer-color': isBaseLayer ? eventColor : undefined,
                        marginBottom: '2px',
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
            </div>
          );
        })}
      </div>

      <div className="week-grid">
        {timeSlots.map((timeSlot, timeIndex) => (
          <React.Fragment key={timeIndex}>
            <div className="time-slot">
              <div className="time-label">
                {formatDate(timeSlot.startDate, 'h:mm a')}
              </div>
              <div className="period-name">
                {timeSlot.period.name}
              </div>
            </div>
            {days.map((day, dayIndex) => {
              const dayTimeSlot = {
                ...timeSlot,
                startDate: new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 
                  timeSlot.startDate.getHours(), timeSlot.startDate.getMinutes()),
                endDate: new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 
                  timeSlot.endDate.getHours(), timeSlot.endDate.getMinutes()),
              };
              // Filter out all-day events from time slots
              const dayEvents = getEventsForTimeSlot(day.events, dayTimeSlot).filter(e => !e.allDay);
              
              return (
                <div
                  key={`${timeIndex}-${dayIndex}`}
                  className={clsx('week-day-cell', {
                    'today': day.isToday,
                    'selected': day.isSelected,
                    'break-period': timeSlot.period.isBreak,
                    'clickable': !timeSlot.period.isBreak,
                  })}
                  style={{ 
                    minHeight: `${getTimeSlotHeight(timeSlot)}px`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!timeSlot.period.isBreak) {
                      onTimeSlotClick(timeSlot, day);
                    } else {
                      onDateSelect(day.date);
                    }
                  }}
                >
                  {!timeSlot.period.isBreak && dayEvents.map((event) => {
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
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeekTimeSlotView;

