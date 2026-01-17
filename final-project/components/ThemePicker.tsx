'use client';

import React from 'react';
import { useTheme, ThemeType, ThemeInfo } from '../contexts/ThemeContext';

interface ThemePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

// 每個主題的預覽顏色配置
const themePreviewColors: Record<ThemeType, {
  header: string;
  body: string;
  cell: string;
  accent: string;
}> = {
  business: {
    header: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    body: '#f8fafc',
    cell: '#ffffff',
    accent: '#c9a227',
  },
  dreamy: {
    header: 'linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)',
    body: 'linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)',
    cell: 'rgba(255, 255, 255, 0.7)',
    accent: '#f472b6',
  },
  journal: {
    header: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4bc 100%)',
    body: '#faf6f1',
    cell: '#f5e6d3',
    accent: '#2d5a27',
  },
  modern: {
    header: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    body: '#f8fafc',
    cell: '#ffffff',
    accent: '#3b82f6',
  },
  kawaii: {
    header: 'linear-gradient(135deg, #fae8ff 0%, #ddd6fe 100%)',
    body: 'linear-gradient(180deg, #fae8ff 0%, #e0e7ff 100%)',
    cell: 'rgba(255, 255, 255, 0.8)',
    accent: '#c084fc',
  },
};

const ThemePicker: React.FC<ThemePickerProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, themes } = useTheme();

  if (!isOpen) return null;

  const handleThemeSelect = (themeId: ThemeType) => {
    setTheme(themeId);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="theme-picker-modal" onClick={handleBackdropClick}>
      <div className="theme-picker-content">
        <div className="theme-picker-header">
          <h2 className="theme-picker-title">🎨 選擇主題風格</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="theme-grid">
          {themes.map((themeInfo: ThemeInfo) => {
            const colors = themePreviewColors[themeInfo.id];
            const isActive = theme === themeInfo.id;
            
            return (
              <div
                key={themeInfo.id}
                className={`theme-card ${isActive ? 'active' : ''}`}
                onClick={() => handleThemeSelect(themeInfo.id)}
              >
                {/* 主題預覽 */}
                <div className="theme-preview">
                  <div 
                    className="theme-preview-header"
                    style={{ background: colors.header }}
                  >
                    <span style={{ 
                      color: themeInfo.id === 'dreamy' || themeInfo.id === 'kawaii' || themeInfo.id === 'journal' 
                        ? '#374151' 
                        : '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}>
                      November 2025
                    </span>
                  </div>
                  <div 
                    className="theme-preview-body"
                    style={{ background: colors.body }}
                  >
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="theme-preview-cell"
                        style={{ 
                          background: i === 3 ? colors.accent : colors.cell,
                          border: `1px solid ${colors.accent}20`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* 主題資訊 */}
                <div className="theme-info">
                  <h3 className="theme-name">{themeInfo.name}</h3>
                  <p className="theme-name-en">{themeInfo.nameEn}</p>
                  <p className="theme-description">{themeInfo.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemePicker;
