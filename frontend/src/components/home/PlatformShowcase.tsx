import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const CR = '#DC2626';

const DashboardMockup: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: isDark ? '#0A0B0F' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 24px 60px rgba(15,23,42,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Browser Chrome */}
      <Box sx={{ height: 40, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', px: 2, gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDark ? '#333' : '#E2E8F0' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDark ? '#333' : '#E2E8F0' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDark ? '#333' : '#E2E8F0' }} />
      </Box>

      {/* App Body */}
      <Box sx={{ display: 'flex', height: { xs: 400, md: 600 } }}>
        {/* Sidebar */}
        <Box sx={{ width: 220, borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', p: 3, display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ width: '100%', height: 24, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', mb: 4 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ width: '80%', height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
            <Box sx={{ width: '60%', height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
            <Box sx={{ width: '70%', height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
            <Box sx={{ width: '50%', height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', gap: 4, bgcolor: isDark ? '#050508' : '#FDFCFB' }}>
          
          {/* Top Stats */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, md: 3 } }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ flex: 1, height: 90, borderRadius: 2, bgcolor: isDark ? '#0A0B0F' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 8, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                <Box sx={{ width: 80, height: 24, borderRadius: 1, bgcolor: i === 2 ? CR : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') }} />
              </Box>
            ))}
          </Box>

          {/* Chart Area */}
          <Box sx={{ flexGrow: 1, borderRadius: 2, bgcolor: isDark ? '#0A0B0F' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            {/* Grid Lines */}
            <Box sx={{ position: 'absolute', inset: 0, backgroundImage: isDark ? 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)' : 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
            
            {/* SVG Spline */}
            <svg preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80%' }} viewBox="0 0 1000 300">
              <path d="M0 250 C 200 250, 300 150, 500 200 C 700 250, 800 50, 1000 100 L 1000 300 L 0 300 Z" fill={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} />
              <path d="M0 250 C 200 250, 300 150, 500 200 C 700 250, 800 50, 1000 100" fill="none" stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} strokeWidth="3" />
            </svg>

            {/* Threat Indicator Dot */}
            <Box
              component={motion.div}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              sx={{ position: 'absolute', left: '75%', top: '35%', width: 12, height: 12, borderRadius: '50%', bgcolor: CR, boxShadow: `0 0 20px ${CR}` }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const PlatformShowcase: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <Box sx={{ py: { xs: 12, md: 20 }, bgcolor: 'transparent' }} id="platform">
      <Container maxWidth="xl">
        <Box textAlign="center" mb={10}>
          <Typography variant="h2" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: { xs: '2.5rem', md: '3.5rem' }, color: isDark ? '#FFFFFF' : '#0B0B0F', lineHeight: 1.1, letterSpacing: '-0.02em', mb: 3 }}>
            One platform.<br />
            <Box component="span" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8' }}>Complete visibility.</Box>
          </Typography>
          <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#475569', fontSize: '1.2rem', maxWidth: 600, mx: 'auto' }}>
            A unified interface that brings together endpoint telemetry, behavioral machine learning, and automated response playbooks.
          </Typography>
        </Box>
        
        <DashboardMockup isDark={isDark} />
      </Container>
    </Box>
  );
};
