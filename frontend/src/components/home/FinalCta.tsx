import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';

export const FinalCta: React.FC<{ navigate: any; isDark?: boolean }> = ({ navigate, isDark: propIsDark }) => {
  const { mode } = useThemeMode();
  const isDark = propIsDark !== undefined ? propIsDark : mode === 'dark';

  return (
    <Box sx={{ position: 'relative', py: { xs: 16, md: 24 }, bgcolor: 'transparent', overflow: 'hidden' }}>
      {/* Cinematic Top Border */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, bgcolor: CR, boxShadow: `0 0 20px ${CR}`, opacity: isDark ? 0.5 : 0.3 }} />
      
      {/* Subtle Crimson Atmosphere */}
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: isDark ? 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 60%)' : 'radial-gradient(circle, rgba(220,38,38,0.04) 0%, transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: { xs: '2.2rem', sm: '3.2rem', md: '4.5rem' }, color: isDark ? '#FFFFFF' : '#0B0B0F', lineHeight: 1.1, letterSpacing: '-0.03em', mb: 3 }}>
          Make your digital world<br />
          safer with KAVACH.
        </Typography>

        <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', fontSize: { xs: '1.05rem', md: '1.4rem' }, lineHeight: 1.5, mb: { xs: 4, md: 6 } }}>
          Understand what is happening.<br />
          Act before it becomes a problem.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            onClick={() => { navigate('/get-started'); window.scrollTo(0,0); }}
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: CR, color: '#FFFFFF', fontWeight: 800, fontSize: '1rem', px: 5, py: 1.8,
              borderRadius: 2, textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#B91C1C', transform: 'translateY(-1px)', boxShadow: '0 8px 20px rgba(220,38,38,0.2)' },
              transition: 'all 0.2s',
            }}
          >
            Get Started
          </Button>
          <Button
            onClick={() => { navigate('/features'); window.scrollTo(0,0); }}
            sx={{
              color: isDark ? '#FFFFFF' : '#0B0B0F', fontWeight: 700, fontSize: '1rem', px: 5, py: 1.8,
              borderRadius: 2, textTransform: 'none', border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              transition: 'all 0.2s',
            }}
          >
            Explore KAVACH
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};
