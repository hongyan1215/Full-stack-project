'use client';

import React, { useState } from 'react';
import { CalendarShareConfig, ShareScope, ShareVisibility, ShareMethod, Category } from '../types/calendar';
import { formatDate } from '../utils/dateUtils';

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  categories?: Category[];
  onShare: (config: CalendarShareConfig) => void;
}

const ShareCalendarModal: React.FC<ShareCalendarModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  categories = [],
  onShare,
}) => {
  const [shareScope, setShareScope] = useState<ShareScope>('single-month');
  const [startDate, setStartDate] = useState<string>(
    formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), "yyyy-MM-dd")
  );
  const [shareVisibility, setShareVisibility] = useState<ShareVisibility>('all-events');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [shareMethod, setShareMethod] = useState<ShareMethod>('public-link');
  // Fixed to 3 days expiration
  const expiresInDays = 3;
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Initialize dates based on current month
  React.useEffect(() => {
    if (shareScope === 'single-month') {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      setStartDate(formatDate(firstDay, "yyyy-MM-dd"));
      setEndDate(formatDate(lastDay, "yyyy-MM-dd"));
    }
  }, [shareScope, currentDate]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleGenerateShare = async () => {
    setError('');
    setIsGenerating(true);

    try {
      const config: CalendarShareConfig = {
        shareScope,
        shareVisibility,
        shareMethod,
        categoryIds: shareVisibility === 'category-filter' ? selectedCategoryIds : undefined,
        month: shareScope === 'single-month' ? currentDate.getMonth() + 1 : undefined,
        year: shareScope === 'single-month' ? currentDate.getFullYear() : undefined,
        startDate: shareScope === 'date-range' ? new Date(startDate) : undefined,
        endDate: shareScope === 'date-range' ? new Date(endDate) : undefined,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      };

      // Validate date range
      if (shareScope === 'date-range') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          setError('結束日期必須晚於開始日期');
          setIsGenerating(false);
          return;
        }
      }

      // Validate category selection
      if (shareVisibility === 'category-filter' && selectedCategoryIds.length === 0) {
        setError('請至少選擇一個類別');
        setIsGenerating(false);
        return;
      }

      // If shareMethod is image or pdf, handle export directly
      if (shareMethod === 'image' || shareMethod === 'pdf') {
        // Export will be handled by the parent component
        // No expiration needed for exports
        const exportConfig = { ...config, expiresAt: undefined };
        onShare(exportConfig);
        setIsGenerating(false);
        return;
      }

      // If shareMethod is public-link, create share via API
      // expiresAt will be set to 3 days by the API regardless of what we send
      const response = await fetch('/api/calendar/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '創建分享失敗');
      }

      const data = await response.json();
      const fullShareLink = `${window.location.origin}/share/${data.shareId}`;
      setShareLink(fullShareLink);

      // Try to copy to clipboard, but don't fail if it doesn't work
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fullShareLink);
          setError('');
        } else {
          // Fallback: clipboard API not available
          console.warn('Clipboard API not available');
        }
      } catch (err) {
        // Clipboard access denied or not available - that's okay, user can manually copy
        console.warn('Failed to copy to clipboard (user can manually copy):', err);
        setError('');
      }
    } catch (err: any) {
      setError(err.message || '發生錯誤');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink);
        setError('');
        return;
      }
      
      // Fallback: use execCommand for older browsers
      const input = document.createElement('input');
      input.value = shareLink;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(input);
        if (successful) {
          setError('');
        } else {
          setError('複製失敗，請手動選取並複製連結');
        }
      } catch (err) {
        document.body.removeChild(input);
        setError('複製失敗，請手動選取並複製連結');
      }
    } catch (err) {
      setError('複製失敗，請手動選取並複製連結');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal" onClick={onClose}>
      <div className="event-modal-content share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2 className="event-modal-title">分享月曆</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="share-modal-body">
          {/* Share Scope */}
          <div className="form-group">
            <label className="form-label">分享範圍</label>
            <div className="share-options-group">
              <label className="share-option">
                <input
                  type="radio"
                  name="shareScope"
                  value="single-month"
                  checked={shareScope === 'single-month'}
                  onChange={(e) => setShareScope(e.target.value as ShareScope)}
                />
                <span>單個月份（當前月份）</span>
              </label>
              <label className="share-option">
                <input
                  type="radio"
                  name="shareScope"
                  value="date-range"
                  checked={shareScope === 'date-range'}
                  onChange={(e) => setShareScope(e.target.value as ShareScope)}
                />
                <span>日期範圍</span>
              </label>
              <label className="share-option">
                <input
                  type="radio"
                  name="shareScope"
                  value="all-events"
                  checked={shareScope === 'all-events'}
                  onChange={(e) => setShareScope(e.target.value as ShareScope)}
                />
                <span>所有事件</span>
              </label>
            </div>
          </div>

          {/* Date Range Input */}
          {shareScope === 'date-range' && (
            <div className="form-group">
              <div className="share-date-range-inputs">
                <div>
                  <label className="form-label" htmlFor="startDate">開始日期</label>
                  <input
                    id="startDate"
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="endDate">結束日期</label>
                  <input
                    id="endDate"
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Share Visibility */}
          <div className="form-group">
            <label className="form-label">分享內容</label>
            <div className="share-options-group">
              <label className="share-option">
                <input
                  type="radio"
                  name="shareVisibility"
                  value="all-events"
                  checked={shareVisibility === 'all-events'}
                  onChange={(e) => setShareVisibility(e.target.value as ShareVisibility)}
                />
                <span>所有事件（包括所有詳情）</span>
              </label>
              <label className="share-option">
                <input
                  type="radio"
                  name="shareVisibility"
                  value="public-only"
                  checked={shareVisibility === 'public-only'}
                  onChange={(e) => setShareVisibility(e.target.value as ShareVisibility)}
                />
                <span>僅公開事件</span>
              </label>
              <label className="share-option">
                <input
                  type="radio"
                  name="shareVisibility"
                  value="category-filter"
                  checked={shareVisibility === 'category-filter'}
                  onChange={(e) => setShareVisibility(e.target.value as ShareVisibility)}
                />
                <span>特定類別</span>
              </label>
              <label className="share-option">
                <input
                  type="radio"
                  name="shareVisibility"
                  value="time-only"
                  checked={shareVisibility === 'time-only'}
                  onChange={(e) => setShareVisibility(e.target.value as ShareVisibility)}
                />
                <span>僅時間信息（不含描述等詳情）</span>
              </label>
            </div>
          </div>

          {/* Category Selection */}
          {shareVisibility === 'category-filter' && (
            <div className="form-group">
              <label className="form-label">選擇類別</label>
              <div className="share-category-list">
                {categories.filter(cat => {
                  const match = cat.id.match(/^category-(\d+)$/);
                  if (!match) return false;
                  const num = parseInt(match[1]);
                  return num >= 1 && num <= 8;
                }).map(category => (
                  <label key={category.id} className="share-category-item">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                    />
                    <span
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: category.color,
                        marginLeft: '0.5rem',
                        marginRight: '0.5rem',
                      }}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Share Method */}
          <div className="form-group">
            <label className="form-label">分享方式</label>
            <div className="share-options-group">
              <label className="share-option">
                <input
                  type="radio"
                  name="shareMethod"
                  value="public-link"
                  checked={shareMethod === 'public-link'}
                  onChange={(e) => setShareMethod(e.target.value as ShareMethod)}
                />
                <span>生成公開連結</span>
              </label>
              <label className="share-option">
                <input
                  type="radio"
                  name="shareMethod"
                  value="image"
                  checked={shareMethod === 'image'}
                  onChange={(e) => setShareMethod(e.target.value as ShareMethod)}
                />
                <span>導出為圖片（PNG）</span>
              </label>
              <label className="share-option">
                <input
                  type="radio"
                  name="shareMethod"
                  value="pdf"
                  checked={shareMethod === 'pdf'}
                  onChange={(e) => setShareMethod(e.target.value as ShareMethod)}
                />
                <span>導出為PDF</span>
              </label>
            </div>
          </div>

          {/* Expiration notice (only for public-link) */}
          {shareMethod === 'public-link' && (
            <div className="form-group">
              <div style={{
                padding: '0.75rem',
                background: 'var(--bg-cell)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}>
                <strong>注意：</strong>分享連結將在 <strong>3 天後過期</strong>。請在過期前使用連結。
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="share-error-message" style={{ color: '#ef4444', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Share Link Display */}
          {shareLink && (
            <div className="form-group">
              <label className="form-label">分享連結</label>
              <div className="share-link-input-wrapper">
                <input
                  type="text"
                  className="form-input share-link-input"
                  value={shareLink}
                  readOnly
                  onClick={(e) => {
                    // Select all text when clicked for easy copying
                    (e.target as HTMLInputElement).select();
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary share-link-copy-btn"
                  onClick={handleCopyLink}
                >
                  複製
                </button>
              </div>
              <p className="share-link-hint">
                點擊連結欄位或複製按鈕來複製連結
              </p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateShare}
            disabled={isGenerating}
          >
            {isGenerating ? '生成中...' : shareMethod === 'public-link' ? '生成分享連結' : '導出'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCalendarModal;

