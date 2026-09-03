'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  themes: Theme[];
  systemTheme?: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  themes: ['light', 'dark', 'system'],
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Read stored preference and apply immediately on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const sys = getSystemTheme();
      setSystemTheme(sys);
      const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
      setThemeState(stored);
      applyTheme(stored === 'system' ? sys : stored);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Re-apply whenever theme changes after mount
  useEffect(() => {
    applyTheme(theme === 'system' ? systemTheme : theme);
  }, [theme, systemTheme]);

  // Track system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = (e: MediaQueryListEvent) => {
      const sys: ResolvedTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(sys);
      if (themeRef.current === 'system') applyTheme(sys);
    };
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, themes: ['light', 'dark', 'system'], systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
