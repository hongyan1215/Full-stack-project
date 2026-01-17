'use client';

import React, { useState } from 'react';
import { TimeGrid } from '../types/calendar';
import TimeGridEditor from './TimeGridEditor';
import clsx from 'clsx';

interface TimeGridManagerProps {
  timeGrids: TimeGrid[];
  currentTimeGrid: TimeGrid;
  onTimeGridChange: (timeGrid: TimeGrid) => void;
  onAddTimeGrid: (timeGrid: TimeGrid) => void;
  onUpdateTimeGrid: (timeGridId: string, updates: Partial<TimeGrid>) => void;
  onDeleteTimeGrid: (timeGridId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TimeGridManager: React.FC<TimeGridManagerProps> = ({
  timeGrids,
  currentTimeGrid,
  onTimeGridChange,
  onAddTimeGrid,
  onUpdateTimeGrid,
  onDeleteTimeGrid,
  isOpen,
  onClose,
}) => {
  const [editingTimeGrid, setEditingTimeGrid] = useState<TimeGrid | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    setEditingTimeGrid(null);
    setIsCreating(true);
  };

  const handleEdit = (timeGrid: TimeGrid) => {
    setEditingTimeGrid(timeGrid);
    setIsCreating(false);
  };

  const handleSave = (timeGrid: TimeGrid) => {
    if (isCreating) {
      onAddTimeGrid(timeGrid);
    } else {
      onUpdateTimeGrid(timeGrid.id, timeGrid);
    }
    setEditingTimeGrid(null);
    setIsCreating(false);
  };

  const handleDelete = (timeGridId: string) => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this time grid?')) {
      onDeleteTimeGrid(timeGridId);
    }
  };

  const isCustomGrid = (timeGrid: TimeGrid) => timeGrid.id.startsWith('custom-');

  if (!isOpen) return null;

  return (
    <div className="event-modal" onClick={onClose}>
      <div className="event-modal-content time-grid-manager" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2 className="event-modal-title">Manage Time Grids</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="time-grid-list">
          <div className="time-grid-actions">
            <button
              className="btn btn-primary"
              onClick={handleCreateNew}
            >
              + Create New Time Grid
            </button>
          </div>

          <div className="time-grid-items">
            {timeGrids.map((timeGrid) => (
              <div
                key={timeGrid.id}
                className={clsx('time-grid-item', {
                  'active': timeGrid.id === currentTimeGrid.id,
                  'custom': isCustomGrid(timeGrid),
                })}
              >
                <div className="time-grid-info">
                  <h3 className="time-grid-name">{timeGrid.name}</h3>
                  <p className="time-grid-periods">
                    {timeGrid.periods.length} periods
                    {timeGrid.periods.length > 0 && (
                      <span className="time-range">
                        ({timeGrid.periods[0].startTime} - {timeGrid.periods[timeGrid.periods.length - 1].endTime})
                      </span>
                    )}
                  </p>
                </div>

                <div className="time-grid-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onTimeGridChange(timeGrid)}
                    disabled={timeGrid.id === currentTimeGrid.id}
                  >
                    {timeGrid.id === currentTimeGrid.id ? 'Active' : 'Use'}
                  </button>
                  
                  {isCustomGrid(timeGrid) && (
                    <>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(timeGrid)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(timeGrid.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <TimeGridEditor
          timeGrid={editingTimeGrid}
          isOpen={editingTimeGrid !== null || isCreating}
          onClose={() => {
            setEditingTimeGrid(null);
            setIsCreating(false);
          }}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default TimeGridManager;

