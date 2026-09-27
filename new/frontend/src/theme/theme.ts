import { createTheme, ThemeOptions } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────────────────────
// KAVACH BRAND SYSTEM — Crimson + Near-Black + Warm Neutrals
// One coherent palette shared by every surface, light or dark.
// ─────────────────────────────────────────────────────────────────────────
export const brandColors = {
  // Crimson — used deliberately, never as a wash
  primary: '#DC2626',
  primaryHover: '#B91C1C',
  primaryDeep: '#8B0A14',
  accentRed: '#EF4444',
  crimsonGlow: 'rgba(220, 38, 38, 0.35)',

  // Near-black — the brand's "ink", warmer than a cold navy
  ink: '#0B0B0F',
  ink900: '#111114',
  ink800: '#18181D',
  ink700: '#232329',
  ink600: '#34343C',

  // Legacy aliases kept so existing screens referencing these keep working
  navyDark: '#0B0B0F',
  slate800: '#232329',
  slate700: '#3F3F46',
  slate500: '#6B6B76',
  slate200: '#E7E5E4',
  slate100: '#F2F0EE',
  slate50: '#FAF9F7',

  // Warm neutrals for light surfaces
  warmWhite: '#FDFCFB',
  warmGray: '#F5F3F1',
  border: '#E9E6E2',

  white: '#FFFFFF',
};

const typographyConfig = {
  fontFamily: '"Outfit", "Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: {
    fontSize: 'clamp(2.4rem, 4vw, 4rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.08,
  },
  h2: {
    fontSize: 'clamp(1.9rem, 3vw, 2.75rem)',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    lineHeight: 1.15,
  },
  h3: {
    fontSize: 'clamp(1.5rem, 2.2vw, 1.9rem)',
    fontWeight: 700,
    letterSpacing: '-0.018em',
    lineHeight: 1.25,
  },
  h4: {
    fontSize: '1.35rem',
    fontWeight: 700,
    letterSpacing: '-0.012em',
    lineHeight: 1.35,
  },
  h5: {
    fontSize: '1.15rem',
    fontWeight: 700,
    letterSpacing: '-0.006em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '0.005em',
  },
  body1: {
    fontSize: '0.9rem',
    letterSpacing: '0.005em',
    lineHeight: 1.65,
  },
  body2: {
    fontSize: '0.82rem',
    letterSpacing: '0.01em',
    lineHeight: 1.55,
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 700,
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
      default: brandColors.warmWhite,
      paper: brandColors.white,
    },
    text: {
      primary: brandColors.ink,
      secondary: '#5C5A57',
    },
    divider: 'rgba(17, 17, 20, 0.08)',
    success: { main: '#15803D', light: '#22C55E', dark: '#166534' },
    warning: { main: '#B45309', light: '#F59E0B', dark: '#92400E' },
    error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
    info: { main: '#0369A1', light: '#0284C7', dark: '#075985' },
  },
  typography: typographyConfig,
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': { backgroundColor: 'rgba(220, 38, 38, 0.18)' },
        'html, body': { scrollBehavior: 'smooth' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 2px rgba(17, 17, 20, 0.04)',
          border: `1px solid ${brandColors.border}`,
          transition: 'box-shadow 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: brandColors.white,
          boxShadow: '0 2px 8px -2px rgba(17,17,20,0.05), 0 8px 24px -8px rgba(17,17,20,0.06)',
          border: `1px solid ${brandColors.border}`,
          borderRadius: 16,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '9px 20px',
          fontWeight: 700,
          boxShadow: 'none',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:active': { transform: 'translateY(0)' },
        },
        containedPrimary: {
          backgroundColor: brandColors.primary,
          boxShadow: '0 1px 2px rgba(139,10,20,0.25)',
          '&:hover': {
            backgroundColor: brandColors.primaryHover,
            boxShadow: `0 10px 24px -6px ${brandColors.crimsonGlow}`,
            transform: 'translateY(-1px)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(220, 38, 38, 0.35)',
          '&:hover': {
            borderColor: brandColors.primary,
            backgroundColor: 'rgba(220, 38, 38, 0.06)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 8,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          '&:before': { display: 'none' },
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
      dark: brandColors.primaryDeep,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#38BDF8',
      light: '#7DD3FC',
      dark: '#0284C7',
    },
    background: {
      default: brandColors.ink,
      paper: brandColors.ink800,
    },
    text: {
      primary: '#F5F3F1',
      secondary: '#9C9AA3',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    success: { main: '#22C55E' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    info: { main: '#38BDF8' },
  },
  typography: typographyConfig,
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: brandColors.ink800,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: brandColors.ink800,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '9px 20px',
          fontWeight: 700,
        },
        containedPrimary: {
          boxShadow: `0 8px 24px -6px ${brandColors.crimsonGlow}`,
          '&:hover': { backgroundColor: brandColors.primaryHover },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 8 },
      },
    },
  },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);
