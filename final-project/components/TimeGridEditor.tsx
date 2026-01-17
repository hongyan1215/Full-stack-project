'use client';

import React, { useState, useEffect } from 'react';
import { TimeGrid, TimePeriod } from '../types/calendar';

interface TimeGridEditorProps {
  timeGrid: TimeGrid | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeGrid: TimeGrid) => void;
}

const TimeGridEditor: React.FC<TimeGridEditorProps> = ({
  timeGrid,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    periods: [] as TimePeriod[],
  });
  const [periodErrors, setPeriodErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    setPeriodErrors({}); // Clear errors when timeGrid changes
    if (timeGrid) {
      setFormData({
        name: timeGrid.name,
        periods: [...timeGrid.periods],
      });
    } else {
      setFormData({
        name: '',
        periods: [],
      });
    }
  }, [timeGrid]);

  const addPeriod = () => {
    const lastPeriod = formData.periods[formData.periods.length - 1];
    const startTime = lastPeriod ? lastPeriod.endTime : '09:00';
    
    // Calculate end time (add 1 hour by default)
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const newPeriod: TimePeriod = {
      id: `period-${Date.now()}`,
      name: `Period ${formData.periods.length + 1}`,
      startTime: startTime,
      endTime: endTime,
      color: '#3b82f6',
      isBreak: false,
    };
    setFormData(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod],
    }));
  };

  const updatePeriod = (index: number, field: keyof TimePeriod, value: any) => {
    setFormData(prev => {
      const updatedPeriods = prev.periods.map((period, i) => {
        if (i === index) {
          const updatedPeriod = { ...period, [field]: value };
          
          // Auto-generate name if empty and not a break period
          if (field === 'name' && !value.trim() && !updatedPeriod.isBreak) {
            updatedPeriod.name = `Period ${i + 1}`;
          }
          
          return updatedPeriod;
        }
        return period;
      });

      // Validate time order for the updated period
      const updatedPeriod = updatedPeriods[index];
      if ((field === 'startTime' || field === 'endTime') && updatedPeriod.startTime && updatedPeriod.endTime) {
        if (updatedPeriod.startTime >= updatedPeriod.endTime) {
          setPeriodErrors(prev => ({ ...prev, [index]: '結束時間必須晚於開始時間' }));
        } else {
          setPeriodErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
          });
        }
      }

      return {
        ...prev,
        periods: updatedPeriods,
      };
    });
  };

  const removePeriod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index),
    }));
  };

  const movePeriod = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.periods.length) return;

    const newPeriods = [...formData.periods];
    [newPeriods[index], newPeriods[newIndex]] = [newPeriods[newIndex], newPeriods[index]];
    
    setFormData(prev => ({
      ...prev,
      periods: newPeriods,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.periods.length === 0) return;

    // Validate all periods have valid time ranges
    const errors: Record<number, string> = {};
    formData.periods.forEach((period, index) => {
      if (period.startTime >= period.endTime) {
        errors[index] = '結束時間必須晚於開始時間';
      }
    });

    if (Object.keys(errors).length > 0) {
      setPeriodErrors(errors);
      return;
    }

    // Ensure all periods have names
    const periodsWithNames = formData.periods.map((period, index) => ({
      ...period,
      name: period.name.trim() || (period.isBreak ? 'Break' : `Period ${index + 1}`),
    }));

    const timeGridData: TimeGrid = {
      id: timeGrid?.id || `grid-${Date.now()}`,
      name: formData.name,
      periods: periodsWithNames,
    };

    onSave(timeGridData);
    onClose();
  };

  const validateTimeOrder = () => {
    for (let i = 0; i < formData.periods.length - 1; i++) {
      const current = formData.periods[i];
      const next = formData.periods[i + 1];
      if (current.endTime > next.startTime) {
        return false;
      }
    }
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal time-grid-editor" onClick={onClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2 className="event-modal-title">
            {timeGrid ? 'Edit Time Grid' : 'Create Time Grid'}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="gridName">
              Time Grid Name *
            </label>
            <input
              id="gridName"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Custom Schedule"
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label">Time Periods *</div>
            <div className="periods-container">
              {formData.periods.map((period, index) => (
                <div key={period.id} className="period-item">
                  <div className="period-header">
                    <div className="period-number">
                      {index + 1}
                    </div>
                    <div className="period-controls">
                      <button
                        type="button"
                        className="period-move-btn"
                        onClick={() => movePeriod(index, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="period-move-btn"
                        onClick={() => movePeriod(index, 'down')}
                        disabled={index === formData.periods.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="period-remove-btn"
                        onClick={() => removePeriod(index)}
                        title="Remove period"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="period-fields">
                    <div className="period-field period-name-field">
                      <label className="form-label">Name (Optional)</label>
                      <input
                        type="text"
                        className="form-input period-name-input"
                        value={period.name}
                        onChange={(e) => updatePeriod(index, 'name', e.target.value)}
                        placeholder={`Period ${index + 1}`}
                      />
                    </div>

                    <div className="period-field">
                      <label className="form-label" htmlFor={`startTime-${index}`}>Start Time</label>
                      <input
                        id={`startTime-${index}`}
                        type="time"
                        className={periodErrors[index] ? "form-input form-input-error" : "form-input"}
                        value={period.startTime}
                        onChange={(e) => updatePeriod(index, 'startTime', e.target.value)}
                        required
                      />
                    </div>

                    <div className="period-field">
                      <label className="form-label" htmlFor={`endTime-${index}`}>End Time</label>
                      <input
                        id={`endTime-${index}`}
                        type="time"
                        className={periodErrors[index] ? "form-input form-input-error" : "form-input"}
                        value={period.endTime}
                        onChange={(e) => updatePeriod(index, 'endTime', e.target.value)}
                        required
                      />
                      {periodErrors[index] && (
                        <div className="form-error-message" style={{ marginTop: '0.25rem', color: '#ef4444', fontSize: '0.875rem' }}>
                          {periodErrors[index]}
                        </div>
                      )}
                    </div>

                    <div className="period-field">
                      <label className="form-label" htmlFor={`color-${index}`}>Color</label>
                      <input
                        id={`color-${index}`}
                        type="color"
                        className="form-input color-input"
                        value={period.color || '#3b82f6'}
                        onChange={(e) => updatePeriod(index, 'color', e.target.value)}
                        aria-label={`Color for ${period.name || 'period'}`}
                      />
                    </div>

                    <div className="period-field">
                      <div className="form-checkbox">
                        <input
                          id={`isBreak-${index}`}
                          type="checkbox"
                          className="checkbox-input"
                          checked={period.isBreak || false}
                          onChange={(e) => updatePeriod(index, 'isBreak', e.target.checked)}
                        />
                        <label className="form-label" htmlFor={`isBreak-${index}`}>Break Period</label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary add-period-btn"
                onClick={addPeriod}
              >
                + Add Period
              </button>
            </div>
          </div>

          {!validateTimeOrder() && formData.periods.length > 1 && (
            <div className="form-error">
              ⚠️ Time periods must be in chronological order
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!formData.name.trim() || formData.periods.length === 0 || !validateTimeOrder()}
            >
              {timeGrid ? 'Update' : 'Create'} Time Grid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeGridEditor;

