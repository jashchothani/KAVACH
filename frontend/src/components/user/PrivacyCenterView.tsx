import React, { useState } from 'react';
import { Box, Typography, Chip, Switch, Button, Stack, LinearProgress, Divider } from '@mui/material';
import {
  Lock, Videocam, Mic, LocationOn, Language, Apps, Shield, CheckCircle, Warning, Done
} from '@mui/icons-material';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export const PrivacyCenterView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [privacyScore, setPrivacyScore] = useState(78);
  const [permissions, setPermissions] = useState([
    { id: 'cam', name: 'Camera Access', desc: 'Active only when foreground conferencing apps request', icon: <Videocam />, status: 'safe', enabled: true },
    { id: 'mic', name: 'Microphone Access', desc: '1 background application has persistent listening permission', icon: <Mic />, status: 'warning', enabled: true, issue: 'VoiceRecorder.exe listening in background' },
    { id: 'loc', name: 'Location Services', desc: 'Blocked for untrusted apps • Precise GPS obscured', icon: <LocationOn />, status: 'safe', enabled: false },
    { id: 'browser', name: 'Browser Tracking & Cookies', desc: 'Cross-site trackers blocked • Fingerprinting prevented', icon: <Language />, status: 'safe', enabled: true },
    { id: 'unknown', name: 'Unknown App Data Collection', desc: 'Telemetry harvesting disabled across all local apps', icon: <Apps />, status: 'safe', enabled: true },
  ]);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const handleFixMic = () => {
    setPermissions(prev => prev.map(p => p.id === 'mic' ? { ...p, status: 'safe', issue: undefined, desc: 'Restricted to foreground conferencing only' } : p));
    setPrivacyScore(96);
  };

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        bgcolor: cardBg,
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(15,23,42,0.06)',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              bgcolor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A855F7',
            }}
          >
            <Lock sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              Privacy Center
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Hardware Sensors, App Permissions & Data Collection Protections
            </Typography>
          </Box>
        </Box>

        <Chip
          label="Sovereign DPDP 2023 Compliant"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            fontSize: '0.68rem',
            bgcolor: 'rgba(34, 197, 94, 0.1)',
            color: SAFE,
            border: `1px solid rgba(34, 197, 94, 0.25)`,
          }}
        />
      </Box>

      {/* Privacy Score Card */}
      <Box
        sx={{
          p: 3,
          borderRadius: 3.5,
          bgcolor: isDark ? '#12141F' : '#F8FAFC',
          border: `1px solid ${border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em', mb: 0.5 }}>
            PRIVACY STATUS
          </Typography>
          <Box display="flex" alignItems="baseline" gap={1}>
            <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.5rem', color: privacyScore >= 80 ? SAFE : WARN, lineHeight: 1 }}>
              {privacyScore}
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: 'text.secondary', fontWeight: 700 }}>
              / 100
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
            {privacyScore >= 90 ? 'Optimal privacy configuration.' : '1 permission requires hardening for complete privacy.'}
          </Typography>
        </Box>

        {privacyScore < 90 && (
          <Button
            variant="contained"
            onClick={handleFixMic}
            sx={{
              bgcolor: CR,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              borderRadius: 2,
              px: 2.5,
              py: 1,
              textTransform: 'none',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Harden Microphone (+18 pts)
          </Button>
        )}
      </Box>

      {/* Permissions List */}
      <Stack spacing={1.5}>
        {permissions.map((p) => {
          const isSafe = p.status === 'safe';
          return (
            <Box
              key={p.id}
              sx={{
                p: 2,
                px: 2.5,
                borderRadius: 2.5,
                bgcolor: p.status === 'warning'
                  ? (isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)')
                  : (isDark ? 'rgba(255,255,255,0.02)' : '#FDFCFB'),
                border: `1px solid ${p.status === 'warning' ? 'rgba(245, 158, 11, 0.3)' : border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSafe ? SAFE : WARN,
                  }}
                >
                  {p.icon}
                </Box>
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: 'text.primary' }}>
                      {p.name}
                    </Typography>
                    {isSafe ? (
                      <CheckCircle sx={{ color: SAFE, fontSize: 16 }} />
                    ) : (
                      <Warning sx={{ color: WARN, fontSize: 16 }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.2 }}>
                    {p.desc}
                  </Typography>
                  {p.issue && (
                    <Typography sx={{ fontSize: '0.74rem', color: WARN, fontWeight: 700, mt: 0.4 }}>
                      ⚠ {p.issue}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={isSafe ? 'SECURE' : 'REVIEW'}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    bgcolor: isSafe ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                    color: isSafe ? SAFE : WARN,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
