'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { DiaryEntry, MoodType } from '../types/calendar';
import { getLocalDateKey } from '../utils/dateUtils';

export function useDiary() {
  const { data: session } = useSession();
  const userId = session?.user?.email || 'guest';
  const [diaryEntries, setDiaryEntries] = useState<Map<string, DiaryEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Load diary entries for a date range
  const loadDiaryEntries = useCallback(async (startDate: Date, endDate: Date) => {
    console.log('📔 [Diary] Loading diary entries:', {
      userId,
      startDate: getLocalDateKey(startDate),
      endDate: getLocalDateKey(endDate),
    });
    
    setIsLoading(true);
    try {
      // For guest users, load from localStorage instead of API
      if (userId === 'guest') {
        console.log('📔 [Diary] Guest user - loading from localStorage');
        if (typeof window !== 'undefined') {
          const savedEntries = localStorage.getItem(`diary-entries-${userId}`);
          if (savedEntries) {
            try {
              const entries: DiaryEntry[] = JSON.parse(savedEntries);
              console.log('📔 [Diary] Found entries in localStorage:', entries.length);
              
              const entriesMap = new Map<string, DiaryEntry>();
              
              // Filter entries within the date range
              entries.forEach((entry, index) => {
                console.log(`📔 [Diary] Processing entry ${index + 1}:`, {
                  rawDate: entry.date,
                  rawDateType: typeof entry.date,
                  rawDateString: String(entry.date),
                });
                
                const entryDate = new Date(entry.date);
                console.log(`📔 [Diary] Parsed date:`, {
                  isoString: entryDate.toISOString(),
                  localString: entryDate.toString(),
                  utcDate: entryDate.toUTCString(),
                  getTime: entryDate.getTime(),
                  getFullYear: entryDate.getFullYear(),
                  getMonth: entryDate.getMonth(),
                  getDate: entryDate.getDate(),
                  getUTCFullYear: entryDate.getUTCFullYear(),
                  getUTCMonth: entryDate.getUTCMonth(),
                  getUTCDate: entryDate.getUTCDate(),
                  timezoneOffset: entryDate.getTimezoneOffset(),
                });
                
                const dateKey = getLocalDateKey(entryDate);
                console.log(`📔 [Diary] Date key generated (local):`, dateKey);
                
                if (entryDate >= startDate && entryDate <= endDate) {
                  const parsedEntry = {
                    ...entry,
                    date: new Date(entry.date),
                    createdAt: new Date(entry.createdAt),
                    updatedAt: new Date(entry.updatedAt),
                  };
                  console.log(`📔 [Diary] Entry added to map:`, {
                    dateKey,
                    entryDate: parsedEntry.date.toISOString(),
                    entryDateLocal: parsedEntry.date.toString(),
                  });
                  entriesMap.set(dateKey, parsedEntry);
                } else {
                  console.log(`📔 [Diary] Entry filtered out (outside date range)`);
                }
              });

              console.log('📔 [Diary] Loaded entries for date range:', entriesMap.size);
              setDiaryEntries(entriesMap);
            } catch (error) {
              console.error('❌ [Diary] Error parsing diary entries from localStorage:', error);
              setDiaryEntries(new Map());
            }
          } else {
            console.log('📔 [Diary] No entries found in localStorage');
            setDiaryEntries(new Map());
          }
        }
        setIsLoading(false);
        return;
      }

      // For authenticated users, fetch from API
      const start = getLocalDateKey(startDate);
      const end = getLocalDateKey(endDate);
      
      console.log('📔 [Diary] Fetching from API:', { start, end });
      
      const response = await fetch(`/api/diary?startDate=${start}&endDate=${end}`);
      if (!response.ok) {
        // Don't throw error, just log and return empty map
        if (response.status === 401) {
          console.warn('⚠️ [Diary] Unauthorized: Diary entries require authentication');
        } else {
          console.warn('⚠️ [Diary] Failed to fetch diary entries:', response.status, response.statusText);
        }
        setDiaryEntries(new Map());
        setIsLoading(false);
        return;
      }

      const entries: DiaryEntry[] = await response.json();
      console.log('📔 [Diary] Received entries from API:', entries.length);
      
      const entriesMap = new Map<string, DiaryEntry>();
      
      entries.forEach((entry, index) => {
        console.log(`📔 [Diary] Processing API entry ${index + 1}:`, {
          rawDate: entry.date,
          rawDateType: typeof entry.date,
          rawDateString: String(entry.date),
          entryId: entry.id,
        });
        
        const entryDate = new Date(entry.date);
        console.log(`📔 [Diary] Parsed API date:`, {
          isoString: entryDate.toISOString(),
          localString: entryDate.toString(),
          utcDate: entryDate.toUTCString(),
          getTime: entryDate.getTime(),
          getFullYear: entryDate.getFullYear(),
          getMonth: entryDate.getMonth(),
          getDate: entryDate.getDate(),
          getUTCFullYear: entryDate.getUTCFullYear(),
          getUTCMonth: entryDate.getUTCMonth(),
          getUTCDate: entryDate.getUTCDate(),
          timezoneOffset: entryDate.getTimezoneOffset(),
        });
        
        const dateKey = entry.dateKey || getLocalDateKey(entryDate);
        console.log(`📔 [Diary] API date key generated (local):`, dateKey);
        
        const parsedEntry = {
          ...entry,
          date: entryDate,
          dateKey,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        };
        
        console.log(`📔 [Diary] API entry added to map:`, {
          dateKey,
          entryDate: parsedEntry.date.toISOString(),
          entryDateLocal: parsedEntry.date.toString(),
        });
        
        entriesMap.set(dateKey, parsedEntry);
      });

      console.log('📔 [Diary] Successfully loaded entries:', entriesMap.size);
      setDiaryEntries(entriesMap);
    } catch (error) {
      // Silently handle errors for guest users or network issues
      console.error('❌ [Diary] Error loading diary entries:', error);
      setDiaryEntries(new Map());
    } finally {
      setIsLoading(false);
      console.log('📔 [Diary] Loading complete');
    }
  }, [userId]);

  // Get diary entry for a specific date
  const getDiaryEntry = useCallback((date: Date): DiaryEntry | null => {
    console.log('📔 [Diary] getDiaryEntry called with date:', {
      isoString: date.toISOString(),
      localString: date.toString(),
      getFullYear: date.getFullYear(),
      getMonth: date.getMonth(),
      getDate: date.getDate(),
      getUTCFullYear: date.getUTCFullYear(),
      getUTCMonth: date.getUTCMonth(),
      getUTCDate: date.getUTCDate(),
    });
    
    const dateKey = getLocalDateKey(date);
    console.log('📔 [Diary] Looking up with date key:', dateKey);
    console.log('📔 [Diary] Available keys in map:', Array.from(diaryEntries.keys()));
    
    const entry = diaryEntries.get(dateKey) || null;
    if (entry) {
      console.log('📔 [Diary] Found entry:', {
        dateKey,
        entryDate: entry.date.toISOString(),
        entryDateLocal: entry.date.toString(),
        entryDateUTC: entry.date.toUTCString(),
        entryId: entry.id,
      });
    } else {
      console.log('📔 [Diary] No entry found for date key:', dateKey);
    }
    return entry;
  }, [diaryEntries]);

  // Refresh diary entries
  const refreshDiary = useCallback(async (startDate: Date, endDate: Date) => {
    console.log('📔 [Diary] Refreshing diary entries');
    await loadDiaryEntries(startDate, endDate);
  }, [loadDiaryEntries]);

  return {
    diaryEntries,
    isLoading,
    loadDiaryEntries,
    getDiaryEntry,
    refreshDiary,
  };
}

