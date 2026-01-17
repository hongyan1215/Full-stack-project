'use client';

import React, { useState } from 'react';
import { CalendarView, TimeGrid, Category } from '../types/calendar';
import clsx from 'clsx';
import Link from 'next/link';
import GoogleCalendarSync from './GoogleCalendarSync';

interface FilterSidebarProps {
  // Layer filters
  showBaseLayer?: boolean;
  onToggleBaseLayer?: () => void;
  showOneTimeEvents?: boolean;
  onToggleOneTimeEvents?: () => void;
  
  // Category filters - dynamic based on categories
  categories?: Category[];
  categoryVisibility?: Record<string, boolean>;
  onToggleCategory?: (categoryId: string) => void;
  
  // Time grid controls (for week/day views)
  view?: CalendarView;
  currentTimeGrid?: TimeGrid;
  onTimeGridChange?: (timeGrid: TimeGrid) => void;
  onManageTimeGrids?: () => void;
  allTimeGrids?: TimeGrid[];
  showBreakPeriods?: boolean;
  onToggleBreakPeriods?: () => void;
  onManageCategories?: () => void;
  onSyncComplete?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  showBaseLayer = true,
  onToggleBaseLayer,
  showOneTimeEvents = true,
  onToggleOneTimeEvents,
  categories = [],
  categoryVisibility = {},
  onToggleCategory,
  view,
  currentTimeGrid,
  onTimeGridChange,
  onManageTimeGrids,
  allTimeGrids = [],
  showBreakPeriods = true,
  onToggleBreakPeriods,
  onManageCategories,
  onSyncComplete,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update body class for Safari compatibility
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('has-sidebar');
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
      return () => {
        document.body.classList.remove('has-sidebar', 'sidebar-collapsed');
      };
    }
  }, [isCollapsed]);

  return (
    <aside className={clsx('filter-sidebar', { 'collapsed': isCollapsed })}>
      <div className="filter-sidebar-header">
        <button
          className="filter-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
      
      <div className="filter-sidebar-content">
        {/* Schedule Link - At Top */}
        <div className="filter-section">
          <Link
            href="/schedule"
            className="filter-option-btn schedule-link-btn"
            data-onboarding="schedule-manager"
          >
            <span className="filter-option-icon">📅</span>
            <span className="filter-option-label">Edit Schedule</span>
          </Link>
          <div style={{ marginTop: '0.75rem' }} data-onboarding="google-sync">
            <GoogleCalendarSync onSyncComplete={onSyncComplete} compact />
          </div>
        </div>

        {/* Time Grid Controls (for week/day views) - At Top */}
        {(view === 'week' || view === 'day') && currentTimeGrid && onTimeGridChange && (
          <div className="filter-section">
            <h3 className="filter-section-title">Time Grid</h3>
            <div className="filter-options">
              <div className="time-grid-selector-sidebar">
                <select
                  value={currentTimeGrid.id}
                  onChange={(e) => {
                    const selectedGrid = allTimeGrids.find(grid => grid.id === e.target.value);
                    if (selectedGrid) {
                      onTimeGridChange(selectedGrid);
                    }
                  }}
                  className="time-grid-select-sidebar"
                  aria-label="Select time grid"
                >
                  {allTimeGrids.map((grid) => (
                    <option key={grid.id} value={grid.id}>
                      {grid.name}
                    </option>
                  ))}
                </select>
              </div>
              {onManageTimeGrids && (
                <button
                  className="filter-option-btn"
                  onClick={onManageTimeGrids}
                  title="Manage Time Grids"
                  data-onboarding="time-grid-manager"
                >
                  <span className="filter-option-icon">⚙️</span>
                  <span className="filter-option-label">Manage</span>
                </button>
              )}
              {onToggleBreakPeriods && (
                <button
                  className={clsx('filter-option-btn', { 'active': showBreakPeriods })}
                  onClick={onToggleBreakPeriods}
                  title={showBreakPeriods ? 'Hide Break Periods' : 'Show Break Periods'}
                >
                  <span className="filter-option-icon">{showBreakPeriods ? '👁️' : '🙈'}</span>
                  <span className="filter-option-label">Breaks</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Layer Controls */}
        <div className="filter-section">
          <h3 className="filter-section-title">Layers</h3>
          <div className="filter-options">
            {onToggleBaseLayer && (
              <button
                className={clsx('filter-option-btn', { 'active': showBaseLayer })}
                onClick={onToggleBaseLayer}
                title={showBaseLayer ? 'Hide Classes/Schedule (Base Layer)' : 'Show Classes/Schedule (Base Layer)'}
              >
                <span className="filter-option-icon">{showBaseLayer ? '👁️' : '🙈'}</span>
                <span className="filter-option-label">Classes/Schedule</span>
              </button>
            )}
            {onToggleOneTimeEvents && (
              <button
                className={clsx('filter-option-btn', { 'active': showOneTimeEvents })}
                onClick={onToggleOneTimeEvents}
                title="Toggle One-Time Events"
              >
                <span className="filter-option-icon">📌</span>
                <span className="filter-option-label">Events</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="filter-section">
          <h3 className="filter-section-title">Categories</h3>
          <div className="filter-options">
            {categories.length > 0 ? (
              categories
                .filter(cat => {
                  // Only show regular categories (category-1 through category-8), exclude schedule category
                  const match = cat.id.match(/^category-(\d+)$/);
                  if (!match) return false;
                  const num = parseInt(match[1]);
                  return num >= 1 && num <= 8;
                })
                .sort((a, b) => {
                  // Sort by category number
                  const aNum = parseInt(a.id.replace('category-', '') || '0');
                  const bNum = parseInt(b.id.replace('category-', '') || '0');
                  return aNum - bNum;
                })
                .map(category => {
                  const isVisible = categoryVisibility[category.id] !== false; // Default to true if not set
                  return (
                    <button
                      key={category.id}
                      className={clsx('filter-option-btn', { 'active': isVisible })}
                      onClick={() => onToggleCategory?.(category.id)}
                      title={`Toggle ${category.name}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        justifyContent: 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          backgroundColor: category.color,
                          border: '1px solid var(--border-light)',
                          flexShrink: 0,
                        }}
                      />
                      <span className="filter-option-label">{category.name}</span>
                    </button>
                  );
                })
            ) : (
              // Fallback if categories not loaded yet
              <div style={{ padding: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                Loading categories...
              </div>
            )}
          </div>
          {onManageCategories && (
            <div style={{ marginTop: '0.75rem' }}>
              <button
                className="filter-option-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onManageCategories();
                }}
                title="Manage Categories"
                style={{ width: '100%' }}
                data-onboarding="category-manager"
              >
                <span className="filter-option-icon">🏷️</span>
                <span className="filter-option-label">Manage Categories</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
