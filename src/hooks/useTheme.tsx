import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  theme: ResolvedTheme; // Backwards compatible alias for resolvedTheme
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('hotelos_theme_mode');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    // Check legacy key
    const legacy = localStorage.getItem('hotelos_theme');
    if (legacy === 'light' || legacy === 'dark') {
      return legacy;
    }
    return 'system';
  });

  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (themeMode === 'system') return getSystemTheme();
    return themeMode;
  });

  // Apply theme to document element
  const applyTheme = useCallback((theme: ResolvedTheme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    let effective: ResolvedTheme = 'light';
    if (themeMode === 'system') {
      effective = getSystemTheme();
    } else {
      effective = themeMode;
    }

    setResolvedTheme(effective);
    applyTheme(effective);
    localStorage.setItem('hotelos_theme_mode', themeMode);
    localStorage.setItem('hotelos_theme', effective);
  }, [themeMode, applyTheme]);

  // Listen to OS system theme changes if mode is 'system'
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, applyTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        theme: resolvedTheme,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
