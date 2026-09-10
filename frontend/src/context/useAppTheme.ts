import { useContext } from 'react';
import { ThemeContext } from './themeContextDef';

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within AppThemeProvider');
  return context;
};
