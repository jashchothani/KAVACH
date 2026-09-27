import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion, useInView } from 'framer-motion';

const CR = '#DC2626';

const stages = [
  { num: '01', title: 'COLLECT', desc: 'Ingest raw telemetry from 16 engines.' },
  { num: '02', title: 'UNDERSTAND', desc: 'Structure and normalize events.' },
  { num: '03', title: 'DETECT', desc: 'Identify behavioral anomalies.' },
  { num: '04', title: 'CORRELATE', desc: 'Connect related threat vectors.' },
  { num: '05', title: 'RESPOND', desc: 'Execute automated playbooks.' },
];

export const SecurityFlow: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [activeStage, setActiveStage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setActiveStage((prev) => (prev + 1) % stages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isInView]);

  return (
    <Box
      sx={{
        py: { xs: 12, md: 16 },
        bgcolor: isDark ? 'rgba(10, 11, 15, 0.6)' : 'rgba(248, 250, 252, 0.6)',
        backdropFilter: 'blur(16px)',
        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
      }}
      ref={containerRef}
    >
      <Container maxWidth="lg">
        <Typography variant="h2" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: { xs: '2.5rem', md: '3.5rem' }, color: isDark ? '#FFFFFF' : '#0B0B0F', lineHeight: 1.1, letterSpacing: '-0.02em', mb: 10 }}>
          Every signal has a story.<br />
          <Box component="span" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8' }}>KAVACH follows it.</Box>
        </Typography>

        <Box sx={{ position: 'relative', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 4 }}>
          {/* Continuous Line (Desktop) */}
          <Box sx={{ position: 'absolute', top: 24, left: 0, right: 0, height: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: { xs: 'none', md: 'block' }, zIndex: 0 }} />
          
          {/* Animated Crimson Progress Line */}
          <Box
            component={motion.div}
            initial={false}
            animate={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            sx={{ position: 'absolute', top: 24, left: 0, height: 2, bgcolor: CR, display: { xs: 'none', md: 'block' }, zIndex: 1 }}
          />

          {stages.map((stage, index) => {
            const isActive = index === activeStage;
            const isPast = index < activeStage;
            return (
              <Box
                key={stage.num}
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  flex: 1,
                  display: 'flex',
                  flexDirection: { xs: 'row', md: 'column' },
                  alignItems: { xs: 'center', md: 'center' },
                  textAlign: { xs: 'left', md: 'center' },
                  gap: { xs: 2, md: 0 },
                }}
              >
                {/* Node */}
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: '50%',
                    bgcolor: isActive ? CR : (isPast ? (isDark ? '#FFFFFF' : '#0B0B0F') : (isDark ? '#11131A' : '#FFFFFF')),
                    border: isActive || isPast ? 'none' : (isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: { xs: 0, md: 3 },
                    transition: 'all 0.4s ease',
                    boxShadow: isActive ? `0 0 20px ${CR}` : 'none',
                  }}
                >
                  <Typography sx={{ color: isActive || isPast ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.4)' : '#64748B'), fontWeight: 800, fontSize: '0.9rem' }}>
                    {stage.num}
                  </Typography>
                </Box>

                {/* Text Content */}
                <Box>
                  <Typography sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: isActive ? (isDark ? '#FFFFFF' : '#0B0B0F') : (isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8'), mb: 0.5, transition: 'color 0.4s ease' }}>
                    {stage.title}
                  </Typography>
                  <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {stage.desc}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};
