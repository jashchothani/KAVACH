import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { Usb, CheckCircle, Warning, Security, History } from '@mui/icons-material';

const CR = '#DC2626';
const SAFE = '#22C55E';

export const UsbSecurityView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const history = [
    { device: 'SanDisk Ultra 3.0 (64 GB)', time: 'Connected Today at 10:32 AM', status: 'clean', details: 'Automated sector scan complete • 0 autorun payloads • Zero anomalies' },
    { device: 'Kingston DataTraveler (16 GB)', time: 'Disconnected Yesterday at 04:20 PM', status: 'clean', details: 'Clean disconnect • All file transfers signed' },
  ];

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
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SAFE,
            }}
          >
            <Usb sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              USB & External Device Security
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Hardware Peripheral Monitoring, BadUSB Protection & Storage Scans
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<CheckCircle sx={{ fontSize: '14px !important', color: `${SAFE} !important` }} />}
          label="USB Shield Active"
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

      {/* Active USB Card */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3.5,
          bgcolor: isDark ? '#12141F' : '#F8FAFC',
          border: `1px solid ${border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
              border: `1px solid ${border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SAFE,
            }}
          >
            <Usb sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'text.primary' }}>
              SanDisk Ultra 3.0 (64 GB)
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
              Mounted as E:\ • Connected Today at 10:32 AM
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<CheckCircle sx={{ fontSize: '14px !important', color: `${SAFE} !important` }} />}
          label="NO SUSPICIOUS ACTIVITY DETECTED"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            fontSize: '0.68rem',
            bgcolor: 'rgba(34, 197, 94, 0.12)',
            color: SAFE,
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        />
      </Box>

      {/* History */}
      <Box>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5 }}>
          Peripheral Connection History
        </Typography>

        <Stack spacing={1.5}>
          {history.map((h, i) => (
            <Box
              key={i}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FDFCFB',
                border: `1px solid ${border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.primary' }}>
                  {h.device}
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.2 }}>
                  {h.time} • {h.details}
                </Typography>
              </Box>

              <Chip
                label="VERIFIED"
                size="small"
                sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: SAFE, fontWeight: 800, fontSize: '0.65rem' }}
              />
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
