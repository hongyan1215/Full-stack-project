'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useCalendar } from '../hooks/useCalendar';
import { useDiary } from '../hooks/useDiary';
import { useNotifications } from '../hooks/useNotifications';
import CalendarHeader from './CalendarHeader';
import FilterSidebar from './FilterSidebar';
import MonthView from './MonthView';
import WeekTimeSlotView from './WeekTimeSlotView';
import DayTimeSlotView from './DayTimeSlotView';
import EventModal from './EventModal';
import TimeGridManager from './TimeGridManager';
import AIAssistant from './AIAssistant';
import CategoryManager from './CategoryManager';
import DiaryEditor from './DiaryEditor';
import LoginPrompt from './LoginPrompt';
import ShareCalendarModal from './ShareCalendarModal';
import OnboardingTour from './OnboardingTour';
import { CalendarEvent, CalendarCell, DiaryEntry, CalendarShareConfig } from '../types/calendar';
import { exportCalendarAsImage, exportCalendarAsPDF } from '../utils/exportCalendar';
import { getCalendarDays, isSameMonth, formatDate } from '../utils/dateUtils';
import '../styles/Calendar.css';

const Calendar: React.FC = () => {
  const {
    state,
    navigate,
    setView,
    setSelectedDate,
    addEvent,
    updateEvent,
    deleteEvent,
    monthCells,
    weekDays,
    dayTimeSlots,
    currentTimeGrid,
    setCurrentTimeGrid,
    allTimeGrids,
    addCustomTimeGrid,
    updateCustomTimeGrid,
    deleteCustomTimeGrid,
    showBreakPeriods,
    setShowBreakPeriods,
    // Event type filters
    showOneTimeEvents,
    setShowOneTimeEvents,
    showBaseLayer,
    setShowBaseLayer,
    categories,
    categoryVisibility,
    toggleCategory,
    updateCategory,
    refreshEvents,
  } = useCalendar();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEventState] = useState<CalendarEvent | null>(null);
  const [isTimeGridManagerOpen, setIsTimeGridManagerOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [selectedDiaryDate, setSelectedDiaryDate] = useState<Date | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [hasGoogleAccount, setHasGoogleAccount] = useState(false);

  // Diary hook
  const { diaryEntries, loadDiaryEntries, getDiaryEntry, refreshDiary } = useDiary();

  // Notifications hook
  const { checkAndScheduleNotifications, requestPermission, permissionStatus, sendNotification } = useNotifications();

  // Check if current user is dev user
  const { data: session } = useSession();
  const isDevUser = session?.user?.email === 'dev@example.com' || session?.user?.id === 'dev-user-1';
  
  // Show login prompt if not logged in
  const showLoginPrompt = !session;

  // Check onboarding status and Google account status
  useEffect(() => {
    if (!session) return;

    const checkOnboardingStatus = async () => {
      try {
        // Check onboarding status
        const onboardingResponse = await fetch('/api/user/onboarding');
        const onboardingData = await onboardingResponse.json();
        
        // Check Google account status (for conditional step)
        const googleResponse = await fetch('/api/google-calendar/check');
        const googleData = await googleResponse.json();
        
        setHasGoogleAccount(googleData.hasGoogleAccount || false);
        
        // Show tour if user hasn't completed onboarding
        if (!onboardingData.hasCompletedOnboarding) {
          setShowOnboardingTour(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [session]);

  // Set CSS variable for header offset (used for content padding)
  useEffect(() => {
    if (typeof document !== 'undefined' && headerHeight > 0) {
      document.documentElement.style.setProperty(
        '--calendar-header-offset',
        `${headerHeight}px`
      );
    }
  }, [headerHeight]);

  // Load diary entries for the current month
  useEffect(() => {
    const startDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
    const endDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0);
    loadDiaryEntries(startDate, endDate);
  }, [state.currentDate, loadDiaryEntries]);

  // Check and schedule notifications when events change
  useEffect(() => {
    if (state.events.length > 0) {
      checkAndScheduleNotifications(state.events);
    }
  }, [state.events, checkAndScheduleNotifications]);

  // Request notification permission on mount if not yet granted or denied
  useEffect(() => {
    // Request permission after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      if (permissionStatus === 'default') {
        console.log('🔔 Requesting notification permission...');
        requestPermission().then((permission) => {
          console.log('🔔 Permission request completed:', permission);
        });
      } else {
        console.log('🔔 Permission status:', permissionStatus);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [requestPermission, permissionStatus]);

  // Merge diary entries into month cells
  const monthCellsWithDiary = useMemo((): CalendarCell[] => {
    return monthCells.map(cell => ({
      ...cell,
      diaryEntry: getDiaryEntry(cell.date),
    }));
  }, [monthCells, diaryEntries, getDiaryEntry]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Open diary editor when double-clicking or clicking with a modifier key
    // For now, we'll add a separate button/action for opening diary
  };

  const handleOpenDiary = (date: Date) => {
    console.log('📔 [Diary] Opening diary editor for date:', date.toISOString().split('T')[0]);
    const existingEntry = getDiaryEntry(date);
    console.log('📔 [Diary] Existing entry:', existingEntry ? 'found' : 'not found');
    setSelectedDiaryDate(date);
    setIsDiaryOpen(true);
  };

  const handleSaveDiary = async (entry: DiaryEntry) => {
    console.log('📔 [Diary] Diary saved, refreshing entries for current month');
    // Refresh diary entries after saving
    const startDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
    const endDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0);
    await refreshDiary(startDate, endDate);
  };

  const handleDeleteDiary = async (entryId: string) => {
    console.log('📔 [Diary] Diary deleted, refreshing entries for current month:', entryId);
    // Refresh diary entries after deleting
    const startDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
    const endDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0);
    await refreshDiary(startDate, endDate);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventState(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedEventState(null);
    setIsModalOpen(true);
  };

  const handleTimeSlotClick = (timeSlot: any, day?: any) => {
    const eventDate = day ? day.date : state.currentDate;
    const newEvent: CalendarEvent = {
      id: '',
      title: '',
      start: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 
        timeSlot.startDate.getHours(), timeSlot.startDate.getMinutes()),
      end: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 
        timeSlot.endDate.getHours(), timeSlot.endDate.getMinutes()),
      description: '',
      eventType: 'event', // One-time events created from calendar
      category: 'category-1', // Default category
    };
    
    setSelectedEventState(newEvent);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEventState(null);
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    if (selectedEvent && selectedEvent.id) {
      updateEvent(event.id, event);
    } else {
      addEvent(event);
    }
    handleCloseModal();
    // Notifications will be re-scheduled automatically when state.events updates via useEffect
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    // Notifications will be re-scheduled automatically when state.events updates via useEffect
  };

  const handleShare = async (config: CalendarShareConfig) => {
    if (config.shareMethod === 'image') {
      try {
        await exportCalendarAsImage('calendar-export-target', `calendar-${formatDate(state.currentDate, 'yyyy-MM')}.png`);
        setIsShareModalOpen(false);
      } catch (error) {
        console.error('Error exporting image:', error);
        alert('導出圖片失敗，請確保已安裝 html2canvas 套件');
      }
    } else if (config.shareMethod === 'pdf') {
      try {
        await exportCalendarAsPDF('calendar-export-target', `calendar-${formatDate(state.currentDate, 'yyyy-MM')}.pdf`);
        setIsShareModalOpen(false);
      } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('導出PDF失敗，請確保已安裝 jspdf 和 html2canvas 套件');
      }
    }
    // public-link is handled in ShareCalendarModal
  };

  const renderView = () => {
    switch (state.view) {
      case 'month':
        return (
          <MonthView
            cells={monthCellsWithDiary}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            showBaseLayer={showBaseLayer}
            categories={categories}
            onDiaryClick={handleOpenDiary}
          />
        );
        case 'week':
          return (
            <WeekTimeSlotView
              days={weekDays}
              timeSlots={dayTimeSlots}
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              showBaseLayer={showBaseLayer}
              categories={categories}
            />
          );
        case 'day':
          return (
            <DayTimeSlotView
              timeSlots={dayTimeSlots}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              showBaseLayer={showBaseLayer}
              categories={categories}
            />
          );
      default:
        return null;
    }
  };

  // Add class to body when sidebar is present (for Safari compatibility)
  // Also set CSS variable directly for Safari compatibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('has-sidebar');
      // Set CSS variable directly on document root for Safari
      document.documentElement.style.setProperty('--calendar-max-width', '1600px');
      document.documentElement.style.setProperty('--sidebar-width', '240px');
      document.documentElement.style.setProperty('--sidebar-width-collapsed', '60px');
      return () => {
        document.body.classList.remove('has-sidebar');
      };
    }
  }, []);

  return (
    <>
      {showLoginPrompt && <LoginPrompt />}
      {showOnboardingTour && session && (
        <OnboardingTour
          onComplete={() => setShowOnboardingTour(false)}
          hasGoogleAccount={hasGoogleAccount}
          onViewChange={setView}
        />
      )}
      <FilterSidebar
        showBaseLayer={showBaseLayer}
        onToggleBaseLayer={() => setShowBaseLayer(!showBaseLayer)}
        showOneTimeEvents={showOneTimeEvents}
        onManageCategories={() => {
          console.log('Opening category manager');
          setIsCategoryManagerOpen(true);
        }}
        onToggleOneTimeEvents={() => setShowOneTimeEvents(!showOneTimeEvents)}
        categories={categories}
        categoryVisibility={categoryVisibility}
        onToggleCategory={toggleCategory}
        view={state.view}
        currentTimeGrid={currentTimeGrid}
        onTimeGridChange={setCurrentTimeGrid}
        onManageTimeGrids={() => setIsTimeGridManagerOpen(true)}
        allTimeGrids={allTimeGrids}
        showBreakPeriods={showBreakPeriods}
        onToggleBreakPeriods={() => setShowBreakPeriods(!showBreakPeriods)}
        onSyncComplete={refreshEvents}
      />
      <CalendarHeader
        currentDate={state.currentDate}
        view={state.view}
        onNavigate={navigate}
        onViewChange={setView}
        onHeaderHeightChange={setHeaderHeight}
        weekDays={weekDays}
        timeSlots={dayTimeSlots}
        onShareClick={() => setIsShareModalOpen(true)}
        onShowOnboarding={session ? () => setShowOnboardingTour(true) : undefined}
      />
      <div className="calendar" id="calendar-export-target">
        <div className="calendar-content">
          {renderView()}
        </div>
        <div className="calendar-footer">
          <button
            className="btn btn-primary full-width-button"
            onClick={handleCreateEvent}
          >
            + Add Event
          </button>
          {/* Test notification button - only visible to dev user */}
          {isDevUser && (
            <button
              className="btn btn-secondary full-width-button"
              onClick={async () => {
                console.log('🔔 ========== TEST NOTIFICATION ==========');
                console.log('🔔 Test notification button clicked');
                
                // Check if Notification API is available
                if (!('Notification' in window)) {
                  console.error('❌ Notification API is not supported in this browser');
                  alert('通知功能不支援此瀏覽器');
                  return;
                }
                
                const currentPermission = Notification.permission;
                console.log('🔔 Notification.permission:', currentPermission);
                console.log('🔔 typeof Notification:', typeof Notification);
                console.log('🔔 Notification constructor:', Notification);
                
                // Try to send notification directly first (bypass our function)
                if (currentPermission === 'granted') {
                  try {
                    console.log('🔔 Attempting to send test notification directly...');
                    const directNotification = new Notification('直接測試通知', {
                      body: '這是一個直接測試通知',
                      icon: '/favicon.ico',
                      tag: 'direct-test',
                    });
                    console.log('✅ Direct notification created:', directNotification);
                    
                    directNotification.onclick = () => {
                      console.log('🔔 Direct notification clicked');
                      directNotification.close();
                    };
                    
                    directNotification.onshow = () => {
                      console.log('✅ Direct notification shown');
                    };
                    
                    directNotification.onerror = (error) => {
                      console.error('❌ Direct notification error:', error);
                    };
                    
                    setTimeout(() => directNotification.close(), 5000);
                    
                    // Also test our function
                    console.log('🔔 Now testing our sendNotification function...');
                    const testEvent: CalendarEvent = {
                      id: 'test-notification',
                      title: '測試通知（函數）',
                      start: new Date(),
                      end: new Date(Date.now() + 60 * 60 * 1000),
                      eventType: 'event',
                      enableNotification: true,
                      notificationMinutesBefore: 0,
                    };
                    
                    sendNotification(testEvent);
                  } catch (error) {
                    console.error('❌ Error creating notification:', error);
                    alert('建立通知時發生錯誤，請檢查控制台');
                  }
                } else if (currentPermission === 'default') {
                  console.log('🔔 Permission not yet requested, requesting now...');
                  try {
                    const permission = await Notification.requestPermission();
                    console.log('🔔 Permission result:', permission);
                    if (permission === 'granted') {
                      // Try again after permission is granted
                      setTimeout(() => {
                        const testEvent: CalendarEvent = {
                          id: 'test-notification',
                          title: '測試通知',
                          start: new Date(),
                          end: new Date(Date.now() + 60 * 60 * 1000),
                          eventType: 'event',
                          enableNotification: true,
                          notificationMinutesBefore: 0,
                        };
                        sendNotification(testEvent);
                      }, 100);
                    } else {
                      alert(`通知權限被拒絕: ${permission}`);
                    }
                  } catch (error) {
                    console.error('❌ Error requesting permission:', error);
                    alert('請求通知權限時發生錯誤');
                  }
                } else {
                  console.warn('❌ Notification permission was denied');
                  alert('通知權限已被拒絕，請在瀏覽器設定中允許通知');
                }
                
                console.log('🔔 ========================================');
              }}
              style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}
            >
              🔔 測試通知
            </button>
          )}
        </div>
      </div>
      
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categories={categories}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={state.selectedDate || state.currentDate}
      />
      
      {isCategoryManagerOpen && (
        <CategoryManager
          categories={categories}
          onUpdateCategory={updateCategory}
          onClose={() => {
            console.log('Closing category manager');
            setIsCategoryManagerOpen(false);
          }}
        />
      )}
      
      <TimeGridManager
        timeGrids={allTimeGrids}
        currentTimeGrid={currentTimeGrid}
        onTimeGridChange={setCurrentTimeGrid}
        onAddTimeGrid={addCustomTimeGrid}
        onUpdateTimeGrid={updateCustomTimeGrid}
        onDeleteTimeGrid={deleteCustomTimeGrid}
        isOpen={isTimeGridManagerOpen}
        onClose={() => setIsTimeGridManagerOpen(false)}
      />

      {/* AI Assistant FAB */}
      <button 
        className="ai-fab"
        onClick={() => setIsAIOpen(true)}
        title="AI 事件助理"
        data-onboarding="ai-assistant"
      >
        🤖
      </button>

      <AIAssistant
        onCreateEvent={addEvent}
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        categories={categories}
      />

      {/* Diary Editor */}
      {isDiaryOpen && selectedDiaryDate && (
        <DiaryEditor
          date={selectedDiaryDate}
          entry={getDiaryEntry(selectedDiaryDate)}
          isOpen={isDiaryOpen}
          onClose={() => {
            setIsDiaryOpen(false);
            setSelectedDiaryDate(null);
          }}
          onSave={handleSaveDiary}
          onDelete={handleDeleteDiary}
        />
      )}

      <ShareCalendarModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentDate={state.currentDate}
        categories={categories}
        onShare={handleShare}
      />
    </>
  );
};

export default Calendar;
