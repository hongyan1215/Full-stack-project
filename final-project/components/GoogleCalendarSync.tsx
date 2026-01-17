'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GoogleCalendarSyncProps {
  onSyncComplete?: () => void;
  compact?: boolean; // For sidebar use
}

const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({ onSyncComplete, compact = false }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState<boolean | null>(null); // null = checking

  // Check if user is dev user
  const isDevUser = session?.user?.email === 'dev@example.com' || session?.user?.id === 'dev-user-1';

  // Check if user is signed in with Google
  useEffect(() => {
    const checkGoogleAccount = async () => {
      if (!session?.user?.email) {
        setIsGoogleUser(false);
        return;
      }

      // If dev user, show button (for testing purposes)
      if (isDevUser) {
        setIsGoogleUser(true);
        return;
      }

      try {
        const response = await fetch('/api/google-calendar/check');
        if (response.ok) {
          const data = await response.json();
          console.log('Google account check result:', data); // Debug log
          setIsGoogleUser(data.hasGoogleAccount || false);
        } else {
          console.error('Failed to check Google account:', response.status, response.statusText);
          setIsGoogleUser(false);
        }
      } catch (error) {
        console.error('Error checking Google account:', error);
        setIsGoogleUser(false);
      }
    };

    checkGoogleAccount();
  }, [session, isDevUser]);

  const handleSync = async () => {
    if (!session?.user) {
      setMessage({ type: 'error', text: '請先登入' });
      return;
    }

    // For dev user, show a message that sync is not available
    if (isDevUser) {
      setMessage({ type: 'error', text: 'Dev user 無法同步 Google Calendar，請使用 Google 帳號登入' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    if (!isGoogleUser) {
      setMessage({ type: 'error', text: '請使用 Google 帳號登入以使用此功能' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '同步失敗');
      }

      setMessage({
        type: 'success',
        text: `成功同步 ${data.imported} 個事件（共 ${data.total} 個）`,
      });

      // Call callback to refresh calendar
      if (onSyncComplete) {
        setTimeout(() => {
          onSyncComplete();
          // Clear message after 3 seconds
          setTimeout(() => setMessage(null), 3000);
        }, 1000);
      } else {
        // Clear message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setMessage({
        type: 'error',
        text: error.message || '同步失敗，請確保您已使用 Google 帳號登入',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if not logged in
  if (!session?.user) {
    return null;
  }

  // Show loading state while checking
  if (isGoogleUser === null) {
    return (
      <div className="google-calendar-sync">
        <button
          className={compact ? "google-sync-btn compact" : "google-sync-btn"}
          disabled={true}
          style={{ opacity: 0.6 }}
        >
          <svg className="filter-option-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <span className="filter-option-label">檢查中...</span>
        </button>
      </div>
    );
  }

  // Only show button if user has Google account
  // But also show if check failed (might be a temporary issue)
  // The sync endpoint will handle the actual validation
  if (isGoogleUser === false) {
    // Don't show button if definitely not a Google user
    return null;
  }

  return (
    <div className="google-calendar-sync">
      <button
        className={compact ? "google-sync-btn compact" : "google-sync-btn"}
        onClick={handleSync}
        disabled={isLoading}
        title="從 Google Calendar 同步事件"
      >
        {isLoading ? (
          <>
            <svg className="sync-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
            </svg>
            <span className="filter-option-label">同步中...</span>
          </>
        ) : (
          <>
            <svg className="filter-option-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
            </svg>
            <span className="filter-option-label">同步 Google</span>
          </>
        )}
      </button>
      {message && (
        <div className={`sync-message sync-message-${message.type} ${compact ? 'compact' : ''}`}>
          {message.text}
        </div>
      )}
      <style jsx>{`
        .google-calendar-sync {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .google-sync-btn {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-cell, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          color: var(--text-primary, #1e293b);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .google-sync-btn:hover:not(:disabled) {
          background: var(--bg-cell-hover, #f1f5f9);
          border-color: var(--border-medium, #cbd5e1);
          transform: translateX(2px);
        }

        .google-sync-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-sync-btn svg {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }

        .filter-option-icon {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sync-spinner {
          display: inline-block;
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }

        .sync-message {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          white-space: normal;
          word-wrap: break-word;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .sync-message.compact {
          font-size: 12px;
          padding: 6px 10px;
        }

        .sync-message-success {
          background: #10b981;
          color: white;
        }

        .sync-message-error {
          background: #ef4444;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default GoogleCalendarSync;

