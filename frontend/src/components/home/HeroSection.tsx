import React, { useState } from 'react';
import { Box, Container, Typography, Button, Stack, Chip, Grid } from '@mui/material';
import { ArrowForward, Shield, Bolt, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';

const CR = '#DC2626';

// ─── SOVEREIGN RADAR & DEFENSE CONSOLE (HERO RIGHT) ──────────────────────────
const SovereignRadarConsole: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [simulating, setSimulating] = useState(false);
  const [deflectedCount, setDeflectedCount] = useState(1428);
  const [activeLog, setActiveLog] = useState('All 16 collectors nominal. Zero active breaches.');

  const handleSimulate = () => {
    if (simulating) return;
    setSimulating(true);
    setActiveLog('INCOMING: Encoded PowerShell (MITRE T1059.001) targeting WS-0492...');
    setTimeout(() => {
      setActiveLog('SOAR TRIGGERED: Host WS-0492 isolated • Process PID 4920 terminated in 14ms');
      setDeflectedCount((prev) => prev + 1);
      setTimeout(() => {
        setSimulating(false);
        setActiveLog('SYSTEM RESTORED: Endpoint WS-0492 re-baselined. Threat neutralized.');
      }, 2400);
    }, 1200);
  };

  const cardBg = isDark ? '#0E1017' : '#FFFFFF';
  const elevatedBg = isDark ? '#141722' : '#F8FAFC';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const textPrimary = isDark ? '#FFFFFF' : '#090A0F';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.42)' : '#64748B';
  const cardShadow = isDark
    ? '0 20px 48px -10px rgba(0, 0, 0, 0.7), 0 0 30px -5px rgba(220, 38, 38, 0.12)'
    : '0 20px 40px -10px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.03)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Box
        sx={{
          bgcolor: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 4,
          boxShadow: cardShadow,
          overflow: 'hidden',
          position: 'relative',
          maxWidth: 580,
          mx: 'auto',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Console Header Bar */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.2, sm: 1.8 },
            bgcolor: elevatedBg,
            borderBottom: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Typography
              sx={{
                ml: 0.8,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800,
                fontSize: { xs: '0.66rem', sm: '0.75rem' },
                color: textPrimary,
                letterSpacing: '0.02em',
              }}
            >
              KAVACH_TELEMETRY_CORE.v2.4
            </Typography>
          </Box>

          <Chip
            label={simulating ? 'DEFLECTING...' : 'LIVE RADAR // 100% HEALTHY'}
            size="small"
            sx={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              fontSize: { xs: '0.58rem', sm: '0.68rem' },
              height: { xs: 22, sm: 26 },
              bgcolor: simulating ? 'rgba(220, 38, 38, 0.15)' : 'rgba(34, 197, 94, 0.12)',
              color: simulating ? CR : '#22C55E',
              border: simulating ? `1px solid ${CR}` : '1px solid rgba(34, 197, 94, 0.3)',
            }}
          />
        </Box>

        {/* Interactive Radar Visual Canvas */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 300, sm: 350 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            bgcolor: isDark ? '#050508' : '#0B0F19',
          }}
        >
          {/* Background Concentric Radar Rings */}
          <Box
            sx={{
              position: 'absolute',
              width: { xs: 260, sm: 300 },
              height: { xs: 260, sm: 300 },
              borderRadius: '50%',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: { xs: 180, sm: 210 },
              height: { xs: 180, sm: 210 },
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: { xs: 100, sm: 120 },
              height: { xs: 100, sm: 120 },
              borderRadius: '50%',
              border: `1px solid ${CR}`,
              opacity: 0.3,
            }}
          />

          {/* Rotating Radar Scan Beam */}
          <Box
            component={motion.div}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            sx={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, transparent 75%, rgba(220, 38, 38, 0.25) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Threat Particle during Simulation */}
          {simulating && (
            <Box
              component={motion.div}
              initial={{ x: -130, y: -100, opacity: 0, scale: 0.5 }}
              animate={{ x: -40, y: -30, opacity: [0, 1, 1, 0], scale: [0.8, 1.3, 1.6, 0] }}
              transition={{ duration: 1.2, ease: 'easeIn' }}
              sx={{
                position: 'absolute',
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: '#EF4444',
                boxShadow: '0 0 15px #EF4444',
                zIndex: 10,
              }}
            />
          )}

          {/* Center Sovereign Shield Core */}
          <Box
            component={motion.div}
            animate={simulating ? { scale: [1, 1.2, 1], borderColor: ['#DC2626', '#22C55E', '#DC2626'] } : {}}
            transition={{ duration: 0.8 }}
            sx={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              bgcolor: 'rgba(220, 38, 38, 0.15)',
              border: `2px solid ${CR}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              boxShadow: '0 0 32px rgba(220, 38, 38, 0.45)',
            }}
          >
            <Shield sx={{ color: '#FFFFFF', fontSize: 34 }} />
            <Typography
              sx={{
                color: '#FFFFFF',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              KAVACH
            </Typography>
          </Box>

          {/* Distributed Satellite Nodes */}
          {[
            { name: 'WS-0492', ip: '10.0.9.14', x: -105, y: -80, color: '#22C55E' },
            { name: 'GATEWAY', ip: '10.0.1.1', x: 110, y: -75, color: '#3B82F6' },
            { name: 'VAULT-IN', ip: 'Sovereign', x: -110, y: 80, color: '#A855F7' },
            { name: 'RAKSHA', ip: 'Neural', x: 105, y: 85, color: '#EAB308' },
          ].map((node) => (
            <Box
              key={node.name}
              sx={{
                position: 'absolute',
                transform: `translate(${node.x}px, ${node.y}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.2,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: node.color }} />
              <Box>
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.68rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                  {node.name}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.58rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  {node.ip}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Live Telemetry Ticker & Controls */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: elevatedBg,
            borderTop: `1px solid ${border}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
            <Typography
              sx={{
                color: textMuted,
                fontSize: '0.7rem',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              LIVE SOVEREIGN TELEMETRY FEED
            </Typography>
            <Typography
              sx={{
                color: CR,
                fontSize: '0.74rem',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              DEFLECTED: {deflectedCount}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.6,
              borderRadius: 1.5,
              bgcolor: isDark ? '#050508' : '#0B0F19',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Typography
              sx={{
                color: simulating ? '#F87171' : '#4ADE80',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.78rem',
                lineHeight: 1.5,
              }}
            >
              &gt; {activeLog}
              <Box component="span" sx={{ animation: 'blink 1s infinite' }}>_</Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, mt: 2 }}>
            <Typography sx={{ color: textMuted, fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif' }}>
              Autonomous SOAR Engine • Swastik Chemical
            </Typography>
            <Button
              size="small"
              onClick={handleSimulate}
              disabled={simulating}
              sx={{
                color: CR,
                fontWeight: 800,
                fontSize: '0.75rem',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'none',
                p: 0,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              {simulating ? 'Deflecting...' : '[ Re-run Deflection ]'}
            </Button>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

// ─── HERO SECTION ──────────────────────────────────────────────────────────
export const HeroSection: React.FC<{ isDark: boolean; navigate: any }> = ({ isDark, navigate }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        pt: { xs: 16, sm: 20, md: 24 },
        pb: { xs: 10, md: 14 },
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'transparent',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease',
      }}
    >

      {/* Layer 3: Architectural HUD Technical Crosshairs & Coordinate Markers (Widescreen Only) */}
      <Box
        sx={{
          position: 'absolute',
          top: 95,
          left: 40,
          display: { xs: 'none', xl: 'flex' },
          alignItems: 'center',
          gap: 1.5,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.68rem',
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(15, 23, 42, 0.35)',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <Box component="span" sx={{ color: CR, fontWeight: 800 }}>+</Box>
        [SYS_LOC: 19.0760° N, 72.8777° E] // SWASTIK CHEMICAL CYBER LABS
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 95,
          right: 40,
          display: { xs: 'none', xl: 'flex' },
          alignItems: 'center',
          gap: 1.5,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.68rem',
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(15, 23, 42, 0.35)',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        [TEL_STREAM: 16 PASSIVE ENGINES ACTIVE // ZERO COMPROMISE]
        <Box component="span" sx={{ color: '#22C55E' }}>●</Box>
      </Box>

      {/* ─── MAIN HERO CONTAINER ─── */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'center', gap: { xs: 8, lg: 6 } }}>
          
          {/* HERO LEFT (50%) */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '0 0 50%' }, pr: { lg: 2 } }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              
              {/* Eyebrow */}
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.8,
                    py: 0.5,
                    borderRadius: 999,
                    bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                    border: isDark ? '1px solid rgba(220, 38, 38, 0.28)' : '1px solid rgba(220, 38, 38, 0.22)',
                  }}
                >
                  <Box
                    component={motion.div}
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: CR }}
                  />
                  <Typography
                    sx={{
                      color: CR,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      fontSize: '0.72rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      textTransform: 'uppercase',
                    }}
                  >
                    AI-DRIVEN SOAR-XDR PLATFORM
                  </Typography>
                </Box>
                <Chip
                  label="v2.4 PRODUCTION"
                  size="small"
                  sx={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    bgcolor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                    color: '#22C55E',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    borderRadius: 999,
                  }}
                />
              </Box>

              {/* Headline */}
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.2rem', lg: '4.6rem' },
                  lineHeight: { xs: 1.1, sm: 1.06, md: 1.05 },
                  letterSpacing: '-0.03em',
                  color: isDark ? '#FFFFFF' : '#0B0B0F',
                  mb: { xs: 2.5, md: 3 },
                }}
              >
                Security that<br />
                <Box component="span" sx={{ color: CR }}>understands</Box><br />
                what's happening.
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.68)' : '#475569',
                  fontSize: { xs: '0.98rem', sm: '1.1rem', md: '1.25rem' },
                  lineHeight: { xs: 1.55, sm: 1.65 },
                  maxWidth: 540,
                  mb: { xs: 3.5, md: 5 },
                }}
              >
                Engineered by <strong>Swastik Chemical (India)</strong>. KAVACH combines 16 passive telemetry collectors, intelligent MITRE ATT&CK correlation, and automated SOAR response into one sovereign security environment.
              </Typography>

              {/* CTAs */}
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 1.5, sm: 2 }}
                mb={{ xs: 4, md: 5 }}
                sx={{ width: { xs: '100%', md: 'auto' } }}
              >
                <Button
                  onClick={() => navigate('/get-started')}
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  fullWidth
                  sx={{
                    width: { sm: 'auto' },
                    bgcolor: CR,
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    fontFamily: 'Outfit, sans-serif',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    height: 48,
                    boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.45)',
                    '&:hover': {
                      bgcolor: '#B91C1C',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 12px 28px -4px rgba(220, 38, 38, 0.65)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Get Started
                </Button>
                <Button
                  onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })}
                  fullWidth
                  sx={{
                    width: { sm: 'auto' },
                    color: isDark ? '#FFFFFF' : '#0B0B0F',
                    fontWeight: 700,
                    fontSize: '1rem',
                    fontFamily: 'Outfit, sans-serif',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
                    boxSizing: 'border-box',
                    height: 48,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                      borderColor: CR,
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Explore Platform
                </Button>
              </Stack>

              {/* Trust Row: 2x2 on mobile, 4 columns on desktop */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                  gap: { xs: 1.5, sm: 2, md: 3 },
                  width: '100%',
                }}
              >
                {[
                  '16 Telemetry Collectors',
                  'MITRE ATT&CK Mapping',
                  'Sub-Second SOAR Actions',
                  'Raksha AI Copilot',
                ].map((item, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={1}>
                    <CheckCircle sx={{ color: CR, fontSize: 16, flexShrink: 0 }} />
                    <Typography
                      sx={{
                        color: isDark ? 'rgba(255,255,255,0.7)' : '#64748B',
                        fontSize: { xs: '0.78rem', sm: '0.85rem' },
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>

            </motion.div>
          </Box>

          {/* HERO RIGHT (50%): Sovereign Radar & Defense Console */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '0 0 50%' }, width: '100%' }}>
            <SovereignRadarConsole isDark={isDark} />
          </Box>

        </Box>
      </Container>
    </Box>
  );
};
