import { createTheme, ThemeOptions } from '@mui/material/styles';

// ═══════════════════════════════════════════════════════════════════════════
// KAVACH — NEXT GENERATION DESIGN SYSTEM
// Reimagined from zero. Cinematic. Premium. Intelligent.
// ═══════════════════════════════════════════════════════════════════════════

export const K = {
  // ── Crimson Signature Palette ──────────────────────────────────────────
  crimson:       '#DC2626',
  crimsonHover:  '#B91C1C',
  crimsonDeep:   '#7F1D1D',
  crimsonGlow:   'rgba(220,38,38,0.4)',
  crimsonSoft:   'rgba(220,38,38,0.08)',
  crimsonBorder: 'rgba(220,38,38,0.2)',
  ember:         '#EF4444',

  // ── Ink Palette (Dark Mode Foundation) ────────────────────────────────
  ink:    '#08080C',
  ink900: '#0D0D12',
  ink800: '#12121A',
  ink700: '#1A1A24',
  ink600: '#22222E',
  ink500: '#2E2E3E',
  ink400: '#3D3D52',

  // ── Ghost Whites (Surfaces on Dark) ───────────────────────────────────
  ghost20:  'rgba(255,255,255,0.02)',
  ghost50:  'rgba(255,255,255,0.05)',
  ghost80:  'rgba(255,255,255,0.08)',
  ghost100: 'rgba(255,255,255,0.1)',
  ghost200: 'rgba(255,255,255,0.2)',
  ghost600: 'rgba(255,255,255,0.6)',
  ghost800: 'rgba(255,255,255,0.8)',

  // ── Light Mode Surfaces ────────────────────────────────────────────────
  paper:     '#FDFCFB',
  paperWarm: '#F8F6F3',
  paperCard: '#FFFFFF',
  border:    'rgba(11,11,15,0.09)',
  borderDark:'rgba(11,11,15,0.14)',

  // ── Security Status Colors ─────────────────────────────────────────────
  safe:         '#16A34A',
  safeGlow:     'rgba(22,163,74,0.3)',
  safeSoft:     'rgba(22,163,74,0.08)',
  warning:      '#D97706',
  warnGlow:     'rgba(217,119,6,0.3)',
  warnSoft:     'rgba(217,119,6,0.08)',
  danger:       '#DC2626',
  critical:     '#991B1B',
  info:         '#0369A1',
  infoGlow:     'rgba(3,105,161,0.3)',

  // ── AI / Raksha Signature ──────────────────────────────────────────────
  rakshaBlue:   '#3B82F6',
  rakshaGlow:   'rgba(59,130,246,0.35)',
  rakshaSoft:   'rgba(59,130,246,0.08)',

  // ── Typography Scale ───────────────────────────────────────────────────
  fontDisplay: '"Outfit", "Inter", system-ui, sans-serif',
  fontBody:    '"Inter", "Outfit", system-ui, sans-serif',
  fontMono:    '"JetBrains Mono", "Fira Code", monospace',
};

