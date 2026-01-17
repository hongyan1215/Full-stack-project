'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ScheduleEditor from '../../components/ScheduleEditor';
import ScheduleManager from '../../components/ScheduleManager';
import { useCalendar } from '../../hooks/useCalendar';
import { useTracking } from '../../hooks/usePostHog';
import { Schedule, ScheduleTemplateEvent, ShortcutBinding, TimeGrid } from '../../types/calendar';
import '../../styles/Calendar.css';
import '../../styles/ScheduleEditor.css';

type ViewMode = 'list' | 'edit';

const SchedulePage = () => {
  const router = useRouter();
  const { track } = useTracking();
  const { 
    allTimeGrids, 
    schedules,
    currentScheduleId,
    setCurrentScheduleId,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    generateScheduleEvents,
    deactivateSchedule,
  } = useCalendar();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Track page view
  useEffect(() => {
    track('schedule_page_view', {
      schedules_count: schedules.length,
      has_active_schedule: schedules.some(s => s.isActive),
    });
  }, []); // Only track on mount

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get the time grid for the editing schedule
  const editingTimeGrid = useMemo(() => {
    if (!editingSchedule) return allTimeGrids[0];
    return allTimeGrids.find(g => g.id === editingSchedule.timeGridId) || allTimeGrids[0];
  }, [editingSchedule, allTimeGrids]);

  const handleEditSchedule = (schedule: Schedule) => {
    // Always use the latest schedule from the schedules array
    const latestSchedule = schedules.find(s => s.id === schedule.id) || schedule;
    
    track('schedule_editor_opened', {
      schedule_id: latestSchedule.id,
      schedule_name: latestSchedule.name,
      template_events_count: latestSchedule.templateEvents?.length || 0,
      time_grid_id: latestSchedule.timeGridId,
    });
    
    setEditingSchedule(latestSchedule);
    setViewMode('edit');
  };

  // Sync editingSchedule when schedules array changes (e.g., after updateSchedule)
  useEffect(() => {
    if (editingSchedule && viewMode === 'edit') {
      const updatedSchedule = schedules.find(s => s.id === editingSchedule.id);
      if (updatedSchedule) {
        // Check if templateEvents or timeGridId changed by comparing serialized versions
        const currentTemplateEventsStr = JSON.stringify(editingSchedule.templateEvents || []);
        const updatedTemplateEventsStr = JSON.stringify(updatedSchedule.templateEvents || []);
        const templateEventsChanged = currentTemplateEventsStr !== updatedTemplateEventsStr;
        const timeGridChanged = updatedSchedule.timeGridId !== editingSchedule.timeGridId;
        
        if (templateEventsChanged || timeGridChanged) {
          console.log('🔄 Syncing editingSchedule from schedules array:', {
            scheduleId: editingSchedule.id,
            templateEventsChanged,
            timeGridChanged,
            oldTemplateEventsCount: (editingSchedule.templateEvents || []).length,
            newTemplateEventsCount: (updatedSchedule.templateEvents || []).length
          });
          setEditingSchedule(updatedSchedule);
        }
      }
    }
  }, [schedules, editingSchedule?.id, viewMode]);

  const handleSaveSchedule = (templateEvents: ScheduleTemplateEvent[], shortcutBindings?: ShortcutBinding[]) => {
    if (editingSchedule) {
      const initialCount = editingSchedule.templateEvents?.length || 0;
      const finalCount = templateEvents.length;
      
      track('schedule_editor_saved', {
        schedule_id: editingSchedule.id,
        schedule_name: editingSchedule.name,
        initial_events_count: initialCount,
        final_events_count: finalCount,
        events_added: finalCount > initialCount ? finalCount - initialCount : 0,
        events_removed: initialCount > finalCount ? initialCount - finalCount : 0,
        shortcuts_count: shortcutBindings?.length || 0,
      });
      
      updateSchedule(editingSchedule.id, { 
        templateEvents,
        shortcutBindings: shortcutBindings || []
      });
    }
    setViewMode('list');
    setEditingSchedule(null);
  };

  const handleTimeGridChange = async (newTimeGridId: string) => {
    if (!editingSchedule) return;
    
    const oldTimeGrid = allTimeGrids.find(g => g.id === editingSchedule.timeGridId);
    const newTimeGrid = allTimeGrids.find(g => g.id === newTimeGridId);
    
    if (!oldTimeGrid || !newTimeGrid) return;
    
    // Check if there are existing classes
    const hasExistingClasses = editingSchedule.templateEvents && editingSchedule.templateEvents.length > 0;
    
    track('schedule_time_grid_change_attempt', {
      schedule_id: editingSchedule.id,
      from_time_grid_id: oldTimeGrid.id,
      from_time_grid_name: oldTimeGrid.name,
      to_time_grid_id: newTimeGrid.id,
      to_time_grid_name: newTimeGrid.name,
      has_existing_classes: hasExistingClasses,
      existing_classes_count: editingSchedule.templateEvents?.length || 0,
    });
    
    if (hasExistingClasses) {
      // Show warning dialog
      const shouldMigrate = window.confirm(
        `⚠️ 警告：切換時間格會影響現有的課程。\n\n` +
        `目前時間格：${oldTimeGrid.name}\n` +
        `新時間格：${newTimeGrid.name}\n\n` +
        `現有課程數量：${editingSchedule.templateEvents.length}\n\n` +
        `是否要遷移現有課程到新的時間格？\n` +
        `（系統會嘗試根據時間匹配課程，無法匹配的課程將被移除）\n\n` +
        `點擊「確定」進行遷移，點擊「取消」取消操作。`
      );
      
      if (!shouldMigrate) {
        track('schedule_time_grid_change_cancelled', {
          schedule_id: editingSchedule.id,
          from_time_grid_id: oldTimeGrid.id,
          to_time_grid_id: newTimeGrid.id,
        });
        return; // User cancelled
      }
      
      // Migrate template events to new time grid
      const migratedEvents = migrateTemplateEvents(
        editingSchedule.templateEvents,
        oldTimeGrid,
        newTimeGrid
      );
      
      const initialCount = editingSchedule.templateEvents.length;
      const migratedCount = migratedEvents.length;
      const lostCount = initialCount - migratedCount;
      
      track('schedule_time_grid_migrated', {
        schedule_id: editingSchedule.id,
        from_time_grid_id: oldTimeGrid.id,
        to_time_grid_id: newTimeGrid.id,
        initial_events_count: initialCount,
        migrated_events_count: migratedCount,
        lost_events_count: lostCount,
        migration_success_rate: initialCount > 0 ? (migratedCount / initialCount) * 100 : 0,
      });
      
      // Update schedule and wait for it to complete
      await updateSchedule(editingSchedule.id, { 
        timeGridId: newTimeGridId,
        templateEvents: migratedEvents 
      });
      
      // Sync editingSchedule from the updated schedules array
      const updatedSchedule = schedules.find(s => s.id === editingSchedule.id);
      if (updatedSchedule) {
        setEditingSchedule(updatedSchedule);
      } else {
        // Fallback: update local state directly
        setEditingSchedule({
          ...editingSchedule,
          timeGridId: newTimeGridId,
          templateEvents: migratedEvents,
        });
      }
    } else {
      // No existing classes, just update the time grid
      await updateSchedule(editingSchedule.id, { 
        timeGridId: newTimeGridId,
        templateEvents: [] 
      });
      
      // Sync editingSchedule from the updated schedules array
      const updatedSchedule = schedules.find(s => s.id === editingSchedule.id);
      if (updatedSchedule) {
        setEditingSchedule(updatedSchedule);
      } else {
        // Fallback: update local state directly
        setEditingSchedule({
          ...editingSchedule,
          timeGridId: newTimeGridId,
          templateEvents: [],
        });
      }
    }
  };

  // Helper function to migrate template events from old time grid to new time grid
  const migrateTemplateEvents = (
    oldEvents: ScheduleTemplateEvent[],
    oldTimeGrid: TimeGrid,
    newTimeGrid: TimeGrid
  ): ScheduleTemplateEvent[] => {
    // Create a map from old period IDs to their time ranges
    const oldPeriodMap = new Map<string, { startTime: string; endTime: string }>();
    oldTimeGrid.periods.forEach(period => {
      oldPeriodMap.set(period.id, { startTime: period.startTime, endTime: period.endTime });
    });
    
    // Create a map from time ranges to new period IDs
    const timeToNewPeriodMap = new Map<string, string>();
    newTimeGrid.periods.forEach(period => {
      const timeKey = `${period.startTime}-${period.endTime}`;
      timeToNewPeriodMap.set(timeKey, period.id);
    });
    
    // Migrate events
    const migratedEvents: ScheduleTemplateEvent[] = [];
    const unmigratedCount = { count: 0 };
    
    oldEvents.forEach(event => {
      const oldPeriod = oldPeriodMap.get(event.periodId);
      if (!oldPeriod) {
        unmigratedCount.count++;
        return; // Old period not found, skip
      }
      
      // Try to find matching period in new time grid by time
      const timeKey = `${oldPeriod.startTime}-${oldPeriod.endTime}`;
      const newPeriodId = timeToNewPeriodMap.get(timeKey);
      
      if (newPeriodId) {
        // Found matching period, migrate the event
        migratedEvents.push({
          ...event,
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${event.dayIndex}-${newPeriodId}-${migratedEvents.length}`,
          periodId: newPeriodId,
        });
      } else {
        // No matching period found, try to find closest match
        const closestPeriod = findClosestPeriod(
          oldPeriod.startTime,
          oldPeriod.endTime,
          newTimeGrid.periods
        );
        
        if (closestPeriod) {
          migratedEvents.push({
            ...event,
            id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${event.dayIndex}-${closestPeriod.id}-${migratedEvents.length}`,
            periodId: closestPeriod.id,
          });
        } else {
          unmigratedCount.count++;
        }
      }
    });
    
    if (unmigratedCount.count > 0) {
      alert(
        `⚠️ 遷移完成\n\n` +
        `成功遷移：${migratedEvents.length} 個課程\n` +
        `無法遷移：${unmigratedCount.count} 個課程（已移除）\n\n` +
        `無法遷移的課程是因為在新時間格中找不到對應的時間段。`
      );
    } else if (migratedEvents.length > 0) {
      alert(`✅ 遷移完成：成功遷移 ${migratedEvents.length} 個課程到新的時間格。`);
    }
    
    return migratedEvents;
  };

  // Helper function to find the closest period by time
  const findClosestPeriod = (
    startTime: string,
    endTime: string,
    periods: TimeGrid['periods']
  ): TimeGrid['periods'][0] | null => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    
    let closestPeriod: { id: string; startTime: string; endTime: string } | null = null;
    let minDiff = Infinity;
    
    periods.forEach(period => {
      const [pStartHour, pStartMin] = period.startTime.split(':').map(Number);
      const [pEndHour, pEndMin] = period.endTime.split(':').map(Number);
      const pStartMinutes = pStartHour * 60 + pStartMin;
      const pEndMinutes = pEndHour * 60 + pEndMin;
      const pDuration = pEndMinutes - pStartMinutes;
      
      // Calculate difference in start time
      const startDiff = Math.abs(pStartMinutes - startMinutes);
      // Prefer periods with similar duration
      const durationDiff = Math.abs(pDuration - duration);
      // Combined score (start time difference is more important)
      const totalDiff = startDiff * 2 + durationDiff;
      
      if (totalDiff < minDiff) {
        minDiff = totalDiff;
        closestPeriod = period;
      }
    });
    
    // Only return if the difference is reasonable (within 2 hours)
    if (minDiff <= 120) {
      return closestPeriod;
    }
    
    return null;
  };

  const handleCloseEditor = () => {
    if (editingSchedule) {
      track('schedule_editor_closed', {
        schedule_id: editingSchedule.id,
        schedule_name: editingSchedule.name,
        template_events_count: editingSchedule.templateEvents?.length || 0,
      });
    }
    setViewMode('list');
    setEditingSchedule(null);
  };

  const handleBackToCalendar = () => {
    track('schedule_page_back_to_calendar', {
      view_mode: viewMode,
      schedules_count: schedules.length,
    });
    router.push('/');
  };

  // Show loading state until hydrated
  if (!isHydrated) {
    return (
      <div className="schedule-page">
        <div className="schedule-page-header">
          <h1 className="schedule-page-title">課表管理</h1>
        </div>
        <div className="schedule-manager">
          <div className="schedule-empty">
            <p>載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'edit' && editingSchedule && editingTimeGrid) {
    return (
      <div className="schedule-page">
        <ScheduleEditor
          key={`${editingSchedule.id}-${editingSchedule.timeGridId}-${(editingSchedule.templateEvents || []).length}`}
          schedule={editingSchedule}
          timeGrid={editingTimeGrid}
          allTimeGrids={allTimeGrids}
          onSave={handleSaveSchedule}
          onClose={handleCloseEditor}
          onTimeGridChange={handleTimeGridChange}
        />
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="schedule-page-header">
        <button 
          className="btn btn-secondary back-btn"
          onClick={handleBackToCalendar}
        >
          ← 返回日曆
        </button>
        <h1 className="schedule-page-title">課表管理</h1>
      </div>
      
      <ScheduleManager
        schedules={schedules}
        currentScheduleId={currentScheduleId}
        allTimeGrids={allTimeGrids}
        onSelectSchedule={setCurrentScheduleId}
        onCreateSchedule={createSchedule}
        onDeleteSchedule={deleteSchedule}
        onEditSchedule={handleEditSchedule}
        onActivateSchedule={generateScheduleEvents}
        onDeactivateSchedule={deactivateSchedule}
      />
    </div>
  );
};

export default SchedulePage;
