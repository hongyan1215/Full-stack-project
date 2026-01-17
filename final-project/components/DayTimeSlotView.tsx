'use client';

import React from 'react';
import { TimeSlot, Category } from '../types/calendar';
import { formatDate, getTimeSlotHeight } from '../utils/dateUtils';
import { getEventColor } from '../utils/categoryUtils';
import clsx from 'clsx';
// Header is now handled by CalendarHeader sticky-view-header

interface DayTimeSlotViewProps {
  timeSlots: TimeSlot[];
  onEventClick: (event: any) => void;
  onTimeSlotClick: (timeSlot: TimeSlot) => void;
  showBaseLayer?: boolean;
  categories?: Category[];
}

const DayTimeSlotView: React.FC<DayTimeSlotViewProps> = ({ timeSlots, onEventClick, onTimeSlotClick, showBaseLayer = true, categories = [] }) => {
  // Extract all-day events from the time slots (they should be present in all slots they overlap with)
  // We use a Map to deduplicate by ID
  const allDayEventsMap = new Map();
  timeSlots.forEach(slot => {
    slot.events.forEach(event => {
      if (event.allDay) {
        allDayEventsMap.set(event.id, event);
      }
    });
  });
  const allDayEvents = Array.from(allDayEventsMap.values());

  return (
    <div className="day-view">
      {/* All Day Row */}
      <div className="day-all-day-row" style={{ 
        display: 'grid', 
        gridTemplateColumns: '60px 1fr', 
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
        <div className="day-time-slot-cell all-day-cell" style={{ minHeight: 'auto', padding: '4px' }}>
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
      </div>

      <div className="day-grid">
        {timeSlots.map((timeSlot, index) => (
          <React.Fragment key={index}>
            <div className="time-slot">
              <div className="time-label">
                {formatDate(timeSlot.startDate, 'h:mm a')}
              </div>
              <div className="period-name">
                {timeSlot.period.name}
              </div>
            </div>
            <div 
              className={clsx('day-time-slot-cell', {
                'break-period': timeSlot.period.isBreak,
                'clickable': !timeSlot.period.isBreak,
              })}
              style={{ 
                minHeight: `${getTimeSlotHeight(timeSlot)}px`,
              }}
              onClick={() => !timeSlot.period.isBreak && onTimeSlotClick(timeSlot)}
            >
              {!timeSlot.period.isBreak && timeSlot.events.filter(e => !e.allDay).map((event) => {
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
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DayTimeSlotView;

