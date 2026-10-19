'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme = ThemeMode; // Backward compatibility alias

export interface ThemeContextType {
  /** 현재 활성화된 테마 모드 ('light' | 'dark' | 'system') */
  theme: ThemeMode;
  /** 실제로 브라우저 DOM에 적용된 테마 ('light' | 'dark') */
  resolvedTheme: 'light' | 'dark';
  /** 다음 테마로 순환 토글 (Light -> Dark -> System -> Light) */
  toggleTheme: () => void;
  /** 특정 테마 모드로 명시적 설정 */
  setTheme: (theme: ThemeMode) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** 기본 테마 (기본값: 'system') */
  defaultTheme?: ThemeMode;
  /** 로컬 스토리지 저장 키 (기본값: 'agentlens_theme') */
  storageKey?: string;
  /** 최상위 HTML 태그에 주입할 클래스 속성 (기본값: 'class') */
  attribute?: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'agentlens_theme',
  attribute = 'class',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey) as ThemeMode | null;
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          return saved;
        }
      } catch {}
    }
    return defaultTheme;
  });

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => getSystemTheme());

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return systemPreference;
    }
    return theme;
  }, [theme, systemPreference]);

  // Apply to DOM
  const applyThemeToDOM = useCallback((applied: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', applied);
    if (attribute === 'class') {
      if (applied === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  }, [attribute]);

  // Update DOM when resolvedTheme changes
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme, applyThemeToDOM]);

  // Listen to OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    try {
      localStorage.setItem(storageKey, t);
    } catch {}
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      let next: ThemeMode;
      if (current === 'light') {
        next = 'dark';
      } else if (current === 'dark') {
        next = 'system';
      } else {
        next = 'light';
      }
      try {
        localStorage.setItem(storageKey, next);
      } catch {}
      return next;
    });
  }, [storageKey]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
