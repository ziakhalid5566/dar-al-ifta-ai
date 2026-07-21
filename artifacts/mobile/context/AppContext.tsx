import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Fatwa {
  id: string;
  question: string;
  category: string;
  timeAgo: string;
  answer?: string;
}

export type AppLanguage = 'auto' | 'ur' | 'ar' | 'en';

export interface ChatPreviewMessage {
  isUser: boolean;
  content: string;
}

export interface ChatSession {
  id: string;
  timestamp: number;
  messageCount: number;
  isMultiAgent: boolean;
  preview: ChatPreviewMessage[]; // first 2 messages shown as preview
}

interface AppContextType {
  favorites: Fatwa[];
  addFavorite: (fatwa: Fatwa) => void;
  removeFavorite: (id: string) => void;
  isFavorited: (id: string) => boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (s: 'small' | 'medium' | 'large') => void;
  language: AppLanguage;
  setLanguage: (l: AppLanguage) => void;
  chatHistory: ChatSession[];
  saveChatSession: (session: Omit<ChatSession, 'id'>) => void;
  deleteChatSession: (id: string) => void;
  clearChatHistory: () => void;
  clearAllData: () => Promise<void>;
  isHydrated: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FAVORITES:    '@dar_al_ifta_favorites',
  DARK_MODE:    '@dar_al_ifta_dark_mode',
  FONT_SIZE:    '@dar_al_ifta_font_size',
  LANGUAGE:     '@dar_al_ifta_language',
  CHAT_HISTORY: '@dar_al_ifta_chat_history',
};

const MAX_SESSIONS = 30; // keep last 30 sessions

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites,    setFavorites]    = useState<Fatwa[]>([]);
  const [darkMode,     setDarkMode]     = useState(false);
  const [fontSize,     setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');
  const [language,     setLanguageState] = useState<AppLanguage>('auto');
  const [chatHistory,  setChatHistory]  = useState<ChatSession[]>([]);
  const [isHydrated,   setIsHydrated]   = useState(false);

  // Load persisted values on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const [favRaw, dmRaw, fsRaw, langRaw, histRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY),
        ]);
        if (favRaw)  setFavorites(JSON.parse(favRaw) as Fatwa[]);
        if (dmRaw !== null) setDarkMode(dmRaw === 'true');
        if (fsRaw)   setFontSizeState(fsRaw as 'small' | 'medium' | 'large');
        if (langRaw) setLanguageState(langRaw as AppLanguage);
        if (histRaw) setChatHistory(JSON.parse(histRaw) as ChatSession[]);
      } catch (_) {
        // defaults are fine
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, []);

  const addFavorite = useCallback((fatwa: Fatwa) => {
    setFavorites((prev) => {
      if (prev.find((f) => f.id === fatwa.id)) return prev;
      const next = [fatwa, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorited = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggleDarkMode = useCallback(() => {
    setDarkMode((d) => {
      const next = !d;
      AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const setFontSize = useCallback((s: 'small' | 'medium' | 'large') => {
    setFontSizeState(s);
    AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, s).catch(() => {});
  }, []);

  const setLanguage = useCallback((l: AppLanguage) => {
    setLanguageState(l);
    AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, l).catch(() => {});
  }, []);

  const saveChatSession = useCallback((session: Omit<ChatSession, 'id'>) => {
    if (session.messageCount < 2) return; // skip trivial sessions
    setChatHistory((prev) => {
      const next: ChatSession[] = [
        { ...session, id: `${Date.now()}-${Math.random()}` },
        ...prev,
      ].slice(0, MAX_SESSIONS);
      AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteChatSession = useCallback((id: string) => {
    setChatHistory((prev) => {
      const next = prev.filter((s) => s.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY).catch(() => {});
  }, []);

  const clearAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.FAVORITES]);
    setFavorites([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        favorites, addFavorite, removeFavorite, isFavorited,
        darkMode, toggleDarkMode,
        fontSize, setFontSize,
        language, setLanguage,
        chatHistory, saveChatSession, deleteChatSession, clearChatHistory,
        clearAllData,
        isHydrated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
