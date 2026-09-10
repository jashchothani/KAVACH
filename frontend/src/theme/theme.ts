import { createTheme, ThemeOptions } from '@mui/material/styles';

const brandColors = {
  primary: '#C1121F',      // Primary Red
  black: '#111111',        // Pure Black
  darkGray: '#1A1A24',     // Elevated Dark Card
  lightGray: '#F4F6F9',    // Light Mode Elevated Card
  accentRed: '#E63946',
  white: '#FFFFFF',
};

const typographyConfig = {
  fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", Arial, sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.015em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    letterSpacing: '-0.005em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.005em',
  },
  body1: {
    fontSize: '0.875rem',
    letterSpacing: '0.01em',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.75rem',
    letterSpacing: '0.015em',
    lineHeight: 1.5,
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.875rem',
  },
};

export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: brandColors.primary,
      light: brandColors.accentRed,
      dark: '#8B0A14',
    },
    background: {
      default: '#08080C',
      paper: '#111118',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#9098A9',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    info: { main: '#3B82F6' },
  },
  typography: typographyConfig,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111118',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
  },
};

export const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary,
      light: brandColors.accentRed,
      dark: '#8B0A14',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#64748B',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    info: { main: '#3B82F6' },
  },
  typography: typographyConfig,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
  },
};

export const darkTheme = createTheme(darkThemeOptions);
export const lightTheme = createTheme(lightThemeOptions);
