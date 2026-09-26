import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton, Button, Chip, Divider, Stack
} from '@mui/material';
import {
  Close, Shield, CheckCircle, Warning, TrendingDown, ArrowForward, Update, Security
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

interface SecurityShieldModalProps {
  open: boolean;
  onClose: () => void;
  score: number;
  isDark: boolean;
  onOpenFix?: () => void;
}

export const SecurityShieldModal: React.FC<SecurityShieldModalProps> = ({
  open,
  onClose,
  score,
  isDark,
  onOpenFix,
}) => {
  const cardBg = isDark ? '#12141D' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: isDark ? '#0A0B10' : '#FFFFFF',
          border: `1px solid ${borderColor}`,
          backgroundImage: 'none',
          boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.8)' : '0 20px 50px rgba(15,23,42,0.12)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SAFE,
            }}
          >
            <Shield sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              KAVACH Security Shield
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Live Posture & Score Breakdown
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        {/* Score Hero Banner */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            mb: 3,
            bgcolor: cardBg,
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
              <Typography
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontSize: '2.8rem',
                  lineHeight: 1,
                  color: score >= 80 ? SAFE : WARN,
                }}
              >
                {score}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '1.1rem' }}>
                / 100
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
              Your device is protected
            </Typography>
          </Box>

          <Chip
            icon={<CheckCircle sx={{ fontSize: '16px !important', color: `${SAFE} !important` }} />}
            label="OPTIMAL"
            sx={{
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              color: SAFE,
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.72rem',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              px: 1,
            }}
          />
        </Box>

        {/* Recent Change Notification */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2.5,
            mb: 3,
            bgcolor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
          }}
        >
          <TrendingDown sx={{ color: WARN, fontSize: 20, mt: 0.3 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: isDark ? '#FDE68A' : '#92400E' }}>
              Recent Score Change: 97 → {score}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#78350F', mt: 0.2 }}>
              Your score decreased by 3 points because one application requires an urgent security update.
            </Typography>
          </Box>
        </Box>

        {/* Why the Score is 94: Positive Factors */}
        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5, textTransform: 'uppercase' }}>
          Positive Security Factors
        </Typography>
        <Stack spacing={1} mb={3}>
          {[
            { label: 'Windows Defender Kernel Shield Active', points: '+20 pts', icon: <CheckCircle sx={{ color: SAFE, fontSize: 18 }} /> },
            { label: 'WFP Firewall Inbound / Outbound Hardened', points: '+15 pts', icon: <CheckCircle sx={{ color: SAFE, fontSize: 18 }} /> },
            { label: 'Zero Active Malware / Uncontained Breaches', points: '+25 pts', icon: <CheckCircle sx={{ color: SAFE, fontSize: 18 }} /> },
            { label: 'Encrypted DNS (DoH) & URL Shield Active', points: '+15 pts', icon: <CheckCircle sx={{ color: SAFE, fontSize: 18 }} /> },
            { label: 'USB & External Storage Auto-Inspection', points: '+10 pts', icon: <CheckCircle sx={{ color: SAFE, fontSize: 18 }} /> },
          ].map((item, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.4,
                px: 2,
                borderRadius: 2,
                bgcolor: cardBg,
                border: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                {item.icon}
                <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: 'text.primary' }}>
                  {item.label}
                </Typography>
              </Box>
              <Typography sx={{ color: SAFE, fontWeight: 700, fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
                {item.points}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Issues Affecting the Score */}
        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5, textTransform: 'uppercase' }}>
          Issues Affecting Score
        </Typography>
        <Box
          sx={{
            p: 1.8,
            borderRadius: 2,
            bgcolor: cardBg,
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.2}>
            <Warning sx={{ color: WARN, fontSize: 18 }} />
            <Box>
              <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: 'text.primary' }}>
                1 Outdated Application
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Google Chrome v127 requires patch update to v128
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: CR, fontWeight: 700, fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
            -3 pts
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            onClose();
            if (onOpenFix) onOpenFix();
          }}
          startIcon={<Update />}
          sx={{
            bgcolor: CR,
            color: '#FFFFFF',
            fontWeight: 800,
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            '&:hover': { bgcolor: '#B91C1C' },
          }}
        >
          Fix Application Update (+3 pts)
        </Button>
      </DialogActions>
    </Dialog>
  );
};
