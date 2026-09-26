import React from 'react';
import { Box, Container, Typography, Grid, Divider, IconButton } from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CR = '#DC2626';

export const Footer: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: isDark ? 'rgba(5, 5, 8, 0.75)' : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(16px)',
        color: isDark ? '#FFFFFF' : '#0F172A',
        pt: { xs: 8, md: 12 },
        pb: 5,
        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        position: 'relative',
        zIndex: 10,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 5, md: 6 }} mb={8}>
          {/* Column 1: Brand & Heritage */}
          <Grid item xs={12} md={4}>
            <Box mb={2.5} display="flex" alignItems="center" gap={1.5} onClick={() => navigate('/')} sx={{ cursor: 'pointer', width: 'fit-content' }}>
              <Box
                component="img"
                src="/kavach-logo-transparent.png"
                alt="KAVACH"
                onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
                sx={{ height: 34, width: 'auto' }}
              />
              <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'Outfit', color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '0.05em' }}>
                KAVACH
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#475569', lineHeight: 1.8, mb: 3, maxWidth: 360 }}>
              Enterprise AI-driven SOAR-XDR cybersecurity platform engineered and developed by{' '}
              <Box
                component="a"
                href="https://swastikchemindia.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: isDark ? '#FFFFFF' : '#0B0B0F',
                  fontWeight: 700,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${CR}`,
                  '&:hover': { color: CR },
                  transition: 'color 0.2s ease',
                }}
              >
                Swastik Chemical (India)
              </Box>
              . Built for continuous endpoint telemetry, proactive machine learning defense, and autonomous incident response.
            </Typography>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.8,
                py: 0.7,
                borderRadius: '100px',
                bgcolor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
              }}
            >
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
              <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 800, letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
                KAVACH CORE • ALL SYSTEMS NOMINAL
              </Typography>
            </Box>
          </Grid>

          {/* Column 2: Platform Capabilities */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography variant="caption" sx={{ color: CR, fontWeight: 900, letterSpacing: '0.12em', display: 'block', mb: 2 }}>
              PLATFORM CAPABILITIES
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
              {[
                { label: 'Platform Features', path: '/features' },
                { label: '16 Telemetry Engines', path: '/features' },
                { label: 'IsolationForest ML', path: '/features' },
                { label: 'MITRE ATT&CK Matrix', path: '/features' },
                { label: 'KAVACH URL Shield', path: '/features' },
              ].map((item) => (
                <Typography
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: 'fit-content',
                    transition: 'color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      color: CR,
                      transform: 'translateX(3px)',
                    },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Column 3: Defensive Architecture */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography variant="caption" sx={{ color: CR, fontWeight: 900, letterSpacing: '0.12em', display: 'block', mb: 2 }}>
              DEFENSIVE ARCHITECTURE
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
              {[
                { label: 'How KAVACH Works', path: '/how-it-works' },
                { label: 'Raksha AI Copilot', path: '/raksha-ai' },
                { label: 'Security & Sanitization', path: '/security' },
                { label: 'Controlled SOAR', path: '/security' },
                { label: 'Audit Trail & Provenance', path: '/security' },
              ].map((item) => (
                <Typography
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: 'fit-content',
                    transition: 'color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      color: CR,
                      transform: 'translateX(3px)',
                    },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Column 4: Project & Access */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="caption" sx={{ color: CR, fontWeight: 900, letterSpacing: '0.12em', display: 'block', mb: 2 }}>
              PROJECT & ACCESS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
              {[
                { label: 'About KAVACH & Heritage', path: '/about' },
                { label: 'Onboarding Guide', path: '/get-started' },
                { label: 'Security Operations Login', path: '/login' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
              ].map((item) => (
                <Typography
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: 'fit-content',
                    transition: 'color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      color: CR,
                      transform: 'translateX(3px)',
                    },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', mb: 4 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8', fontWeight: 500 }}>
            © {new Date().getFullYear()} KAVACH Security Platform. Developed & engineered by{' '}
            <Box
              component="a"
              href="https://swastikchemindia.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.7)' : '#64748B',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { color: CR },
              }}
            >
              Swastik Chemical (India)
            </Box>
            . Production Release v2.4. All rights reserved.
          </Typography>

          <IconButton
            onClick={scrollToTop}
            size="small"
            aria-label="Scroll to top"
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15, 23, 42, 0.05)',
              color: isDark ? '#FFFFFF' : '#0F172A',
              '&:hover': { bgcolor: CR, color: '#FFFFFF' },
            }}
          >
            <KeyboardArrowUp fontSize="small" />
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
};
