'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { CalendarEvent } from '../types/calendar';

interface ScheduledNotification {
  eventId: string;
  timeoutId: NodeJS.Timeout;
  notificationTime: number;
}

export function useNotifications() {
  const scheduledNotificationsRef = useRef<Map<string, ScheduledNotification>>(new Map());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      setPermissionStatus('denied');
      return 'denied';
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    console.log('🔔 Current notification permission:', currentPermission);
    setPermissionStatus(currentPermission);

    if (currentPermission === 'granted') {
      console.log('✅ Notification permission already granted');
      return 'granted';
    }

    if (currentPermission !== 'denied') {
      try {
        console.log('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('🔔 Permission result:', permission);
        setPermissionStatus(permission);
        return permission;
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
        setPermissionStatus('denied');
        return 'denied';
      }
    }

    console.warn('⚠️ Notification permission was previously denied');
    setPermissionStatus('denied');
    return 'denied';
  }, []);

  // Send notification
  const sendNotification = useCallback((event: CalendarEvent) => {
    // Always check the actual permission status, not the state
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported in this browser');
      return;
    }

    const currentPermission = Notification.permission;
    console.log('🔔 Checking notification permission before sending:', currentPermission);
    console.log('🔔 State permission status:', permissionStatus);

    if (currentPermission !== 'granted') {
      console.warn('⚠️ Cannot send notification: permission not granted. Current permission:', currentPermission);
      console.warn('⚠️ Please allow notifications in your browser settings');
      return;
    }

    const startTime = new Date(event.start);
    const timeString = startTime.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let body = `開始時間：${timeString}`;
    if (event.location) {
      body += `\n地點：${event.location}`;
    }
    if (event.description) {
      body += `\n${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`;
    }

    try {
      console.log('📢 Sending notification for event:', event.title);
      const notification = new Notification(event.icon ? `${event.icon} ${event.title}` : event.title, {
        body,
        icon: '/favicon.ico', // You can customize this
        badge: '/favicon.ico',
        tag: `event-${event.id}`, // Prevent duplicate notifications
        requireInteraction: false,
      });

      console.log('✅ Notification sent successfully');

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('❌ Notification error:', error);
      };
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      console.error('❌ Error details:', error);
    }
  }, []);

  // Clear a specific notification
  const clearNotification = useCallback((eventId: string) => {
    const scheduled = scheduledNotificationsRef.current.get(eventId);
    if (scheduled) {
      clearTimeout(scheduled.timeoutId);
      scheduledNotificationsRef.current.delete(eventId);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    scheduledNotificationsRef.current.forEach((scheduled) => {
      clearTimeout(scheduled.timeoutId);
    });
    scheduledNotificationsRef.current.clear();
  }, []);

  // Schedule a notification for an event
  const scheduleNotification = useCallback((event: CalendarEvent, now: number) => {
    // Clear existing notification for this event if any
    clearNotification(event.id);

    if (!event.enableNotification || !event.start) {
      return;
    }

    const eventStartTime = new Date(event.start).getTime();
    if (eventStartTime <= now) {
      // Event has already started or passed
      return;
    }

    const minutesBefore = event.notificationMinutesBefore || 15;
    const notificationTime = eventStartTime - (minutesBefore * 60 * 1000);

    // Only schedule if notification time is in the future and within 24 hours
    if (notificationTime > now && notificationTime <= now + 24 * 60 * 60 * 1000) {
      const timeUntilNotification = notificationTime - now;
      const timeoutId = setTimeout(() => {
        sendNotification(event);
        scheduledNotificationsRef.current.delete(event.id);
      }, timeUntilNotification);

      scheduledNotificationsRef.current.set(event.id, {
        eventId: event.id,
        timeoutId,
        notificationTime,
      });

      const minutesUntil = Math.round(timeUntilNotification / 60000);
      const secondsUntil = Math.round((timeUntilNotification % 60000) / 1000);
      console.log(`✅ Scheduled notification for "${event.title}" in ${minutesUntil} minutes ${secondsUntil} seconds (at ${new Date(notificationTime).toLocaleString()})`);
    } else {
      console.log(`⏭️ Skipping notification for "${event.title}": notification time is ${notificationTime > now ? 'too far in the future' : 'in the past'}`);
    }
  }, [sendNotification, clearNotification]);

  // Check and schedule notifications for all events
  const checkAndScheduleNotifications = useCallback((events: CalendarEvent[]) => {
    // Always check the actual permission status
    if (!('Notification' in window)) {
      console.log('⏸️ Notifications not supported');
      return;
    }

    const currentPermission = Notification.permission;
    console.log('🔍 Checking notifications for', events.length, 'events. Permission status:', currentPermission);
    
    if (currentPermission !== 'granted') {
      console.log('⏸️ Skipping notification scheduling: permission not granted. Current:', currentPermission);
      return;
    }

    const now = Date.now();
    console.log('🕐 Current time:', new Date(now).toLocaleString());

    // Clear notifications for events that no longer exist or have notification disabled
    scheduledNotificationsRef.current.forEach((scheduled, eventId) => {
      const event = events.find(e => e.id === eventId);
      if (!event || !event.enableNotification) {
        console.log('🗑️ Clearing notification for event:', eventId);
        clearNotification(eventId);
      }
    });

    // Find events with notifications enabled
    const eventsWithNotifications = events.filter(e => e.enableNotification && e.eventType === 'event');
    console.log('📅 Found', eventsWithNotifications.length, 'events with notifications enabled');

    // Schedule notifications for upcoming events
    eventsWithNotifications.forEach((event) => {
      scheduleNotification(event, now);
    });
  }, [scheduleNotification, clearNotification]);

  // Initialize: check permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      console.log('🔔 Initial notification permission:', currentPermission);
      setPermissionStatus(currentPermission);
      
      // Log if notifications are supported
      console.log('🔔 Notification API supported:', true);
      console.log('🔔 Notification.permission:', currentPermission);
      
      // Test if we can create a notification object (but don't show it)
      if (currentPermission === 'granted') {
        console.log('✅ Notifications are enabled and ready');
      } else if (currentPermission === 'default') {
        console.log('⚠️ Notification permission not yet requested');
      } else {
        console.warn('❌ Notification permission was denied');
      }
    } else {
      console.warn('❌ Notification API is not supported in this browser');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllNotifications();
    };
  }, [clearAllNotifications]);

  return {
    requestPermission,
    checkAndScheduleNotifications,
    clearAllNotifications,
    clearNotification,
    sendNotification,
    permissionStatus,
  };
}

