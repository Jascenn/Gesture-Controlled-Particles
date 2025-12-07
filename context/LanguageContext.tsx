
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, Language } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;
  tGesture: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Detect browser language
  useEffect(() => {
    const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
    setLanguage(browserLang);
  }, []);

  const t = (key: string): any => {
    return (translations[language] as any)[key] || key;
  };

  const tGesture = (key: string): string => {
      return (translations[language].gestures as any)[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tGesture }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
