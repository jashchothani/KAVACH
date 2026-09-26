import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Memory, Language, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';

const CR = '#DC2626';

// ─── Animated security ticker ─────────────────────────────────────────────────
const TICKER_ITEMS = [
  '✓ End-to-end TLS 1.3 encrypted',
  '✓ Zero-knowledge architecture',
  '✓ 16-layer telemetry monitoring',
  '✓ Sub-12ms threat response',
  '✓ MITRE ATT&CK coverage',
  '✓ SOC-grade analyst tools',
  '✓ India-sovereign data center',
  '✓ ML anomaly detection active',
];

// ─── Floating stat card ───────────────────────────────────────────────────────
const FloatingCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  y?: number;
  x?: number;
  delay?: number;
}> = ({ icon, label, value, y = 0, x = 0, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: y + 20, x }}
    animate={{ opacity: 1, y, x }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    style={{ position: 'absolute' }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2, py: 1.5,
        borderRadius: 3,
        bgcolor: 'rgba(18,18,26,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      <Box sx={{ color: CR }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.82rem', lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  </motion.div>
);

export const AuthLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        position: 'relative',
        bgcolor: '#FDFCFB',
        overflow: 'hidden',
      }}
    >
      {/* ── Home Button (Absolute Top Left) ──────────────────────────── */}
      <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 100 }}>
        <Button
          variant="text"
          onClick={() => navigate('/')}
          startIcon={<ArrowBack />}
          sx={{
            color: '#FFFFFF',
            fontWeight: 700,
            textTransform: 'none',
            bgcolor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            px: 2, py: 1,
            border: '1px solid rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          Back to Home
        </Button>
      </Box>

      {/* ── Left Panel (Dark Hero) ────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          width: '48%',
          minHeight: '100vh',
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: '#0B0B0F',
          position: 'relative',
          overflow: 'hidden',
          p: 5,
        }}
      >
        {/* Grid texture */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(220,38,38,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220,38,38,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          pointerEvents: 'none',
        }} />

        {/* Ambient glow */}
        <Box sx={{
          position: 'absolute', top: '30%', left: '20%',
          width: 500, height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(220,38,38,0.1) 0%, transparent 65%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        {/* Spacer for Home Button */}
        <Box sx={{ height: 60 }} />

        {/* Center hero text */}
        <Box sx={{ position: 'relative', py: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <Typography
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(2.4rem, 4vw, 4rem)',
                letterSpacing: '-0.04em',
                lineHeight: 1.04,
                color: '#FFFFFF',
                mb: 2.5,
              }}
            >
              Your organization's
              <br />
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${CR} 0%, #F87171 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                last line of defence.
              </Box>
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.45)', maxWidth: 380, lineHeight: 1.7, mb: 4 }}>
              Sign in to your KAVACH command center — real-time threat intelligence, AI-powered analysis, and automated response, unified.
            </Typography>

            {/* Feature checklist */}
            {[
              'All threats stopped before damage',
              'Plain English for everyone',
              'Full SOC power for analysts',
              'One system for every endpoint',
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <CheckCircle sx={{ fontSize: 16, color: '#22C55E' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    {item}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </motion.div>

          {/* Floating stats */}
          <Box sx={{ position: 'absolute', right: -60, top: '10%', width: 200, height: 300 }}>
            <FloatingCard
              icon={<Shield sx={{ fontSize: 18 }} />}
              label="Protection Status"
              value="ACTIVE"
              y={0}
              x={0}
              delay={0.5}
            />
            <FloatingCard
              icon={<Memory sx={{ fontSize: 18 }} />}
              label="Collectors Online"
              value="16 / 16"
              y={90}
              x={20}
              delay={0.65}
            />
            <FloatingCard
              icon={<Language sx={{ fontSize: 18 }} />}
              label="URLs Scanned Today"
              value="1,247"
              y={180}
              x={0}
              delay={0.8}
            />
          </Box>
        </Box>

        {/* Bottom ticker */}
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              gap: 4,
              width: 'max-content',
              animation: 'ticker-slide 30s linear infinite',
              '&:hover': { animationPlayState: 'paused' },
            }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <Typography
                key={i}
                variant="caption"
                sx={{
                  color: i % 3 === 0 ? CR : 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.03em',
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          {/* Fade masks */}
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 40,
            background: 'linear-gradient(90deg, #0B0B0F, transparent)',
          }} />
          <Box sx={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 40,
            background: 'linear-gradient(-90deg, #0B0B0F, transparent)',
          }} />
        </Box>

      </Box>

      {/* ── Right Panel (Auth Form) ───────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5, lg: 6 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mobile Home Button if left panel is hidden */}
        <Box sx={{ display: { xs: 'block', lg: 'none' }, position: 'absolute', top: 16, left: 16, zIndex: 100 }}>
           <Button
             variant="text"
             onClick={() => navigate('/')}
             startIcon={<ArrowBack />}
             sx={{ color: '#0B0B0F', fontWeight: 700, textTransform: 'none' }}
           >
             Home
           </Button>
        </Box>

        {/* Subtle background dots */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(11,11,15,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />
        {/* Ambient glow */}
        <Box sx={{
          position: 'absolute',
          top: '-15%', right: '10%',
          width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(220,38,38,0.07) 0%, transparent 65%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '-15%', left: '5%',
          width: 350, height: 350,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