// ── Shared Typography Config ────────────────────────────────────────────────
const typographyConfig = {
  fontFamily: K.fontDisplay,
  h1: {
    fontSize: 'clamp(2.8rem, 5vw, 5rem)',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1.04,
  },
  h2: {
    fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  h3: {
    fontSize: 'clamp(1.5rem, 2.5vw, 2.1rem)',
    fontWeight: 700,
    letterSpacing: '-0.022em',
    lineHeight: 1.2,
  },
  h4: {
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '-0.015em',
    lineHeight: 1.3,
  },
  h5: {
    fontSize: '1.18rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.35,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '-0.005em',
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '0.925rem',
    lineHeight: 1.7,
    letterSpacing: '0.002em',
  },
  body2: {
    fontSize: '0.845rem',
    lineHeight: 1.6,
    letterSpacing: '0.005em',
  },
  caption: {
    fontSize: '0.76rem',
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  overline: {
    fontSize: '0.7rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    lineHeight: 1.5,
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '0.005em',
  },
};

// ── LIGHT THEME ──────────────────────────────────────────────────────────────
export const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary:    { main: K.crimson, light: K.ember, dark: K.crimsonHover, contrastText: '#FFFFFF' },
    secondary:  { main: K.ink, light: K.ink600, dark: '#000000', contrastText: '#FFFFFF' },
    background: { default: K.paper, paper: K.paperCard },
    text:       { primary: K.ink, secondary: 'rgba(11,11,15,0.55)' },
    divider:    K.border,
    success:    { main: K.safe, light: '#22C55E', dark: '#166534' },
    warning:    { main: K.warning, light: '#FBBF24', dark: '#92400E' },
    error:      { main: K.crimson, light: K.ember, dark: K.crimsonDeep },
    info:       { main: K.info, light: '#0284C7', dark: '#075985' },
  },
  typography: typographyConfig,
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': { background: 'rgba(220,38,38,0.15)', color: '#0B0B0F' },
        'html': { scrollBehavior: 'smooth' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(11,11,15,0.04), 0 4px 12px rgba(11,11,15,0.04)',
          border: `1px solid ${K.border}`,
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s cubic-bezier(0.16,1,0.3,1), border-color 0.2s',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: K.paperCard,
          boxShadow: '0 1px 2px rgba(11,11,15,0.03), 0 6px 20px rgba(11,11,15,0.05)',
          border: `1px solid ${K.border}`,
          borderRadius: 18,
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.25s',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 32px rgba(11,11,15,0.1)',
            borderColor: 'rgba(220,38,38,0.22)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 22px',
          fontWeight: 700,
          boxShadow: 'none',
          transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
          '&:active': { transform: 'scale(0.97)' },
        },
        contained: {
          background: `linear-gradient(135deg, ${K.crimson} 0%, ${K.crimsonHover} 100%)`,
          boxShadow: `0 2px 8px ${K.crimsonGlow}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${K.crimsonHover} 0%, ${K.crimsonDeep} 100%)`,
            boxShadow: `0 8px 24px ${K.crimsonGlow}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: K.crimsonBorder,
          color: K.crimson,
          '&:hover': { borderColor: K.crimson, backgroundColor: K.crimsonSoft },
        },
        text: {
          '&:hover': { backgroundColor: 'rgba(11,11,15,0.04)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 8, fontSize: '0.75rem' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: K.paperWarm,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: K.crimsonBorder },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: K.crimson, borderWidth: 1.5 },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${K.border}`,
          padding: '12px 16px',
          fontFamily: K.fontBody,
        },
        head: {
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(11,11,15,0.5)',
          backgroundColor: K.paperWarm,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: { root: { '&:before': { display: 'none' }, backgroundImage: 'none' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: K.ink,
          borderRadius: 8,
          fontSize: '0.78rem',
          fontWeight: 600,
          padding: '6px 12px',
        },
      },
    },
  },
};

// ── DARK THEME ───────────────────────────────────────────────────────────────
export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary:    { main: K.crimson, light: K.ember, dark: K.crimsonHover, contrastText: '#FFFFFF' },
    secondary:  { main: '#60A5FA', light: '#93C5FD', dark: '#3B82F6' },
    background: { default: K.ink, paper: K.ink800 },
    text:       { primary: '#F0EEF5', secondary: 'rgba(240,238,245,0.55)' },
    divider:    K.ghost80,
    success:    { main: '#22C55E', light: '#4ADE80', dark: '#15803D' },
    warning:    { main: '#F59E0B', light: '#FCD34D', dark: '#B45309' },
    error:      { main: K.ember, light: '#FCA5A5', dark: K.crimsonHover },
    info:       { main: '#60A5FA', light: '#93C5FD', dark: '#2563EB' },
  },
  typography: typographyConfig,
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': { background: 'rgba(220,38,38,0.35)', color: '#FFFFFF' },
        'html': { scrollBehavior: 'smooth' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: K.ink800,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
          border: `1px solid ${K.ghost80}`,
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s, border-color 0.2s',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: K.ink700,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
          border: `1px solid ${K.ghost80}`,
          borderRadius: 18,
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.25s',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            borderColor: K.crimsonBorder,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 22px',
          fontWeight: 700,
          boxShadow: 'none',
          transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
          '&:active': { transform: 'scale(0.97)' },
        },
        contained: {
          background: `linear-gradient(135deg, ${K.crimson} 0%, ${K.crimsonHover} 100%)`,
          boxShadow: `0 4px 16px ${K.crimsonGlow}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${K.ember} 0%, ${K.crimson} 100%)`,
            boxShadow: `0 8px 28px ${K.crimsonGlow}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(220,38,38,0.4)',
          color: K.ember,
          '&:hover': { borderColor: K.ember, backgroundColor: 'rgba(220,38,38,0.1)' },
        },
        text: {
          '&:hover': { backgroundColor: K.ghost50 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 8, fontSize: '0.75rem' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: K.ghost20,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: K.ghost80 },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: K.ghost200 },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: K.ember, borderWidth: 1.5 },
            '& input': { color: '#F0EEF5' },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${K.ghost80}`,
          padding: '12px 16px',
          fontFamily: K.fontBody,
        },
        head: {
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(240,238,245,0.4)',
          backgroundColor: K.ghost20,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: { root: { '&:before': { display: 'none' }, backgroundImage: 'none', backgroundColor: K.ink700 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: K.ink600,
          border: `1px solid ${K.ghost80}`,
          borderRadius: 8,
          fontSize: '0.78rem',
          fontWeight: 600,
          padding: '6px 12px',
        },
      },
    },
  },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Export brand color token for use in sx props throughout the app
export { K as brandColors };
