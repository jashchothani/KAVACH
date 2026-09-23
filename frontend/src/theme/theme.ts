import { createTheme, ThemeOptions } from '@mui/material/styles';

const brandColors = {
  primary: '#DC2626',      // KAVACH Crimson Red
  primaryHover: '#B91C1C',
  accentRed: '#EF4444',
  navyDark: '#0F172A',     // Deep Slate Navy
  slate800: '#1E293B',
  slate700: '#334155',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
};

const typographyConfig = {
  fontFamily: '"Outfit", "Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
  },
  h3: {
    fontSize: '1.65rem',
    fontWeight: 700,
    letterSpacing: '-0.015em',
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.35rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.35,
  },
  h5: {
    fontSize: '1.15rem',
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
    fontSize: '0.8rem',
    letterSpacing: '0.015em',
    lineHeight: 1.5,
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.875rem',
  },
};

export const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary,
      light: brandColors.accentRed,
      dark: brandColors.primaryHover,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.navyDark,
      light: brandColors.slate700,
      dark: '#020617',
      contrastText: '#FFFFFF',
    },
    background: {
      default: brandColors.slate50,
      paper: brandColors.white,
    },
    text: {
      primary: brandColors.navyDark,
      secondary: brandColors.slate500,
    },
    divider: 'rgba(226, 232, 240, 0.85)',
    success: { main: '#10B981', light: '#34D399', dark: '#059669' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    info: { main: '#0284C7', light: '#38BDF8', dark: '#0369A1' },
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
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: brandColors.white,
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 14,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          padding: '8px 18px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
          },
        },
        contained: {
          backgroundColor: brandColors.primary,
          '&:hover': {
            backgroundColor: brandColors.primaryHover,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
};

export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: brandColors.primary,
      light: brandColors.accentRed,
      dark: '#8B0A14',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#38BDF8',
      light: '#7DD3FC',
      dark: '#0284C7',
    },
    background: {
      default: '#08080C',
      paper: '#111118',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    info: { main: '#38BDF8' },
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
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          padding: '8px 18px',
          fontWeight: 600,
        },
      },
    },
  },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);
