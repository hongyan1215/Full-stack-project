'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TimeGrid, TimeSlot, Schedule, ScheduleTemplateEvent, ShortcutBinding } from '../types/calendar';
import { useTracking } from '../hooks/usePostHog';
import { getTimeSlots, formatDate } from '../utils/dateUtils';
import clsx from 'clsx';

interface ScheduleEditorProps {
  schedule: Schedule;
  timeGrid: TimeGrid;
  allTimeGrids: TimeGrid[];
  onSave: (templateEvents: ScheduleTemplateEvent[], shortcutBindings?: ShortcutBinding[]) => void;
  onClose: () => void;
  onTimeGridChange?: (timeGridId: string) => void;
}

interface PopoverState {
  isOpen: boolean;
  event: ScheduleTemplateEvent | null;
  position: { x: number; y: number };
  isNew: boolean;
  dayIndex: number;
  periodId: string;
}

// ShortcutBinding is now imported from types/calendar.ts

interface SelectedCell {
  dayIndex: number;
  periodId: string;
  timeSlot: TimeSlot;
}

// Default color palette - 10 colors that suit the theme
const defaultColors = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedule,
  timeGrid,
  allTimeGrids,
  onSave,
  onClose,
  onTimeGridChange,
}) => {
  const { track } = useTracking();
  const [showWeekends, setShowWeekends] = useState(false);
  const [showBreakPeriods, setShowBreakPeriods] = useState(true);
  const initialTemplateEvents = useRef<ScheduleTemplateEvent[]>(
    JSON.parse(JSON.stringify(schedule.templateEvents || []))
  );
  const [templateEvents, setTemplateEvents] = useState<ScheduleTemplateEvent[]>(
    schedule.templateEvents || []
  );
  const [gridHeight, setGridHeight] = useState(600);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Sync templateEvents when schedule prop changes (e.g., after time grid migration)
  // Use a ref to track the previous schedule to detect changes
  const prevScheduleRef = useRef<{ id: string; timeGridId: string; templateEventsLength: number } | null>(null);
  
  useEffect(() => {
    const current = {
      id: schedule.id,
      timeGridId: schedule.timeGridId,
      templateEventsLength: (schedule.templateEvents || []).length
    };
    
    const prev = prevScheduleRef.current;
    
    // Check if schedule changed (ID, timeGridId, or templateEvents length)
    if (!prev || 
        prev.id !== current.id || 
        prev.timeGridId !== current.timeGridId || 
        prev.templateEventsLength !== current.templateEventsLength) {
      const newTemplateEvents = schedule.templateEvents || [];
      setTemplateEvents(newTemplateEvents);
      // Also update the initial reference to prevent false "unsaved changes" warnings
      initialTemplateEvents.current = JSON.parse(JSON.stringify(newTemplateEvents));
      prevScheduleRef.current = current;
    }
  }, [schedule.id, schedule.timeGridId, schedule.templateEvents]);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<SelectedCell | null>(null);
  // Initialize shortcuts from schedule or create defaults
  const [shortcutBindings, setShortcutBindings] = useState<ShortcutBinding[]>(() => {
    if (schedule.shortcutBindings && schedule.shortcutBindings.length > 0) {
      // Use shortcuts from schedule, ensuring we have exactly 8
      return Array.from({ length: 8 }, (_, i) => {
        const existing = schedule.shortcutBindings!.find(s => s.key === `${i + 1}`);
        return existing || {
          id: `shortcut-${i + 1}`,
          key: `${i + 1}`,
          title: '',
          color: defaultColors[i % defaultColors.length],
          location: '',
          notes: '',
        };
      });
    }
    // Default shortcuts
    return Array.from({ length: 8 }, (_, i) => ({
      id: `shortcut-${i + 1}`,
      key: `${i + 1}`,
      title: '',
      color: defaultColors[i % defaultColors.length],
      location: '',
      notes: '',
    }));
  });
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [popover, setPopover] = useState<PopoverState>({
    isOpen: false,
    event: null,
    position: { x: 0, y: 0 },
    isNew: true,
    dayIndex: 0,
    periodId: '',
  });

  const [editingTitle, setEditingTitle] = useState('新課程');
  const [editingColor, setEditingColor] = useState(defaultColors[0]);
  const [editingLocation, setEditingLocation] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [draggedShortcut, setDraggedShortcut] = useState<ShortcutBinding | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ dayIndex: number; periodId: string } | null>(null);
  
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowCellRefs = useRef<Record<number, (HTMLDivElement | null)[]>>({});
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const current = JSON.stringify(templateEvents);
    const initial = JSON.stringify(initialTemplateEvents.current);
    return current !== initial;
  }, [templateEvents]);
  
  // Handle close with confirmation
  const handleClose = () => {
    if (hasUnsavedChanges) {
      track('schedule_editor_close_with_unsaved', {
        schedule_id: schedule.id,
        template_events_count: templateEvents.length,
      });
      setShowConfirmDialog(true);
    } else {
      track('schedule_editor_close_no_changes', {
        schedule_id: schedule.id,
      });
      onClose();
    }
  };
  
  // Handle confirm leave
  const handleConfirmLeave = () => {
    track('schedule_editor_leave_confirmed', {
      schedule_id: schedule.id,
      template_events_count: templateEvents.length,
    });
    setShowConfirmDialog(false);
    onClose();
  };
  
  // Handle cancel leave
  const handleCancelLeave = () => {
    track('schedule_editor_leave_cancelled', {
      schedule_id: schedule.id,
    });
    setShowConfirmDialog(false);
  };

  // Generate time slots from the time grid
  const mockDate = new Date();
  const allTimeSlots = useMemo(() => getTimeSlots(mockDate, timeGrid), [timeGrid]);
  
  // Filter out break periods if needed
  const timeSlots = useMemo(() => {
    if (showBreakPeriods) {
      return allTimeSlots;
    }
    return allTimeSlots.filter(slot => !slot.period.isBreak);
  }, [allTimeSlots, showBreakPeriods]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const viewportHeight = window.innerHeight;
      const targetHeight = Math.max(420, Math.min(viewportHeight * 0.55, 720));
      setGridHeight(targetHeight);
    }
  }, []);

  useEffect(() => {
    if (gridContainerRef.current) {
      gridContainerRef.current.style.maxHeight = `${gridHeight + 140}px`;
    }
  }, [gridHeight]);

  // Update shortcuts when schedule prop changes (e.g., after loading from MongoDB)
  useEffect(() => {
    if (schedule.shortcutBindings && schedule.shortcutBindings.length > 0) {
      // Ensure we have exactly 8 shortcuts (1-8)
      const shortcuts = Array.from({ length: 8 }, (_, i) => {
        const existing = schedule.shortcutBindings!.find(s => s.key === `${i + 1}`);
        return existing || {
          id: `shortcut-${i + 1}`,
          key: `${i + 1}`,
          title: '',
          color: defaultColors[i % defaultColors.length],
          location: '',
          notes: '',
        };
      });
      setShortcutBindings(shortcuts);
    }
  }, [schedule.shortcutBindings, schedule.id]);

  // Keyboard shortcut handler and arrow key navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if popover is open
      if (popover.isOpen) {
        return;
      }

      // Handle arrow keys for navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // If Shift is held, extend selection; otherwise, move single selection
        const isExtending = e.shiftKey;
        
        if (selectedCells.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          
          // Use the last selected cell as the anchor for navigation
          const anchorCell = selectedCells[selectedCells.length - 1];
          let newDayIndex = anchorCell.dayIndex;
          let newTimeSlotIndex = timeSlots.findIndex(slot => slot.period.id === anchorCell.periodId);
          
          switch (e.key) {
            case 'ArrowUp':
              // Find previous non-break slot
              for (let i = newTimeSlotIndex - 1; i >= 0; i--) {
                if (!timeSlots[i].period.isBreak) {
                  newTimeSlotIndex = i;
                  break;
                }
              }
              break;
            case 'ArrowDown':
              // Find next non-break slot
              for (let i = newTimeSlotIndex + 1; i < timeSlots.length; i++) {
                if (!timeSlots[i].period.isBreak) {
                  newTimeSlotIndex = i;
                  break;
                }
              }
              break;
            case 'ArrowLeft':
              const minDayIndex = showWeekends ? 0 : 1; // 0 for weekends, 1 for weekdays only
              if (newDayIndex > minDayIndex) {
                newDayIndex--;
              }
              break;
            case 'ArrowRight':
              const maxDayIndex = showWeekends ? 6 : 5; // 0-6 for weekends, 1-5 for weekdays
              if (newDayIndex < maxDayIndex) {
                newDayIndex++;
              }
              break;
          }
          
          const newTimeSlot = timeSlots[newTimeSlotIndex];
          if (newTimeSlot && !newTimeSlot.period.isBreak) {
            const newCell: SelectedCell = {
              dayIndex: newDayIndex,
              periodId: newTimeSlot.period.id,
              timeSlot: newTimeSlot,
            };
            
            if (isExtending) {
              // Extend selection
              const rangeCells = getCellsInRange(anchorCell, newCell);
              setSelectedCells(rangeCells);
            } else {
              // Single selection
              setSelectedCells([newCell]);
            }
          }
        } else {
          // If no cell is selected, select the first available cell
          const firstSlot = timeSlots.find(slot => !slot.period.isBreak);
          if (firstSlot) {
            setSelectedCells([{
              dayIndex: showWeekends ? 0 : 1,
              periodId: firstSlot.period.id,
              timeSlot: firstSlot,
            }]);
          }
        }
        return;
      }

      // Handle Delete key to remove events in selected cells
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCells.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          
          const eventsToDelete = templateEvents.filter(ev => 
            selectedCells.some(cell => 
              ev.dayIndex === cell.dayIndex && ev.periodId === cell.periodId
            )
          );
          
          track('schedule_events_deleted_keyboard', {
            schedule_id: schedule.id,
            events_deleted: eventsToDelete.length,
            cells_selected: selectedCells.length,
            key: e.key,
          });
          
          // Remove all events in selected cells
          setTemplateEvents(prev => 
            prev.filter(ev => 
              !selectedCells.some(cell => 
                ev.dayIndex === cell.dayIndex && ev.periodId === cell.periodId
              )
            )
          );
        }
        return;
      }

      // Don't trigger if modifier keys are pressed (to avoid browser shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }

      // Only trigger for number keys 1-8
      if (!e.key.match(/^[1-8]$/)) {
        return;
      }

      // Check if cells are selected and a shortcut is pressed
      if (selectedCells.length > 0 && shortcutBindings.length > 0) {
        const binding = shortcutBindings.find(b => b.key === e.key);
        if (binding && binding.title) { // Only create if shortcut has a title
          e.preventDefault();
          e.stopPropagation();
          
          // Create events in all selected cells that don't already have events
          const newEvents: ScheduleTemplateEvent[] = [];
          selectedCells.forEach(cell => {
            const hasExistingEvents = templateEvents.some(
              ev => ev.dayIndex === cell.dayIndex && ev.periodId === cell.periodId
            );
            
            if (!hasExistingEvents) {
              newEvents.push({
                id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cell.dayIndex}-${cell.periodId}`,
                dayIndex: cell.dayIndex,
                periodId: cell.periodId,
                title: binding.title,
                color: binding.color,
                location: binding.location,
                notes: binding.notes,
                shortcutKey: binding.key, // Track which shortcut created this event
              });
            }
          });
          
          if (newEvents.length > 0) {
            track('schedule_shortcut_used', {
              schedule_id: schedule.id,
              shortcut_key: e.key,
              shortcut_title: binding.title,
              events_created: newEvents.length,
              cells_selected: selectedCells.length,
            });
            
            setTemplateEvents(prev => [...prev, ...newEvents]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress, true); // Use capture phase
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [selectedCells, shortcutBindings, popover.isOpen, timeSlots, templateEvents, showWeekends, isDragging, dragStartCell]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(prev => ({ ...prev, isOpen: false }));
      }
    };

    if (popover.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popover.isOpen]);

  // Prevent text selection during drag and handle mouse up globally
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartCell(null);
      }
    };

    const handleSelectStart = (e: Event) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('selectstart', handleSelectStart);
      // Prevent text selection globally during drag
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', handleSelectStart);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const days = useMemo(() => {
    const allDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    if (showWeekends) return allDays.map((name, index) => ({ name, index }));
    return allDays.map((name, index) => ({ name, index })).filter(d => d.index !== 0 && d.index !== 6);
  }, [showWeekends]);

  const totalMinutes = useMemo(() => {
    return timeSlots.reduce((sum, slot) => {
      const minutes = Math.max(5, (slot.endDate.getTime() - slot.startDate.getTime()) / 60000);
      return sum + minutes;
    }, 0);
  }, [timeSlots]);

  const rowHeights = useMemo(() => {
    const safeTotal = totalMinutes || 1;
    return timeSlots.map(slot => {
      const minutes = Math.max(5, (slot.endDate.getTime() - slot.startDate.getTime()) / 60000);
      const proportionalHeight = (minutes / safeTotal) * gridHeight;
      return Math.max(42, proportionalHeight);
    });
  }, [timeSlots, totalMinutes, gridHeight]);

  useEffect(() => {
    rowHeights.forEach((height, index) => {
      const px = `${height || 48}px`;
      const labelEl = labelRefs.current[index];
      if (labelEl) {
        labelEl.style.height = px;
      }
      const cells = rowCellRefs.current[index];
      if (cells) {
        cells.forEach(cell => {
          if (cell) {
            cell.style.height = px;
          }
        });
      }
    });
  }, [rowHeights]);

  // Calculate popover position to ensure it stays within viewport
  const calculatePopoverPosition = (rect: DOMRect) => {
    const popoverWidth = 320; // Approximate width of popover
    const popoverHeight = 450; // Approximate height of popover (including all content)
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = rect.right + padding;
    let y = rect.top;

    // Check if popover would exceed right edge
    if (x + popoverWidth > viewportWidth - padding) {
      // Try to show on the left side
      const leftX = rect.left - popoverWidth - padding;
      if (leftX >= padding) {
        x = leftX;
      } else {
        // If left side doesn't fit, align to right edge with padding
        x = Math.max(padding, viewportWidth - popoverWidth - padding);
      }
    }

    // Check if popover would exceed bottom edge
    if (y + popoverHeight > viewportHeight - padding) {
      // Show above the element
      const topY = rect.top - popoverHeight;
      if (topY >= padding) {
        y = topY;
      } else {
        // If top doesn't fit, align to bottom edge with padding
        y = Math.max(padding, viewportHeight - popoverHeight - padding);
      }
    }

    // Ensure popover doesn't go above viewport
    if (y < padding) {
      y = padding;
    }

    // Ensure popover doesn't go left of viewport
    if (x < padding) {
      x = padding;
    }

    return { x, y };
  };

  // Adjust popover position after it's rendered to use actual dimensions
  useEffect(() => {
    if (popover.isOpen && popoverRef.current) {
      const popoverEl = popoverRef.current;
      const rect = popoverEl.getBoundingClientRect();
      const padding = 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let needsAdjustment = false;
      let newX = popover.position.x;
      let newY = popover.position.y;

      // Check right edge
      if (rect.right > viewportWidth - padding) {
        newX = Math.max(padding, viewportWidth - rect.width - padding);
        needsAdjustment = true;
      }

      // Check bottom edge
      if (rect.bottom > viewportHeight - padding) {
        newY = Math.max(padding, viewportHeight - rect.height - padding);
        needsAdjustment = true;
      }

      // Check left edge
      if (rect.left < padding) {
        newX = padding;
        needsAdjustment = true;
      }

      // Check top edge
      if (rect.top < padding) {
        newY = padding;
        needsAdjustment = true;
      }

      if (needsAdjustment) {
        setPopover(prev => ({
          ...prev,
          position: { x: newX, y: newY },
        }));
      }
    }
  }, [popover.isOpen, popover.position.x, popover.position.y]);

  const handleSlotMouseDown = (e: React.MouseEvent, dayIndex: number, timeSlot: TimeSlot) => {
    if (timeSlot.period.isBreak) return;
    
    // Prevent text selection
    e.preventDefault();
    
    // Start drag selection
    const cell: SelectedCell = {
      dayIndex,
      periodId: timeSlot.period.id,
      timeSlot,
    };
    
    // Check if this cell was already selected before this click
    const wasAlreadySelected = selectedCells.some(
      c => c.dayIndex === dayIndex && c.periodId === timeSlot.period.id
    );
    
    // Store whether it was already selected for use in mouseUp
    (cell as any).wasAlreadySelected = wasAlreadySelected;
    
    setDragStartCell(cell);
    setIsDragging(true);
    
    // If not holding Shift/Ctrl/Cmd, start fresh selection
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      setSelectedCells([cell]);
    } else if (e.shiftKey || e.ctrlKey || e.metaKey) {
      // Add to selection
      setSelectedCells(prev => {
        const exists = prev.some(c => c.dayIndex === dayIndex && c.periodId === timeSlot.period.id);
        if (exists) {
          // Remove if already selected
          return prev.filter(c => !(c.dayIndex === dayIndex && c.periodId === timeSlot.period.id));
        } else {
          // Add to selection
          return [...prev, cell];
        }
      });
    }
  };

  const handleSlotMouseEnter = (e: React.MouseEvent, dayIndex: number, timeSlot: TimeSlot) => {
    if (timeSlot.period.isBreak || !isDragging || !dragStartCell) return;
    
    // Prevent text selection during drag
    e.preventDefault();
    
    // Calculate range between drag start and current cell
    const cells = getCellsInRange(dragStartCell, { dayIndex, periodId: timeSlot.period.id, timeSlot });
    setSelectedCells(cells);
  };

  const handleSlotMouseUp = (e: React.MouseEvent, dayIndex: number, timeSlot: TimeSlot) => {
    if (timeSlot.period.isBreak) return;
    
    setIsDragging(false);
    
    // If it was a simple click (not a drag), handle single cell selection/editing
    if (dragStartCell && 
        dragStartCell.dayIndex === dayIndex && 
        dragStartCell.periodId === timeSlot.period.id &&
        selectedCells.length === 1) {
      
      // Only open popover if the cell was already selected before this click
      // First click: just select, second click: open popover
      const wasAlreadySelected = (dragStartCell as any).wasAlreadySelected;
      
      if (wasAlreadySelected) {
        // Second click on already selected cell - open popover for editing
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const position = calculatePopoverPosition(rect);

        // Check if there's an existing event in this cell
        const existingEvent = templateEvents.find(
          ev => ev.dayIndex === dayIndex && ev.periodId === timeSlot.period.id
        );

        if (existingEvent) {
          // Edit existing event
          track('schedule_cell_edit_opened', {
            schedule_id: schedule.id,
            day_index: dayIndex,
            period_id: timeSlot.period.id,
            event_title: existingEvent.title,
            has_location: !!existingEvent.location,
            has_notes: !!existingEvent.notes,
          });
          
          setEditingTitle(existingEvent.title);
          setEditingColor(existingEvent.color);
          setEditingLocation(existingEvent.location || '');
          setEditingNotes(existingEvent.notes || '');
          setPopover({
            isOpen: true,
            event: existingEvent,
            position,
            isNew: false,
            dayIndex,
            periodId: timeSlot.period.id,
          });
        } else {
          // Create new event
          track('schedule_cell_create_opened', {
            schedule_id: schedule.id,
            day_index: dayIndex,
            period_id: timeSlot.period.id,
            time: `${timeSlot.period.startTime}-${timeSlot.period.endTime}`,
          });
          
          setEditingTitle('新課程');
          setEditingColor(defaultColors[0]);
          setEditingLocation('');
          setEditingNotes('');
          setPopover({
            isOpen: true,
            event: null,
            position,
            isNew: true,
            dayIndex,
            periodId: timeSlot.period.id,
          });
        }
      }
      // If wasAlreadySelected is false, this was the first click - just select, don't open popover
    }
    
    setDragStartCell(null);
  };

  // Helper function to get all cells in a range
  const getCellsInRange = (start: SelectedCell, end: SelectedCell): SelectedCell[] => {
    const cells: SelectedCell[] = [];
    
    const startDayIndex = Math.min(start.dayIndex, end.dayIndex);
    const endDayIndex = Math.max(start.dayIndex, end.dayIndex);
    
    const startTimeIndex = timeSlots.findIndex(slot => slot.period.id === start.periodId);
    const endTimeIndex = timeSlots.findIndex(slot => slot.period.id === end.periodId);
    const minTimeIndex = Math.min(startTimeIndex, endTimeIndex);
    const maxTimeIndex = Math.max(startTimeIndex, endTimeIndex);
    
    for (let dayIndex = startDayIndex; dayIndex <= endDayIndex; dayIndex++) {
      for (let timeIndex = minTimeIndex; timeIndex <= maxTimeIndex; timeIndex++) {
        const slot = timeSlots[timeIndex];
        if (slot && !slot.period.isBreak) {
          cells.push({
            dayIndex,
            periodId: slot.period.id,
            timeSlot: slot,
          });
        }
      }
    }
    
    return cells;
  };

  const handleEventClick = (e: React.MouseEvent, event: ScheduleTemplateEvent) => {
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = calculatePopoverPosition(rect);

    // If the event color is not in default colors, use the first default color
    const eventColor = defaultColors.includes(event.color) 
      ? event.color 
      : defaultColors[0];

    setEditingTitle(event.title);
    setEditingColor(eventColor);
    setEditingLocation(event.location || '');
    setEditingNotes(event.notes || '');
    setPopover({
      isOpen: true,
      event,
      position,
      isNew: false,
      dayIndex: event.dayIndex,
      periodId: event.periodId,
    });
  };

  const handlePopoverSave = () => {
    // Check if editing shortcut (dayIndex === -1)
    if (popover.dayIndex === -1) {
      // Update shortcut binding and related template events
      setShortcutBindings(prev => {
        // Find the shortcut being updated to get its key
        const shortcutToUpdate = prev.find(b => b.id === popover.periodId);
        const shortcutKey = shortcutToUpdate?.key;
        
        const updatedBindings = prev.map(binding =>
          binding.id === popover.periodId
            ? {
                ...binding,
                title: editingTitle || '',
                color: editingColor,
                location: editingLocation,
                notes: editingNotes,
              }
            : binding
        );
        
        // Update all template events that were created from this shortcut
        if (shortcutKey) {
          setTemplateEvents(prevEvents =>
            prevEvents.map(event =>
              event.shortcutKey === shortcutKey
                ? {
                    ...event,
                    title: editingTitle || event.title,
                    color: editingColor,
                    location: editingLocation,
                    notes: editingNotes,
                  }
                : event
            )
          );
        }
        
        return updatedBindings;
      });
      setEditingShortcutId(null);
    } else if (popover.isNew) {
      // Create events in all selected cells, or just the popover cell if no selection
      const cellsToCreate = selectedCells.length > 0 ? selectedCells : [{
        dayIndex: popover.dayIndex,
        periodId: popover.periodId,
        timeSlot: timeSlots.find(slot => slot.period.id === popover.periodId)!,
      }];
      
      const newEvents: ScheduleTemplateEvent[] = [];
      cellsToCreate.forEach(cell => {
        // Check if cell already has events
        const hasExistingEvents = templateEvents.some(
          ev => ev.dayIndex === cell.dayIndex && ev.periodId === cell.periodId
        );
        
        if (!hasExistingEvents) {
          newEvents.push({
            id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cell.dayIndex}-${cell.periodId}`,
            dayIndex: cell.dayIndex,
            periodId: cell.periodId,
            title: editingTitle || '新課程',
            color: editingColor,
            location: editingLocation,
            notes: editingNotes,
          });
        }
      });
      
      if (newEvents.length > 0) {
        track('schedule_event_created', {
          schedule_id: schedule.id,
          events_count: newEvents.length,
          cells_selected: selectedCells.length,
          has_location: !!editingLocation,
          has_notes: !!editingNotes,
          title: editingTitle || '新課程',
        });
        setTemplateEvents([...templateEvents, ...newEvents]);
      }
    } else if (popover.event) {
      const oldEvent = popover.event;
      const changedFields = [];
      if (oldEvent.title !== editingTitle) changedFields.push('title');
      if (oldEvent.color !== editingColor) changedFields.push('color');
      if (oldEvent.location !== editingLocation) changedFields.push('location');
      if (oldEvent.notes !== editingNotes) changedFields.push('notes');
      
      track('schedule_event_updated', {
        schedule_id: schedule.id,
        event_id: oldEvent.id,
        changed_fields: changedFields,
        old_title: oldEvent.title,
        new_title: editingTitle,
      });
      
      setTemplateEvents(templateEvents.map(ev => 
        ev.id === popover.event!.id 
          ? { ...ev, title: editingTitle, color: editingColor, location: editingLocation, notes: editingNotes }
          : ev
      ));
    }

    setPopover(prev => ({ ...prev, isOpen: false }));
  };

  const handlePopoverDelete = () => {
    if (popover.event) {
      track('schedule_event_deleted', {
        schedule_id: schedule.id,
        event_id: popover.event.id,
        event_title: popover.event.title,
        day_index: popover.event.dayIndex,
        period_id: popover.event.periodId,
      });
      
      setTemplateEvents(templateEvents.filter(ev => ev.id !== popover.event!.id));
    }
    setPopover(prev => ({ ...prev, isOpen: false }));
  };

  const handleSave = () => {
    track('schedule_editor_save_button_clicked', {
      schedule_id: schedule.id,
      template_events_count: templateEvents.length,
      shortcuts_count: shortcutBindings.filter(s => s.title).length,
      has_unsaved_changes: hasUnsavedChanges,
    });
    
    // Save both template events and shortcut bindings
    onSave(templateEvents, shortcutBindings);
    // Update initial state after saving
    initialTemplateEvents.current = JSON.parse(JSON.stringify(templateEvents));
  };

  // Drag and drop handlers for shortcuts
  const handleShortcutDragStart = (e: React.DragEvent, binding: ShortcutBinding) => {
    if (!binding.title) {
      e.preventDefault();
      return;
    }
    
    track('schedule_shortcut_drag_started', {
      schedule_id: schedule.id,
      shortcut_key: binding.key,
      shortcut_title: binding.title,
    });
    
    setDraggedShortcut(binding);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', binding.id);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleShortcutDragEnd = (e: React.DragEvent) => {
    setDraggedShortcut(null);
    setDragOverCell(null);
    // Restore visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleCellDragOver = (e: React.DragEvent, dayIndex: number, periodId: string) => {
    if (!draggedShortcut) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverCell({ dayIndex, periodId });
  };

  const handleCellDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the cell itself, not entering a child element
    const target = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !target.contains(relatedTarget)) {
      setDragOverCell(null);
    }
  };

  const handleCellDrop = (e: React.DragEvent, dayIndex: number, periodId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedShortcut || !draggedShortcut.title) {
      setDragOverCell(null);
      return;
    }

    // If there are selected cells, create events in all of them
    // Otherwise, just create in the dropped cell
    const cellsToCreate = selectedCells.length > 0 ? selectedCells : [{
      dayIndex,
      periodId,
      timeSlot: timeSlots.find(slot => slot.period.id === periodId)!,
    }];

    const newEvents: ScheduleTemplateEvent[] = [];
    cellsToCreate.forEach(cell => {
      // Check if the cell already has events
      const hasExistingEvents = templateEvents.some(
        ev => ev.dayIndex === cell.dayIndex && ev.periodId === cell.periodId
      );
      
      if (!hasExistingEvents) {
        newEvents.push({
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cell.dayIndex}-${cell.periodId}`,
          dayIndex: cell.dayIndex,
          periodId: cell.periodId,
          title: draggedShortcut.title,
          color: draggedShortcut.color,
          location: draggedShortcut.location,
          notes: draggedShortcut.notes,
          shortcutKey: draggedShortcut.key,
        });
      }
    });
    
    if (newEvents.length > 0) {
      track('schedule_shortcut_dropped', {
        schedule_id: schedule.id,
        shortcut_key: draggedShortcut.key,
        shortcut_title: draggedShortcut.title,
        events_created: newEvents.length,
        cells_targeted: cellsToCreate.length,
        used_selection: selectedCells.length > 0,
      });
      
      setTemplateEvents(prev => [...prev, ...newEvents]);
    }
    
    setDragOverCell(null);
    setDraggedShortcut(null);
  };


  // Get time display for a period
  const getTimeDisplay = () => {
    if (!popover.periodId) return '';
    const period = timeGrid.periods.find(p => p.id === popover.periodId);
    if (!period) return '';
    const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const dayName = dayNames[popover.dayIndex];
    return `${dayName}  ${period.startTime} - ${period.endTime}`;
  };

  labelRefs.current = [];
  rowCellRefs.current = {};

  const columnClass = showWeekends ? 'with-weekends' : 'weekday-only';

  return (
    <div className="schedule-editor-container">
      <div className="schedule-editor-card">
        <div className="schedule-editor-header">
          <div className="schedule-header-info">
            <h2 className="event-modal-title">
              ✏️ 編輯課表：{schedule.name}
            </h2>
            <div className="schedule-controls slim">
              {/* Time Grid Selector */}
              {onTimeGridChange && (
                <div className="schedule-input">
                  <label className="form-label" htmlFor="schedule-time-grid">時間格</label>
                  <select
                    id="schedule-time-grid"
                    className="form-input"
                    value={timeGrid.id}
                    onChange={(e) => onTimeGridChange(e.target.value)}
                  >
                    {allTimeGrids.map(grid => (
                      <option key={grid.id} value={grid.id}>{grid.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="schedule-options">
                <label className="form-checkbox include-weekends">
                  <input 
                    type="checkbox" 
                    className="checkbox-input"
                    checked={showWeekends} 
                    onChange={e => {
                      track('schedule_weekends_toggled', {
                        schedule_id: schedule.id,
                        show_weekends: e.target.checked,
                      });
                      setShowWeekends(e.target.checked);
                    }} 
                  />
                  顯示週末
                </label>
                <label className="form-checkbox include-weekends">
                  <input 
                    type="checkbox" 
                    className="checkbox-input"
                    checked={showBreakPeriods} 
                    onChange={e => {
                      track('schedule_break_periods_toggled', {
                        schedule_id: schedule.id,
                        show_break_periods: e.target.checked,
                      });
                      setShowBreakPeriods(e.target.checked);
                    }} 
                  />
                  顯示休息時間
                </label>
              </div>
            </div>
          </div>
          <button className="close-button" onClick={handleClose} aria-label="返回">&times;</button>
        </div>

        {/* Shortcut Keys Block */}
        <div className="shortcut-keys-block">
          <div className="shortcut-keys-label">快捷鍵 (1-8):</div>
          <div className="shortcut-keys-grid">
            {shortcutBindings.map((binding) => (
              <button
                key={binding.id}
                className={clsx('shortcut-key-box', {
                  'has-content': binding.title,
                  'editing': editingShortcutId === binding.id,
                  'draggable': binding.title,
                })}
                draggable={!!binding.title}
                onDragStart={(e) => handleShortcutDragStart(e, binding)}
                onDragEnd={handleShortcutDragEnd}
                onClick={(e) => {
                  // Open popover to edit this shortcut
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const popoverWidth = 320;
                  const popoverHeight = 450;
                  const padding = 16;
                  
                  // Calculate position: try to center above the button
                  let x = rect.left + rect.width / 2 - popoverWidth / 2;
                  let y = rect.top - popoverHeight - 10;
                  
                  // Ensure popover stays within viewport
                  if (x < padding) x = padding;
                  if (x + popoverWidth > window.innerWidth - padding) {
                    x = window.innerWidth - popoverWidth - padding;
                  }
                  if (y < padding) {
                    // If above doesn't fit, place below
                    y = rect.bottom + 10;
                  }
                  
                  setEditingShortcutId(binding.id);
                  setEditingTitle(binding.title);
                  setEditingColor(binding.color);
                  setEditingLocation(binding.location || '');
                  setEditingNotes(binding.notes || '');
                  setPopover({
                    isOpen: true,
                    event: null,
                    position: { x, y },
                    isNew: false,
                    dayIndex: -1, // Special value for shortcut editing
                    periodId: binding.id,
                  });
                }}
                data-key={binding.id}
                title={binding.title ? `${binding.key}: ${binding.title}` : `快捷鍵 ${binding.key} (點擊編輯)`}
                style={binding.title ? { backgroundColor: binding.color } : {}}
              >
                <div className="shortcut-key-number">{binding.key}</div>
                {binding.title && (
                  <div className="shortcut-key-title">
                    {binding.title}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="schedule-grid-container" ref={gridContainerRef}>
          <div className={`schedule-header ${columnClass}`}>
            <div className="schedule-header-cell">時間</div>
            {days.map(day => (
              <div key={day.index} className="schedule-header-cell">
                {day.name}
              </div>
            ))}
          </div>
          
          <div className={`schedule-grid ${columnClass}`}>
            {timeSlots.map((timeSlot, timeIndex) => (
              <React.Fragment key={timeIndex}>
                <div
                  className="time-slot-label"
                  ref={el => {
                    labelRefs.current[timeIndex] = el;
                  }}
                >
                  <span className="time-text">{formatDate(timeSlot.startDate, 'HH:mm')}</span>
                  <span className="period-text">{timeSlot.period.name}</span>
                </div>
                
                {days.map((day) => {
                  const events = templateEvents.filter(ev => 
                    ev.dayIndex === day.index && 
                    ev.periodId === timeSlot.period.id
                  );

                  const isSelected = selectedCells.some(
                    cell => cell.dayIndex === day.index && cell.periodId === timeSlot.period.id
                  );

                  return (
                    <div 
                      key={`${day.index}-${timeIndex}`}
                      className={clsx('schedule-cell', {
                        'break-period': timeSlot.period.isBreak,
                        'clickable': !timeSlot.period.isBreak,
                        'selected': isSelected && !timeSlot.period.isBreak
                      })}
                      ref={el => {
                        if (!rowCellRefs.current[timeIndex]) {
                          rowCellRefs.current[timeIndex] = [];
                        }
                        rowCellRefs.current[timeIndex][day.index] = el;
                      }}
                      onMouseDown={(e) => !timeSlot.period.isBreak && handleSlotMouseDown(e, day.index, timeSlot)}
                      onMouseEnter={(e) => !timeSlot.period.isBreak && handleSlotMouseEnter(e, day.index, timeSlot)}
                      onMouseUp={(e) => !timeSlot.period.isBreak && handleSlotMouseUp(e, day.index, timeSlot)}
                      onDragOver={(e) => !timeSlot.period.isBreak && handleCellDragOver(e, day.index, timeSlot.period.id)}
                      onDragLeave={handleCellDragLeave}
                      onDrop={(e) => !timeSlot.period.isBreak && handleCellDrop(e, day.index, timeSlot.period.id)}
                      title={isSelected ? `已選中 ${selectedCells.length} 個區塊 - 按快捷鍵快速創建，方向鍵移動，Shift+方向鍵擴展選擇，Delete 刪除` : '點擊或拖動選中，再點一次編輯，或拖放快捷鍵到此處'}
                    >
                      {events.map(ev => (
                        <div 
                          key={ev.id} 
                          className="schedule-event"
                          style={{ backgroundColor: ev.color }}
                          onClick={(e) => handleEventClick(e, ev)}
                          title="點擊編輯"
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 儲存課表
          </button>
        </div>
      </div>

      {/* Speech Bubble Popover */}
      {popover.isOpen && (
        <div 
          ref={popoverRef}
          className="event-popover"
          style={{
            position: 'fixed',
            left: popover.position.x,
            top: popover.position.y,
          }}
        >
          <div className="popover-arrow" />
          <div className="popover-content">
            {/* Title */}
            <div className="popover-title-row">
              <input
                type="text"
                className="popover-title-input"
                placeholder={popover.dayIndex === -1 ? "快捷鍵事件名稱" : "課程名稱"}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Color Picker */}
            <div className="popover-color-picker-row">
              <span className="popover-color-label">選擇顏色：</span>
              <div className="popover-color-options">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={clsx('popover-color-option', {
                      'selected': editingColor === color,
                    })}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingColor(color)}
                    title={color}
                    aria-label={`選擇顏色 ${color}`}
                  >
                    {editingColor === color && (
                      <span className="color-checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="popover-row">
              <input
                type="text"
                className="popover-input"
                placeholder={popover.dayIndex === -1 ? "地點（選填）" : "上課地點"}
                value={editingLocation}
                onChange={(e) => setEditingLocation(e.target.value)}
              />
            </div>

            {/* Time Display - only show for schedule events, not shortcuts */}
            {popover.dayIndex !== -1 && (
              <div className="popover-time-row">
                <span className="popover-time-display">{getTimeDisplay()}</span>
              </div>
            )}

            {/* Notes */}
            <div className="popover-row">
              <input
                type="text"
                className="popover-input"
                placeholder={popover.dayIndex === -1 ? "備註（選填）" : "備註"}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="popover-actions">
              {/* Only show delete for schedule events, not shortcuts */}
              {!popover.isNew && popover.dayIndex !== -1 && (
                <button
                  type="button"
                  className="popover-btn popover-btn-danger"
                  onClick={handlePopoverDelete}
                >
                  刪除
                </button>
              )}
              <div className="popover-spacer" />
              <button 
                type="button" 
                className="popover-btn popover-btn-secondary" 
                onClick={() => {
                  setPopover(prev => ({ ...prev, isOpen: false }));
                  setEditingShortcutId(null);
                }}
              >
                取消
              </button>
              <button 
                type="button" 
                className="popover-btn popover-btn-primary"
                onClick={handlePopoverSave}
              >
                {popover.dayIndex === -1 ? '儲存' : (popover.isNew ? '新增' : '儲存')}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Confirm Leave Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay" onClick={handleCancelLeave}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h3 className="confirm-dialog-title">⚠️ 未儲存的變更</h3>
            </div>
            <div className="confirm-dialog-content">
              <p>您有未儲存的變更，確定要離開嗎？</p>
              <p className="confirm-dialog-hint">變更將不會被儲存</p>
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancelLeave}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmLeave}
              >
                確定離開
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleEditor;
