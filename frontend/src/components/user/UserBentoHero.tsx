import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import {
  Shield, AutoAwesome, Security, TaskAlt
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

interface UserBentoHeroProps {
  score: number;
  status: 'PROTECTED' | 'ATTENTION' | 'CRITICAL';
  threatsDetected: number;
  totalAlerts: number;
  isDark: boolean;
  onOpenShieldModal: () => void;
  onOpenSecureDeviceModal: () => void;
  onOpenLockdownModal: () => void;
}

export const UserBentoHero: React.FC<UserBentoHeroProps> = ({
  score,
  status,
  threatsDetected,
  totalAlerts,
  isDark,
  onOpenShieldModal,
  onOpenSecureDeviceModal,
  onOpenLockdownModal,
}) => {
  const cardBg = isDark ? '#12141F' : '#FFFFFF';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  
  // Decide hero text and colors based on actual state
  const isProtected = status === 'PROTECTED';
  const headerText = isProtected ? 'Your device is currently protected.' : 'KAVACH detected a few things that need your attention.';
  const colorGrad = isProtected 
    ? 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #059669 100%)' // Green gradient if safe
    : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FF5252 100%)'; // Red if attention

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 2.5, mb: 3 }}>
      {/* ─── LEFT HERO CARD ─── */}
      <Box
        component={motion.div}
        whileHover={{ scale: 1.008 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        onClick={onOpenShieldModal}
        sx={{
          borderRadius: 4,
          p: { xs: 3, md: 3.5 },
          background: colorGrad,
          color: '#FFFFFF',
          cursor: 'pointer',
          boxShadow: isProtected ? '0 20px 48px -12px rgba(16, 185, 129, 0.45)' : '0 20px 48px -12px rgba(255, 107, 107, 0.45)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 290,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.15)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        <Box display="flex" justifyContent="space-between" alignItems="center" zIndex={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Shield sx={{ fontSize: 22 }} />
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Your Security Overview
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1.5,
              py: 0.4,
              borderRadius: 999,
              bgcolor: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(8px)',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
            }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#FFFFFF' }} />
            {isProtected ? 'Secure' : 'Needs Attention'}
          </Box>
        </Box>

        <Box my={2} zIndex={2}>
          <Box display="flex" alignItems="baseline" gap={1}>
            <Typography
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: { xs: '3.4rem', sm: '4.2rem' },
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {score}
            </Typography>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, opacity: 0.8 }}>
              / 100
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, opacity: 0.95, mt: 0.5 }}>
            {headerText}
          </Typography>
        </Box>

        <svg
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            width: '100%',
            height: '70px',
            pointerEvents: 'none',
            opacity: 0.45,
          }}
          viewBox="0 0 400 70"
          preserveAspectRatio="none"
        >
          <path d="M0,35 C100,60 200,10 300,45 C350,55 380,30 400,35" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M0,50 C120,20 220,60 320,30 C360,20 380,45 400,40" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
        </svg>

        <Box
          display="flex"
          justifyContent="space-between"
          pt={2}
          borderTop="1px solid rgba(255, 255, 255, 0.25)"
          zIndex={2}
        >
          <Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85 }}>DEVICE PROTECTION</Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 900 }}>{isProtected ? 'Optimal' : 'Checking'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85 }}>NETWORK SAFETY</Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 900 }}>Secure</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85 }}>LAST SCAN</Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 900 }}>Today</Typography>
          </Box>
        </Box>
      </Box>

      {/* ─── RIGHT CARDS GRID ─── */}
      <Box sx={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 2.5 }}>
        {/* Top Status & Donut Card */}
        <Box
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: cardBg,
            border: `1px solid ${border}`,
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 10px 30px rgba(15,23,42,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', fontWeight: 800, letterSpacing: '0.05em' }}>
              SECURITY EVENTS
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1} my={0.5}>
              <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.4rem', color: 'text.primary', lineHeight: 1 }}>
                {totalAlerts}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 800 }}>
                ALERTS
              </Typography>
            </Box>
            <Box display="flex" gap={2} mt={1}>
              <Box>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>Attention</Typography>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: threatsDetected > 0 ? CR : SAFE }}>
                  {threatsDetected > 0 ? `${threatsDetected} Threats` : '0 Threats'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>System Health</Typography>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: SAFE }}>Good</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ position: 'relative', width: 96, height: 96, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="96" height="96" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'}
                strokeWidth="4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={isProtected ? SAFE : CR}
                strokeWidth="4"
                strokeDasharray={`${score}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <Box
              sx={{
                position: 'absolute',
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: isProtected ? SAFE : CR,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${isProtected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 107, 107, 0.4)'}`,
              }}
            >
              {isProtected ? <TaskAlt sx={{ fontSize: 16 }} /> : <Security sx={{ fontSize: 16 }} />}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: cardBg,
            border: `1px solid ${border}`,
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 10px 30px rgba(15,23,42,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box
                component={motion.div}
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: SAFE, boxShadow: `0 0 12px ${SAFE}` }}
              />
              <Typography sx={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '0.75rem', color: SAFE }}>
                STATUS: MONITORED
              </Typography>
            </Box>

            <Button
              size="small"
              onClick={onOpenLockdownModal}
              sx={{ color: CR, fontWeight: 700, fontSize: '0.72rem', textTransform: 'none', p: 0 }}
            >
              Emergency Lockdown
            </Button>
          </Box>

          <Button
            variant="contained"
            onClick={onOpenSecureDeviceModal}
            startIcon={<AutoAwesome sx={{ fontSize: 20 }} />}
            sx={{
              py: 1.8,
              bgcolor: CR,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              fontFamily: 'Outfit, sans-serif',
              borderRadius: 3,
              textTransform: 'none',
              boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.45)',
              '&:hover': {
                bgcolor: '#B91C1C',
                transform: 'translateY(-1px)',
                boxShadow: '0 12px 28px -4px rgba(220, 38, 38, 0.65)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Run Security Scan
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
