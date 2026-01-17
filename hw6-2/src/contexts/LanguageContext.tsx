'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getTranslations, Translations } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Chinese (zh-TW)
  const [language, setLanguageState] = useState<Language>('zh-TW');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('dashboard-language') as Language;
    if (savedLang && (savedLang === 'zh-TW' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dashboard-language', lang);
  };

  const t = getTranslations(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

