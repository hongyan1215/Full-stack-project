'use client';

import React, { useState, useEffect } from 'react';
import { Schedule, TimeGrid } from '../types/calendar';
import { useTracking } from '../hooks/usePostHog';
import clsx from 'clsx';

interface ScheduleManagerProps {
  schedules: Schedule[];
  currentScheduleId: string | null;
  allTimeGrids: TimeGrid[];
  onSelectSchedule: (scheduleId: string) => void;
  onCreateSchedule: (name: string, timeGridId: string) => Schedule | Promise<Schedule>;
  onDeleteSchedule: (scheduleId: string) => void | Promise<void>;
  onEditSchedule: (schedule: Schedule) => void;
  onActivateSchedule: (scheduleId: string, startDate: Date, endDate: Date) => void;
  onDeactivateSchedule: (scheduleId: string) => void;
}

// Helper to get date string in YYYY-MM-DD format
const getDateString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  schedules,
  currentScheduleId,
  allTimeGrids,
  onSelectSchedule,
  onCreateSchedule,
  onDeleteSchedule,
  onEditSchedule,
  onActivateSchedule,
  onDeactivateSchedule,
}) => {
  const { track } = useTracking();
  const [isCreating, setIsCreating] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [selectedTimeGridId, setSelectedTimeGridId] = useState('');
  const [activatingScheduleId, setActivatingScheduleId] = useState<string | null>(null);
  const [activateStartDate, setActivateStartDate] = useState('');
  const [activateEndDate, setActivateEndDate] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Initialize dates on client side only to avoid hydration mismatch
  useEffect(() => {
    setSelectedTimeGridId(allTimeGrids[0]?.id || '');
    setActivateStartDate(getDateString(new Date()));
    setActivateEndDate(getDateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)));
  }, [allTimeGrids]);

  const handleCreateSchedule = async () => {
    // Validate inputs
    if (!newScheduleName.trim()) {
      setCreateError('請輸入課表名稱');
      track('schedule_create_validation_error', {
        error_type: 'missing_name',
      });
      return;
    }
    if (!selectedTimeGridId) {
      setCreateError('請選擇時間表');
      track('schedule_create_validation_error', {
        error_type: 'missing_time_grid',
      });
      return;
    }
    
    // Clear any previous errors
    setCreateError(null);
    
    const selectedTimeGrid = allTimeGrids.find(g => g.id === selectedTimeGridId);
    
    track('schedule_create_started', {
      schedule_name: newScheduleName.trim(),
      time_grid_id: selectedTimeGridId,
      time_grid_name: selectedTimeGrid?.name || 'Unknown',
    });
    
    const newSchedule = await onCreateSchedule(newScheduleName.trim(), selectedTimeGridId);
    setNewScheduleName('');
    setIsCreating(false);
    setCreateError(null);
    
    track('schedule_create_completed', {
      schedule_id: newSchedule.id,
      schedule_name: newSchedule.name,
      time_grid_id: newSchedule.timeGridId,
    });
    
    onSelectSchedule(newSchedule.id);
    onEditSchedule(newSchedule);
  };

  const handleActivate = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const startDate = new Date(activateStartDate);
    const endDate = new Date(activateEndDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    track('schedule_activate_from_manager', {
      schedule_id: scheduleId,
      schedule_name: schedule?.name,
      start_date: activateStartDate,
      end_date: activateEndDate,
      duration_days: daysDiff,
      template_events_count: schedule?.templateEvents?.length || 0,
    });
    
    onActivateSchedule(scheduleId, startDate, endDate);
    setActivatingScheduleId(null);
  };

  const getTimeGridName = (timeGridId: string) => {
    return allTimeGrids.find(g => g.id === timeGridId)?.name || 'Unknown';
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-manager-header">
        <h3 className="schedule-manager-title">📚 我的課表</h3>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => {
            track('schedule_create_button_clicked', {});
            setIsCreating(true);
          }}
        >
          + 新增課表
        </button>
      </div>

      {/* Create new schedule form */}
      {isCreating && (
        <div className="schedule-create-form">
          <div className="form-row">
            <input
              type="text"
              className={clsx('form-input', { 'form-input-error': createError && !newScheduleName.trim() })}
              placeholder="課表名稱（例如：111-1 學期課表）"
              value={newScheduleName}
              onChange={(e) => {
                setNewScheduleName(e.target.value);
                // Clear error when user starts typing
                if (createError && e.target.value.trim()) {
                  setCreateError(null);
                }
              }}
              autoFocus
            />
          </div>
          {createError && !newScheduleName.trim() && (
            <div className="form-error-message">
              {createError}
            </div>
          )}
          <div className="form-row">
            <select
              className={clsx('form-input', { 'form-input-error': createError && !selectedTimeGridId })}
              value={selectedTimeGridId}
              onChange={(e) => {
                setSelectedTimeGridId(e.target.value);
                // Clear error when user selects a time grid
                if (createError && e.target.value) {
                  setCreateError(null);
                }
              }}
            >
              {allTimeGrids.map(grid => (
                <option key={grid.id} value={grid.id}>{grid.name}</option>
              ))}
            </select>
          </div>
          {createError && !selectedTimeGridId && (
            <div className="form-error-message">
              {createError}
            </div>
          )}
          <div className="form-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setIsCreating(false);
                setNewScheduleName('');
                setCreateError(null);
              }}
            >
              取消
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleCreateSchedule}
              disabled={!newScheduleName.trim() || !selectedTimeGridId}
              title={!newScheduleName.trim() ? '請輸入課表名稱' : !selectedTimeGridId ? '請選擇時間表' : ''}
            >
              建立
            </button>
          </div>
          {(!newScheduleName.trim() || !selectedTimeGridId) && !createError && (
            <div className="form-hint">
              請填寫課表名稱和選擇時間表後才能建立
            </div>
          )}
        </div>
      )}

      {/* Schedule list */}
      <div className="schedule-list">
        {schedules.length === 0 ? (
          <div className="schedule-empty">
            <p>尚未建立任何課表</p>
            <p className="schedule-empty-hint">點擊「新增課表」開始建立你的第一個課表</p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div 
              key={schedule.id}
              className={clsx('schedule-item', {
                'selected': currentScheduleId === schedule.id,
                'active': schedule.isActive,
              })}
            >
              <div className="schedule-item-main" onClick={() => {
                track('schedule_item_selected', {
                  schedule_id: schedule.id,
                  schedule_name: schedule.name,
                  is_active: schedule.isActive,
                  template_events_count: schedule.templateEvents.length,
                });
                onSelectSchedule(schedule.id);
              }}>
                <div className="schedule-item-info">
                  <div className="schedule-item-name">
                    {schedule.isActive && <span className="active-badge">啟用中</span>}
                    {schedule.name}
                  </div>
                  <div className="schedule-item-meta">
                    <span className="schedule-item-grid">🕐 {getTimeGridName(schedule.timeGridId)}</span>
                    <span className="schedule-item-count">📝 {schedule.templateEvents.length} 個課程</span>
                  </div>
                </div>
              </div>
              
              <div className="schedule-item-actions">
                <button
                  className="btn btn-sm btn-icon"
                  onClick={() => {
                    track('schedule_edit_button_clicked', {
                      schedule_id: schedule.id,
                      schedule_name: schedule.name,
                    });
                    onEditSchedule(schedule);
                  }}
                  title="編輯課表"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                
                {schedule.isActive ? (
                  <button
                    className="btn btn-sm btn-icon"
                    onClick={() => {
                      track('schedule_deactivate_button_clicked', {
                        schedule_id: schedule.id,
                        schedule_name: schedule.name,
                      });
                      onDeactivateSchedule(schedule.id);
                    }}
                    title="停用課表"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-icon"
                    onClick={() => {
                      track('schedule_activate_button_clicked', {
                        schedule_id: schedule.id,
                        schedule_name: schedule.name,
                        template_events_count: schedule.templateEvents.length,
                      });
                      setActivatingScheduleId(schedule.id);
                    }}
                    title="啟用課表"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                )}
                
                <button
                  className="btn btn-sm btn-icon btn-danger-icon"
                  onClick={() => {
                    track('schedule_delete_button_clicked', {
                      schedule_id: schedule.id,
                      schedule_name: schedule.name,
                      is_active: schedule.isActive,
                    });
                    if (confirm(`確定要刪除「${schedule.name}」嗎？`)) {
                      track('schedule_delete_confirmed', {
                        schedule_id: schedule.id,
                        schedule_name: schedule.name,
                      });
                      onDeleteSchedule(schedule.id);
                    } else {
                      track('schedule_delete_cancelled', {
                        schedule_id: schedule.id,
                        schedule_name: schedule.name,
                      });
                    }
                  }}
                  title="刪除課表"
                >
                  🗑️
                </button>
              </div>

              {/* Activate date range picker */}
              {activatingScheduleId === schedule.id && (
                <div className="schedule-activate-form">
                  <p className="activate-form-label">選擇課表生效日期範圍：</p>
                  <div className="activate-date-inputs">
                    <input
                      type="date"
                      className="form-input"
                      value={activateStartDate}
                      onChange={(e) => setActivateStartDate(e.target.value)}
                    />
                    <span>至</span>
                    <input
                      type="date"
                      className="form-input"
                      value={activateEndDate}
                      onChange={(e) => setActivateEndDate(e.target.value)}
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        track('schedule_activate_cancelled', {
                          schedule_id: schedule.id,
                        });
                        setActivatingScheduleId(null);
                      }}
                    >
                      取消
                    </button>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleActivate(schedule.id)}
                    >
                      啟用
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;

