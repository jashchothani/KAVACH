import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, Stack, Button, useTheme, Grid, Tooltip, IconButton
} from '@mui/material';
import {
  Shield, Laptop, Computer, PhoneIphone, Cloud, CheckCircle,
  Warning, BugReport, Lock, Memory, PlayArrow, Refresh, Security,
  FiberManualRecord, FlashOn, Storage
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreatSimulation {
  id: string;
  name: string;
  type: string;
  origin: string;
  status: 'incoming' | 'analyzing' | 'blocked' | 'contained';
  detail: string;
  latency: string;
}

const INITIAL_THREATS: ThreatSimulation[] = [
  {
    id: 't1',
    name: 'LockBit 3.0 Ransomware Heuristic',
    type: 'File Encryption Spikes',
    origin: '185.220.101.44 (External Port 445)',
    status: 'blocked',
    detail: 'Anomalous PE entropy detected on temp directory. Blocked before execution.',
    latency: '3.4ms',
  },
  {
    id: 't2',
    name: 'C2 Reverse Shell Beacon',
    type: 'Network Anomaly',
    origin: '198.51.100.12 (Outbound TCP 8443)',
    status: 'contained',
    detail: 'Known malicious domain pattern intercepted by DNS & socket collector.',
    latency: '5.1ms',
  },
  {
    id: 't3',
    name: 'Credential Brute-Force Spike',
    type: 'Auth Spraying',
    origin: '203.0.113.88 (RDP Port 3389)',
    status: 'blocked',
    detail: '50 rapid failed attempts triggered immediate IP null-routing at edge.',
    latency: '1.8ms',
  },
];

export const ProtectionShowcaseScene: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeStage, setActiveStage] = useState<'normal' | 'threat_detected' | 'analyzing' | 'protected'>('normal');
  const [shieldPulse, setShieldPulse] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<ThreatSimulation>(INITIAL_THREATS[0]);

  const triggerAttackSimulation = () => {
    setActiveStage('threat_detected');
    setShieldPulse(true);

    setTimeout(() => {
      setActiveStage('analyzing');
    }, 900);

    setTimeout(() => {
      setActiveStage('protected');
      setShieldPulse(false);
    }, 2200);

    setTimeout(() => {
      setActiveStage('normal');
    }, 4500);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        bgcolor: isDark ? 'rgba(10, 15, 29, 0.85)' : '#FFFFFF',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 8px 30px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: 'rgba(220, 38, 38, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}
          >
            <Shield sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit', lineHeight: 1.2 }}>
              KAVACH Multi-Device Shield Architecture
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Real-Time Boundary Defense: Threats deflected before reaching protected endpoints
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: 10, color: '#10B981 !important' }} />}
            label="Shield Barrier: Active"
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={triggerAttackSimulation}
            disabled={activeStage !== 'normal'}
            startIcon={<PlayArrow />}
            sx={{
              bgcolor: '#DC2626',
              fontWeight: 700,
              fontSize: '0.8rem',
              px: 2,
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            {activeStage === 'normal' ? 'Simulate Attack' : 'Defending...'}
          </Button>
        </Stack>
      </Box>

      {/* Main Interactive Stage */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Left: Protected Environment Inside the Shield */}
        <Grid item xs={12} lg={8}>
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              position: 'relative',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
              border: '2px solid',
              borderColor: activeStage === 'threat_detected'
                ? '#EF4444'
                : activeStage === 'analyzing'
                ? '#F59E0B'
                : activeStage === 'protected'
                ? '#10B981'
                : isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(220, 38, 38, 0.25)',
              transition: 'all 0.4s ease',
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Top Shield Status Pill */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Lock sx={{ fontSize: 16, color: '#10B981' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.5, color: '#10B981', textTransform: 'uppercase' }}>
                  Protected Digital Environment (Air-Gapped & Monitored)
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                KAVACH Core Agent v2.4 • Zero-Trust Zone
              </Typography>
            </Box>

            {/* Grid of 4 Protected Devices Inside the Perimeter */}
            <Grid container spacing={2}>
              {/* 1. Corporate Laptop */}
              <Grid item xs={6} sm={3}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
                    textAlign: 'center',
                  }}
                >
                  <Laptop sx={{ fontSize: 32, color: '#0284C7', mb: 0.5 }} />
                  <Typography variant="subtitle2" fontWeight={800}>
                    Laptop
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    macOS / Win11
                  </Typography>
                  <Chip label="Protected" size="small" sx={{ mt: 1, height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }} />
                </Paper>
              </Grid>

              {/* 2. Desktop Workstation */}
              <Grid item xs={6} sm={3}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
                    textAlign: 'center',
                  }}
                >
                  <Computer sx={{ fontSize: 32, color: '#7C3AED', mb: 0.5 }} />
                  <Typography variant="subtitle2" fontWeight={800}>
                    Desktop PC
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Sysmon EID 1-26
                  </Typography>
                  <Chip label="Protected" size="small" sx={{ mt: 1, height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }} />
                </Paper>
              </Grid>

              {/* 3. Mobile Device */}
              <Grid item xs={6} sm={3}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
                    textAlign: 'center',
                  }}
                >
                  <PhoneIphone sx={{ fontSize: 32, color: '#DC2626', mb: 0.5 }} />
                  <Typography variant="subtitle2" fontWeight={800}>
                    Mobile App
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    iOS / Android
                  </Typography>
                  <Chip label="Protected" size="small" sx={{ mt: 1, height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }} />
                </Paper>
              </Grid>

              {/* 4. Cloud Server */}
              <Grid item xs={6} sm={3}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
                    textAlign: 'center',
                  }}
                >
                  <Cloud sx={{ fontSize: 32, color: '#D97706', mb: 0.5 }} />
                  <Typography variant="subtitle2" fontWeight={800}>
                    Cloud Server
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Linux / Docker
                  </Typography>
                  <Chip label="Protected" size="small" sx={{ mt: 1, height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }} />
                </Paper>
              </Grid>
            </Grid>

            {/* Bottom Pipeline Bar: Threat -> Detection -> Analysis -> Protection */}
            <Box
              sx={{
                mt: 3,
                p: 1.8,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(2, 6, 23, 0.7)' : '#FFFFFF',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1, letterSpacing: 0.5 }}>
                AUTONOMOUS DEFENSE PIPELINE (SUB-12 MILLISECONDS)
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label="1. Inbound Threat"
                  size="small"
                  sx={{
                    bgcolor: activeStage === 'threat_detected' ? '#EF4444' : 'action.selected',
                    color: activeStage === 'threat_detected' ? '#FFFFFF' : 'text.primary',
                    fontWeight: 700,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>→</Typography>
                <Chip
                  label="2. Telemetry Detection"
                  size="small"
                  sx={{
                    bgcolor: activeStage === 'threat_detected' || activeStage === 'analyzing' ? '#F59E0B' : 'action.selected',
                    color: activeStage === 'threat_detected' || activeStage === 'analyzing' ? '#FFFFFF' : 'text.primary',
                    fontWeight: 700,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>→</Typography>
                <Chip
                  label="3. AI Analysis"
                  size="small"
                  sx={{
                    bgcolor: activeStage === 'analyzing' ? '#0284C7' : 'action.selected',
                    color: activeStage === 'analyzing' ? '#FFFFFF' : 'text.primary',
                    fontWeight: 700,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>→</Typography>
                <Chip
                  label="4. Shield Protected"
                  size="small"
                  sx={{
                    bgcolor: activeStage === 'protected' || activeStage === 'normal' ? '#10B981' : 'action.selected',
                    color: activeStage === 'protected' || activeStage === 'normal' ? '#FFFFFF' : 'text.primary',
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Box>
          </Box>
        </Grid>

        {/* Right: Detected Threats Log & Explanations */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Threat Intelligence Feed
            </Typography>

            {INITIAL_THREATS.map((threat) => {
              const isSelected = selectedThreat.id === threat.id;
              return (
                <Paper
                  key={threat.id}
                  onClick={() => setSelectedThreat(threat)}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    bgcolor: isSelected
                      ? isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.05)'
                      : isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: isSelected ? '#DC2626' : 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#DC2626',
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {threat.name}
                    </Typography>
                    <Chip
                      label={threat.status.toUpperCase()}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10B981',
                      }}
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Origin: {threat.origin} • Intercept: {threat.latency}
                  </Typography>

                  <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.4 }}>
                    {threat.detail}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
