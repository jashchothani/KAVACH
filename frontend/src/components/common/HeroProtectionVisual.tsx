import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, Stack, Button, useTheme, Grid, Tooltip,
} from '@mui/material';
import {
  Shield, Laptop, Computer, PhoneIphone, Cloud, CheckCircle,
  Warning, BugReport, Lock, Storage, PlayArrow, VerifiedUser,
  Router, Security, FiberManualRecord,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const HeroProtectionVisual: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [simulating, setSimulating] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  const handleSimulateDeflection = () => {
    if (simulating) return;
    setSimulating(true);
    setPulseCount((prev) => prev + 1);
    setTimeout(() => {
      setSimulating(false);
    }, 2400);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 650, mx: 'auto' }}>
      {/* Main Protection Enclosure Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          p: { xs: 2.5, sm: 3.5 },
          bgcolor: isDark ? '#0E1526' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.95)',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 20px 40px -15px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Background Circuit / Radar Rings */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: isDark ? 0.35 : 0.45,
            background: `
              radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.06) 0%, transparent 60%),
              radial-gradient(circle at 50% 50%, transparent 220px, rgba(226, 232, 240, 0.5) 221px, transparent 222px)
            `,
          }}
        />

        {/* Top Header Strip: Zone Indicator & Simulate Button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} position="relative" zIndex={2}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#16a34a',
                boxShadow: '0 0 8px rgba(22, 163, 74, 0.6)',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Perimeter Defense • Active Barrier
            </Typography>
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={handleSimulateDeflection}
            disabled={simulating}
            startIcon={<PlayArrow fontSize="small" />}
            sx={{
              borderColor: 'rgba(220, 38, 38, 0.4)',
              color: '#DC2626',
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              textTransform: 'none',
              px: 1.5,
              py: 0.4,
              '&:hover': {
                borderColor: '#DC2626',
                bgcolor: 'rgba(220, 38, 38, 0.06)',
              },
            }}
          >
            {simulating ? 'Deflecting Threat...' : 'Test Deflection'}
          </Button>
        </Box>

        {/* Outer Threat Perimeter Notice */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 1.5,
            py: 0.8,
            mb: 2,
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.8)',
            border: '1px dashed',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 800, fontSize: '0.72rem' }}>
            OUTSIDE PERIMETER: INBOUND THREATS BLOCKED
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Sub-12ms DAG Quarantine
          </Typography>
        </Box>

        {/* Outer Threat Tags (Simulating blocked threats around outside) */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {[
            { label: 'Phishing URL [Blocked]', tag: 'HTTP' },
            { label: 'Ransomware .crypt [Deflected]', tag: 'EBPF' },
            { label: 'Port 445 Exploit [Denied]', tag: 'SMB' },
            { label: 'Untrusted .ps1 [Quarantined]', tag: 'SYSMON' },
          ].map((threat, idx) => (
            <Chip
              key={idx}
              label={threat.label}
              size="small"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                color: '#DC2626',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                height: 24,
              }}
            />
          ))}
        </Box>

        {/* ========================================================================= */}
        {/* Central Shield Protection Boundary                                        */}
        {/* ========================================================================= */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
            border: '2px solid',
            borderColor: simulating ? '#DC2626' : 'rgba(34, 197, 94, 0.4)',
            boxShadow: simulating
              ? '0 0 30px rgba(220, 38, 38, 0.25)'
              : '0 4px 20px rgba(34, 197, 94, 0.08)',
            transition: 'all 0.35s ease',
            position: 'relative',
          }}
        >
          {/* Inner Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Lock sx={{ color: '#16a34a', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a', letterSpacing: '0.05em' }}>
                INSIDE: PROTECTED MULTI-DEVICE ENVIRONMENT
              </Typography>
            </Box>
            <Chip
              label="Zero Compromise"
              size="small"
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.12)',
                color: '#16a34a',
                fontWeight: 800,
                fontSize: '0.68rem',
                height: 20,
              }}
            />
          </Box>

          {/* Central KAVACH Shield Emblem */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #DC2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: simulating
                  ? '0 0 25px rgba(220, 38, 38, 0.6)'
                  : '0 8px 25px rgba(220, 38, 38, 0.3)',
                transform: simulating ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }}
            >
              <Shield sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1, fontFamily: 'Outfit', color: 'text.primary' }}>
              KAVACH Real-Time Defense Shield
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Automated deflection pipeline • Powered by Swastik Chemical (India)
            </Typography>
          </Box>

          {/* Grid of Protected Devices Inside the Sanctuary */}
          <Grid container spacing={1.5}>
            {/* 1. Laptop */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226, 232, 240, 0.9)',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <Laptop sx={{ color: '#0284c7', fontSize: 26, mb: 0.3 }} />
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                  Laptop
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem' }}>
                  Win 11 / Mac
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                  <CheckCircle sx={{ color: '#16a34a', fontSize: 12 }} />
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }}>
                    Safe
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* 2. Desktop PC */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226, 232, 240, 0.9)',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <Computer sx={{ color: '#7c3aed', fontSize: 26, mb: 0.3 }} />
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                  Desktop
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem' }}>
                  Sysmon EIDs
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                  <CheckCircle sx={{ color: '#16a34a', fontSize: 12 }} />
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }}>
                    Shielded
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* 3. Mobile Sentinel */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226, 232, 240, 0.9)',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <PhoneIphone sx={{ color: '#16a34a', fontSize: 26, mb: 0.3 }} />
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                  Mobile
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem' }}>
                  iOS & Android
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                  <CheckCircle sx={{ color: '#16a34a', fontSize: 12 }} />
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }}>
                    Active
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* 4. Cloud Server */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226, 232, 240, 0.9)',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <Cloud sx={{ color: '#f59e0b', fontSize: 26, mb: 0.3 }} />
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                  Cloud Hub
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem' }}>
                  OT Gateway
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                  <CheckCircle sx={{ color: '#16a34a', fontSize: 12 }} />
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }}>
                    Online
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Visual Storytelling Message Line */}
        <Box
          sx={{
            mt: 2.5,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1, sm: 1.5 },
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#DC2626' }}>
            1. THREAT DETECTED
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>→</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#f59e0b' }}>
            2. AI ISOLATION
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>→</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#DC2626' }}>
            3. KAVACH SHIELD
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>→</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a' }}>
            4. SAFE DEVICE
          </Typography>
        </Box>
      </Paper>

      {/* ========================================================================= */}
      {/* Floating Security Status Card (Partially Overlapping Bottom Left)         */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          position: { xs: 'relative', md: 'absolute' },
          bottom: { md: -25 },
          left: { md: -20 },
          mt: { xs: 2, md: 0 },
          width: { xs: '100%', sm: 260 },
          p: 2,
          borderRadius: 3.5,
          bgcolor: isDark ? '#111827' : '#FFFFFF',
          border: '1px solid',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.12)',
          zIndex: 10,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2} mb={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
            }}
          >
            <Shield sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em' }}>
              KAVACH PROTECTION
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              Your device is protected
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between" pt={1} borderTop="1px solid" borderColor="divider">
          <Box display="flex" alignItems="center" gap={0.8}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: '#16a34a',
              }}
            />
            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }}>
              All systems secure
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Last checked 2 min ago
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
