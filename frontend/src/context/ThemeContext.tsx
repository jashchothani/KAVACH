import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme, lightTheme } from '../theme/theme';
import { ThemeContext } from './themeContextDef';
import type { ThemeMode } from './themeContextDef';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('kavach_theme');
    return (saved as ThemeMode) || 'dark'; // Dark mode first, but supports light mode fully
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('kavach_theme', next);
      return next;
    });
  };

  const currentTheme = mode === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    // Also apply theme class to body for custom CSS integration
    document.body.className = mode;
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
