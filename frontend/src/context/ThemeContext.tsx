'use client';

import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import {
  applyThemeToDocument,
  createThemeStore,
  nextThemeMode,
  parseSnapshot,
  resolveTheme,
  type ThemeMode,
} from '@/lib/theme-store';

export type { ThemeMode } from '@/lib/theme-store';
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

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'agentlens_theme',
  attribute = 'class',
}: ThemeProviderProps) {
  const store = useMemo(() => createThemeStore(storageKey, defaultTheme), [storageKey, defaultTheme]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const { theme, systemTheme } = parseSnapshot(snapshot);
  const resolvedTheme = resolveTheme(theme, systemTheme === 'dark');

  // 첫 그리기 전에 DOM 에 적용한다 (개발 모드 재마운트 때 React 가 <html> 속성을 지워도 다시 단다).
  useLayoutEffect(() => {
    applyThemeToDocument(resolvedTheme, attribute);
  }, [resolvedTheme, attribute]);

  const setTheme = useCallback((t: ThemeMode) => store.setMode(t), [store]);
  const toggleTheme = useCallback(() => store.setMode(nextThemeMode(store.getMode())), [store]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, resolvedTheme, toggleTheme, setTheme }),
    [theme, resolvedTheme, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
