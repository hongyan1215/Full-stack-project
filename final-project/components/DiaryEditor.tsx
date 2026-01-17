'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DiaryEntry, MoodType, MOOD_CONFIG } from '../types/calendar';
import { formatDate, getLocalDateKey } from '../utils/dateUtils';

interface DiaryEditorProps {
  date: Date;
  entry?: DiaryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DiaryEntry) => void;
  onDelete?: (entryId: string) => void;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({
  date,
  entry,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.email || 'guest';
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('📔 [Diary Editor] useEffect triggered:', {
      hasEntry: !!entry,
      isOpen,
      date: date.toISOString(),
      dateLocal: date.toString(),
      dateComponents: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        utcYear: date.getUTCFullYear(),
        utcMonth: date.getUTCMonth() + 1,
        utcDay: date.getUTCDate(),
      },
    });
    
    if (entry) {
      console.log('📔 [Diary Editor] Entry data:', {
        id: entry.id,
        rawDate: entry.date,
        dateType: typeof entry.date,
        dateISO: entry.date instanceof Date ? entry.date.toISOString() : 'not a Date',
        dateLocal: entry.date instanceof Date ? entry.date.toString() : 'not a Date',
        dateUTC: entry.date instanceof Date ? entry.date.toUTCString() : 'not a Date',
        dateComponents: entry.date instanceof Date ? {
          year: entry.date.getFullYear(),
          month: entry.date.getMonth() + 1,
          day: entry.date.getDate(),
          utcYear: entry.date.getUTCFullYear(),
          utcMonth: entry.date.getUTCMonth() + 1,
          utcDay: entry.date.getUTCDate(),
        } : 'not a Date',
        content: entry.content?.substring(0, 50),
      });
      
      setContent(entry.content || '');
      setMood(entry.mood);
      setTags(entry.tags || []);
    } else {
      console.log('📔 [Diary Editor] No entry, clearing form');
      setContent('');
      setMood(undefined);
      setTags([]);
    }
  }, [entry, isOpen, date]);

  const handleSave = async () => {
    if (!content.trim()) {
      console.warn('⚠️ [Diary] Save attempted with empty content');
      alert('請輸入日記內容');
      return;
    }

    console.log('📔 [Diary] Saving diary entry:', {
      isUpdate: !!entry,
      entryId: entry?.id,
      date: formatDate(date, 'yyyy-MM-dd'),
      contentLength: content.trim().length,
      hasMood: !!mood,
      tagsCount: tags.length,
      userId,
    });

    setIsLoading(true);
    try {
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      
      // For guest users, save to localStorage
      if (userId === 'guest') {
        console.log('📔 [Diary] Guest user - saving to localStorage');
        if (typeof window !== 'undefined') {
          const savedEntries = localStorage.getItem(`diary-entries-${userId}`);
          const entries: DiaryEntry[] = savedEntries ? JSON.parse(savedEntries) : [];
          console.log('📔 [Diary] Current entries in localStorage:', entries.length);
          
          const entryDate = new Date(date);
          entryDate.setHours(0, 0, 0, 0);
          
          const newEntry: DiaryEntry = {
            id: entry?.id || `diary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: entryDate,
            dateKey: formatDate(entryDate, 'yyyy-MM-dd'),
            content: content.trim(),
            mood: mood || undefined,
            tags: tags,
            userId: 'guest',
            createdAt: entry?.createdAt || new Date(),
            updatedAt: new Date(),
          };
          
          // Remove existing entry if updating
          const filteredEntries = entry 
            ? entries.filter(e => e.id !== entry.id)
            : entries.filter(e => {
                const eDate = new Date(e.date);
                eDate.setHours(0, 0, 0, 0);
                return eDate.getTime() !== entryDate.getTime();
              });
          
          // Add new/updated entry
          const updatedEntries = [...filteredEntries, newEntry];
          localStorage.setItem(`diary-entries-${userId}`, JSON.stringify(updatedEntries));
          console.log('✅ [Diary] Saved to localStorage:', {
            totalEntries: updatedEntries.length,
            entryId: newEntry.id,
          });
          
          onSave(newEntry);
          onClose();
        }
        setIsLoading(false);
        return;
      }

      // For authenticated users, save to API
      const url = entry ? `/api/diary/${entry.id}` : '/api/diary';
      const method = entry ? 'PUT' : 'POST';

      console.log('📔 [Diary] Saving to API:', { url, method });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          content: content.trim(),
          mood: mood || null,
          tags: tags,
        }),
      });

      if (!response.ok) {
        // Handle 401 gracefully
        if (response.status === 401) {
          console.warn('⚠️ [Diary] Unauthorized: Diary entries require authentication');
          alert('請先登入以保存日記');
        } else {
          console.error('❌ [Diary] Failed to save:', response.status, response.statusText);
          throw new Error('Failed to save diary entry');
        }
        setIsLoading(false);
        return;
      }

      const savedEntry = await response.json();
      console.log('✅ [Diary] Successfully saved to API:', {
        entryId: savedEntry.id,
        date: savedEntry.date,
      });
      
      onSave({
        ...savedEntry,
        date: new Date(savedEntry.date),
        dateKey: savedEntry.dateKey || getLocalDateKey(new Date(savedEntry.date)),
        createdAt: new Date(savedEntry.createdAt),
        updatedAt: new Date(savedEntry.updatedAt),
      });
      onClose();
    } catch (error) {
      console.error('❌ [Diary] Error saving diary:', error);
      alert('保存失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !onDelete) return;
    
    console.log('📔 [Diary] Delete requested for entry:', entry.id);
    
    if (!confirm('確定要刪除這篇日記嗎？')) {
      console.log('📔 [Diary] Delete cancelled by user');
      return;
    }

    console.log('📔 [Diary] Deleting diary entry:', {
      entryId: entry.id,
      date: formatDate(entry.date, 'yyyy-MM-dd'),
      userId,
    });

    setIsLoading(true);
    try {
      // For guest users, delete from localStorage
      if (userId === 'guest') {
        console.log('📔 [Diary] Guest user - deleting from localStorage');
        if (typeof window !== 'undefined') {
          const savedEntries = localStorage.getItem(`diary-entries-${userId}`);
          if (savedEntries) {
            const entries: DiaryEntry[] = JSON.parse(savedEntries);
            const beforeCount = entries.length;
            const filteredEntries = entries.filter(e => e.id !== entry.id);
            localStorage.setItem(`diary-entries-${userId}`, JSON.stringify(filteredEntries));
            console.log('✅ [Diary] Deleted from localStorage:', {
              before: beforeCount,
              after: filteredEntries.length,
            });
          }
        }
        onDelete(entry.id);
        onClose();
        setIsLoading(false);
        return;
      }

      // For authenticated users, delete from API
      console.log('📔 [Diary] Deleting from API:', entry.id);
      const response = await fetch(`/api/diary/${entry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Handle 401 gracefully
        if (response.status === 401) {
          console.warn('⚠️ [Diary] Unauthorized: Diary entries require authentication');
          alert('請先登入以刪除日記');
        } else {
          console.error('❌ [Diary] Failed to delete:', response.status, response.statusText);
          throw new Error('Failed to delete diary entry');
        }
        setIsLoading(false);
        return;
      }

      console.log('✅ [Diary] Successfully deleted from API');
      onDelete(entry.id);
      onClose();
    } catch (error) {
      console.error('❌ [Diary] Error deleting diary:', error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  const moodOptions = Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][];

  return (
    <div className="diary-editor-overlay" onClick={onClose}>
      <div className="diary-editor-container" onClick={(e) => e.stopPropagation()}>
        <div className="diary-editor-header">
          <h2 className="diary-editor-title">
            📔 {(() => {
              const formatted = formatDate(date, 'yyyy年MM月dd日');
              console.log('📔 [Diary Editor] Formatting date for title:', {
                originalDate: date.toISOString(),
                originalDateLocal: date.toString(),
                formatted,
                dateComponents: {
                  year: date.getFullYear(),
                  month: date.getMonth() + 1,
                  day: date.getDate(),
                },
              });
              return formatted;
            })()} 的日記
          </h2>
          <button className="diary-editor-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="diary-editor-content">
          {/* Mood Selection */}
          <div className="diary-mood-section">
            <label className="diary-label">今天的心情</label>
            <div className="mood-selector">
              {moodOptions.map(([moodType, config]) => (
                <button
                  key={moodType}
                  className={`mood-button ${mood === moodType ? 'selected' : ''}`}
                  onClick={() => setMood(mood === moodType ? undefined : moodType)}
                  title={config.label}
                  style={{
                    backgroundColor: mood === moodType ? config.color : 'transparent',
                    borderColor: config.color,
                  }}
                >
                  <span className="mood-emoji">{config.emoji}</span>
                  <span className="mood-label">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div className="diary-content-section">
            <label className="diary-label">日記內容</label>
            <textarea
              className="diary-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="記錄今天發生的事情、想法、感受..."
              rows={12}
            />
          </div>

          {/* Tags */}
          <div className="diary-tags-section">
            <label className="diary-label">標籤</label>
            <div className="tags-input-container">
              <input
                type="text"
                className="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入標籤後按 Enter"
              />
              <button className="tag-add-button" onClick={handleAddTag}>+</button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    {tag}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="diary-editor-footer">
          {entry && onDelete && (
            <button
              className="diary-delete-button"
              onClick={handleDelete}
              disabled={isLoading}
            >
              刪除
            </button>
          )}
          <div className="diary-footer-actions">
            <button
              className="diary-cancel-button"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              className="diary-save-button"
              onClick={handleSave}
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .diary-editor-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg-overlay, rgba(0, 0, 0, 0.6));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }

        .diary-editor-container {
          background: var(--bg-modal, #ffffff);
          border-radius: var(--radius-xl, 20px);
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
          overflow: hidden;
        }

        .diary-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-light, #e2e8f0);
        }

        .diary-editor-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
          margin: 0;
        }

        .diary-editor-close {
          background: none;
          border: none;
          color: var(--text-secondary, #475569);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          transition: color 0.2s;
        }

        .diary-editor-close svg {
          width: 20px;
          height: 20px;
        }

        .diary-editor-close:hover {
          color: var(--text-primary, #1e293b);
        }

        .diary-editor-content {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .diary-mood-section,
        .diary-content-section,
        .diary-tags-section {
          margin-bottom: 1.5rem;
        }

        .diary-tags-section:last-child {
          margin-bottom: 0;
        }

        .diary-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary, #475569);
          margin-bottom: 0.75rem;
        }

        .mood-selector {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.75rem;
        }

        .mood-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem 0.5rem;
          border: 2px solid;
          border-radius: var(--radius-md, 12px);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .mood-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }

        .mood-button.selected {
          color: white;
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }

        .mood-emoji {
          font-size: 1.5rem;
        }

        .mood-label {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .diary-textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 12px);
          font-size: 0.9375rem;
          font-family: inherit;
          color: var(--text-primary, #1e293b);
          background: var(--bg-input, #ffffff);
          resize: vertical;
          min-height: 200px;
          transition: border-color 0.2s;
        }

        .diary-textarea:focus {
          outline: none;
          border-color: var(--border-focus, #3b82f6);
          box-shadow: var(--shadow-glow, 0 0 0 3px rgba(59, 130, 246, 0.1));
        }

        .tags-input-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .tag-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 12px);
          font-size: 0.875rem;
          color: var(--text-primary, #1e293b);
          background: var(--bg-input, #ffffff);
        }

        .tag-input:focus {
          outline: none;
          border-color: var(--border-focus, #3b82f6);
        }

        .tag-add-button {
          padding: 0.5rem 1rem;
          background: var(--btn-primary, #3b82f6);
          color: white;
          border: none;
          border-radius: var(--radius-md, 12px);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .tag-add-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.05));
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: var(--bg-cell, #f8fafc);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 12px);
          font-size: 0.875rem;
          color: var(--text-primary, #1e293b);
        }

        .tag-remove {
          background: none;
          border: none;
          color: var(--text-secondary, #475569);
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
          padding: 0;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .tag-remove:hover {
          background: var(--bg-cell-hover, #f1f5f9);
          color: var(--text-primary, #1e293b);
        }

        .diary-editor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-light, #e2e8f0);
        }

        .diary-footer-actions {
          display: flex;
          gap: 0.75rem;
        }

        .diary-cancel-button,
        .diary-save-button,
        .diary-delete-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-md, 12px);
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .diary-cancel-button {
          background: var(--bg-cell, #f8fafc);
          color: var(--text-primary, #1e293b);
        }

        .diary-cancel-button:hover {
          background: var(--bg-cell-hover, #f1f5f9);
        }

        .diary-save-button {
          background: var(--btn-primary, #3b82f6);
          color: white;
        }

        .diary-save-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }

        .diary-save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .diary-delete-button {
          background: var(--btn-danger, #ef4444);
          color: white;
        }

        .diary-delete-button:hover:not(:disabled) {
          background: #dc2626;
        }

        .diary-delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default DiaryEditor;

