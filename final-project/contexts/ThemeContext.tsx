'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 五種主題類型
export type ThemeType = 
  | 'business'    // 商務藍金風
  | 'dreamy'      // 夢幻粉藍風  
  | 'journal'     // 手帳拼貼風
  | 'modern'      // 現代簡約風
  | 'kawaii';     // 可愛童趣風

export interface ThemeInfo {
  id: ThemeType;
  name: string;
  nameEn: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export const themes: ThemeInfo[] = [
  {
    id: 'business',
    name: '商務藍金',
    nameEn: 'Business Elite',
    description: '專業優雅的深藍金配色，適合商務場合',
    preview: {
      primary: '#1e3a5f',
      secondary: '#c9a227',
      accent: '#2c5282',
      background: '#0f172a',
    },
  },
  {
    id: 'dreamy',
    name: '夢幻粉藍',
    nameEn: 'Dreamy Pastel',
    description: '柔和夢幻的粉藍漸層，溫柔療癒',
    preview: {
      primary: '#f472b6',
      secondary: '#38bdf8',
      accent: '#a78bfa',
      background: 'linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)',
    },
  },
  {
    id: 'journal',
    name: '手帳拼貼',
    nameEn: 'Journal Scrapbook',
    description: '復古手帳風格，紙質紋理與可愛貼紙',
    preview: {
      primary: '#5c4033',
      secondary: '#8b7355',
      accent: '#2d5a27',
      background: '#f5e6d3',
    },
  },
  {
    id: 'modern',
    name: '現代簡約',
    nameEn: 'Modern Minimal',
    description: '清爽專業的藍白配色，簡潔俐落',
    preview: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#f8fafc',
    },
  },
  {
    id: 'kawaii',
    name: '可愛童趣',
    nameEn: 'Kawaii Fantasy',
    description: '夢幻可愛的紫粉配色，充滿童趣',
    preview: {
      primary: '#c084fc',
      secondary: '#f472b6',
      accent: '#38bdf8',
      background: 'linear-gradient(180deg, #fae8ff 0%, #e0e7ff 50%, #ddd6fe 100%)',
    },
  },
];

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: ThemeInfo[];
  currentTheme: ThemeInfo;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'calendar-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('modern');
  const [mounted, setMounted] = useState(false);

  // 初始化：從 localStorage 讀取主題
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
    if (savedTheme && themes.some(t => t.id === savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'modern');
    }
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const currentTheme = themes.find(t => t.id === theme) || themes[3]; // 預設 modern

  // 防止 SSR 時出現閃爍
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'modern', setTheme, themes, currentTheme: themes[3] }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
