import React from 'react';
import { Box, Container, Typography, Chip } from '@mui/material';
import { Security, Bolt, SmartToy, Sensors, CheckCircle, FiberManualRecord } from '@mui/icons-material';
import { motion } from 'framer-motion';

export const CapabilityStrip: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const items = [
    {
      top: '24/7',
      bottom: 'Threat Monitoring',
      tag: 'CONTINUOUS KERNEL',
      color: '#22C55E',
      icon: <Sensors sx={{ fontSize: 24, color: '#22C55E' }} />,
      desc: 'Active zero-lag ring-0 observation across all endpoints',
      anim: (
        <Box sx={{ position: 'relative', width: 12, height: 12 }}>
          <Box
            component={motion.div}
            animate={{ scale: [1, 2.2, 1], opacity: [0.9, 0, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: '#22C55E' }}
          />
          <Box sx={{ position: 'absolute', inset: 2, borderRadius: '50%', bgcolor: '#22C55E' }} />
        </Box>
      ),
    },
    {
      top: '16+',
      bottom: 'Security Engines',
      tag: 'MULTI-VECTOR',
      color: '#DC2626',
      icon: <Security sx={{ fontSize: 24, color: '#DC2626' }} />,
      desc: 'Process lineage, network sockets, FIM & canary decoys',
      anim: (
        <Box
          component={motion.div}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px dashed #DC2626',
          }}
        />
      ),
    },
    {
      top: 'AI-POWERED',
      bottom: 'Detection & Response',
      tag: 'RAKSHA NEURAL v2.4',
      color: '#3B82F6',
      icon: <SmartToy sx={{ fontSize: 24, color: '#3B82F6' }} />,
      desc: 'Human-plain explanations & automated SOAR containment',
      anim: (
        <Box
          component={motion.div}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#3B82F6' }}
        />
      ),
    },
    {
      top: '< 12ms',
      bottom: 'Reaction Latency',
      tag: 'SUB-SECOND SOAR',
      color: '#EAB308',
      icon: <Bolt sx={{ fontSize: 24, color: '#EAB308' }} />,
      desc: 'Deterministic WFP host isolation & malicious PID kill',
      anim: (
        <Box
          component={motion.div}
          animate={{ x: [-2, 2, -2] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EAB308' }}
        />
      ),
    },
  ];

  const cardBg = isDark ? 'rgba(15, 18, 28, 0.75)' : 'rgba(255, 255, 255, 0.85)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const tickerItems = [
    '● KAVACH SOVEREIGN KERNEL: ALL 16 ENGINES ONLINE',
    '⚡ INTERCEPTING 1,480 HOST EVENTS/SEC',
    '🛡️ ZERO ACTIVE UNCONTAINED BREACHES',
    '🧠 ISOLATIONFOREST ML DRIFT: 0.002% (NOMINAL)',
    '🔒 SWASTIK CHEMICAL SOVEREIGN INDIAN CLOUD: VERIFIED',
    '⚡ AUTONOMOUS SOAR PLAYBOOKS: ARMED (<12ms)',
    '✓ DPDP ACT 2023 & CERT-IN COMPLIANT',
  ];

  return (
    <Box
      sx={{
        py: { xs: 4, md: 5 },
        position: 'relative',
        zIndex: 5,
        bgcolor: 'transparent',
      }}
    >
      {/* ─── LIVE INFINITE CYBERNETIC TICKER TAPE ─── */}
      <Box
        sx={{
          mb: 3.5,
          py: 0.8,
          overflow: 'hidden',
          bgcolor: isDark ? 'rgba(220, 38, 38, 0.06)' : 'rgba(220, 38, 38, 0.04)',
          borderTop: isDark ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.15)',
          borderBottom: isDark ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.15)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}
        >
          {[...tickerItems, ...tickerItems].map((txt, i) => (
            <Typography
              key={i}
              component="span"
              sx={{
                px: 4,
                color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#334155',
                fontSize: '0.74rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              {txt}
            </Typography>
          ))}
        </motion.div>
      </Box>

      {/* ─── FULL-WIDTH SYMMETRIC 4-POD METRICS GRID ─── */}
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, md: 2.5 },
            width: '100%',
          }}
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <Box
                sx={{
                  bgcolor: cardBg,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${border}`,
                  borderRadius: 3.5,
                  p: { xs: 2.5, md: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isDark
                    ? '0 12px 30px -8px rgba(0, 0, 0, 0.5)'
                    : '0 12px 30px -8px rgba(15, 23, 42, 0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.25s ease',
                  '&:hover': {
                    borderColor: item.color,
                  },
                }}
              >
                {/* Ambient Top Glow Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    bgcolor: item.color,
                    opacity: 0.7,
                  }}
                />

                {/* Header Row: Icon, Pulse Anim, Tag */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                    {item.anim}
                  </Box>

                  <Chip
                    label={item.tag}
                    size="small"
                    sx={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      letterSpacing: '0.06em',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
                      color: isDark ? '#FFFFFF' : '#0B0B0F',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  />
                </Box>

                {/* Metric Value & Label */}
                <Box sx={{ mb: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 900,
                      fontSize: { xs: '1.8rem', sm: '2rem', md: '2.2rem' },
                      lineHeight: 1.1,
                      letterSpacing: '-0.03em',
                      color: isDark ? '#FFFFFF' : '#0B0B0F',
                      mb: 0.5,
                    }}
                  >
                    {item.top}
                  </Typography>
                  <Typography
                    sx={{
                      color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#1E293B',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      letterSpacing: '-0.01em',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    {item.bottom}
                  </Typography>
                </Box>

                {/* Subtitle Description */}
                <Typography
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B',
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
};
