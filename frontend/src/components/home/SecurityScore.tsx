import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { CheckCircle } from '@mui/icons-material';

const ScoreIndicator: React.FC<{ angle: number; title: string; score: number; isDark: boolean }> = ({ angle, title, score, isDark }) => {
  const rad = (angle * Math.PI) / 180;
  const radius = 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <Box sx={{ position: 'absolute', left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#0A0B0F' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', boxShadow: isDark ? '0 10px 20px rgba(0,0,0,0.5)' : '0 10px 20px rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E' }} />
        <Typography sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {title} <Typography component="span" sx={{ color: 'rgba(255,255,255,0.5)', ml: 0.5 }}>{score}</Typography>
        </Typography>
      </Box>
    </Box>
  );
};

export const SecurityScore: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <Box sx={{ py: { xs: 12, md: 20 }, bgcolor: isDark ? 'rgba(10, 11, 15, 0.45)' : 'rgba(248, 250, 252, 0.45)', backdropFilter: 'blur(16px)' }}>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 8, lg: 6 }} alignItems="center">
          
          {/* LEFT: Text Content */}
          <Grid item xs={12} lg={5}>
            <Typography sx={{ color: '#22C55E', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', mb: 2 }}>
              POSTURE MANAGEMENT
            </Typography>
            <Typography variant="h2" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: { xs: '2.5rem', md: '3.5rem' }, color: isDark ? '#FFFFFF' : '#0B0B0F', lineHeight: 1.1, letterSpacing: '-0.02em', mb: 4 }}>
              Know exactly where<br />
              you stand.
            </Typography>
            <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#475569', fontSize: '1.1rem', lineHeight: 1.6, mb: 4, maxWidth: 480 }}>
              The KAVACH Security Score continuously evaluates your environment against thousands of configurations, identifying vulnerabilities before they become incidents.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {['Real-time configuration auditing', 'Automated compliance mapping', 'Prioritized remediation steps'].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircle sx={{ color: '#22C55E', fontSize: 20 }} />
                  <Typography sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F', fontWeight: 600 }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* RIGHT: Score Visualization */}
          <Grid item xs={12} lg={7}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 320, sm: 400, md: 500 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: { xs: 'scale(0.65)', sm: 'scale(0.85)', md: 'scale(1)' },
                transformOrigin: 'center center',
                overflow: 'visible',
              }}
            >
              
              {/* Outer Ring */}
              <Box sx={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', border: isDark ? '1px dashed rgba(255,255,255,0.05)' : '1px dashed rgba(0,0,0,0.05)' }} />

              {/* Satellites */}
              <ScoreIndicator angle={-45} title="Endpoint Health" score={94} isDark={isDark} />
              <ScoreIndicator angle={45} title="Identity Security" score={91} isDark={isDark} />
              <ScoreIndicator angle={135} title="Network Safety" score={89} isDark={isDark} />
              <ScoreIndicator angle={225} title="Threat Activity" score={98} isDark={isDark} />

              {/* Main Score Center */}
              <Box sx={{ position: 'relative', width: 220, height: 220, borderRadius: '50%', bgcolor: isDark ? '#050508' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(34,197,94,0.05)' : '0 20px 40px rgba(15,23,42,0.05), inset 0 0 40px rgba(34,197,94,0.05)' }}>
                
                {/* SVG Progress Ring */}
                <svg style={{ position: 'absolute', inset: -4, width: 228, height: 228, transform: 'rotate(-90deg)' }}>
                  <circle cx="114" cy="114" r="110" fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="4" />
                  <motion.circle
                    cx="114" cy="114" r="110" fill="none" stroke="#22C55E" strokeWidth="4"
                    strokeDasharray="691"
                    initial={{ strokeDashoffset: 691 }}
                    whileInView={{ strokeDashoffset: 691 * (1 - 0.92) }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  />
                </svg>

                <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#64748B', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', mb: 1 }}>
                  SECURITY SCORE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '5rem', color: isDark ? '#FFFFFF' : '#0B0B0F', lineHeight: 1 }}>
                    92
                  </Typography>
                  <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8', fontWeight: 700, fontSize: '1.25rem', mt: 1 }}>
                    /100
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: 1, bgcolor: 'rgba(34,197,94,0.1)' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E' }} />
                  <Typography sx={{ color: '#22C55E', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.05em' }}>PROTECTED</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
