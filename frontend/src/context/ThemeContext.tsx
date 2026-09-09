'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted theme or system preference
    try {
      const saved = localStorage.getItem('agentlens_theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        setThemeState('dark');
        applyTheme('dark');
      }
    } catch {
      applyTheme('dark');
    }
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem('agentlens_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('agentlens_theme', next);
      } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
