import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, Chip } from '@mui/material';
import { Shield, CheckCircle, QrCode, ContentCopy, Share, Close } from '@mui/icons-material';

const SAFE = '#22C55E';
const CR = '#DC2626';

interface SecurityPassportModalProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const SecurityPassportModal: React.FC<SecurityPassportModalProps> = ({
  open,
  onClose,
  isDark,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('KAVACH-PASSPORT-ID: SWSTK-IN-94-2026-SECURED');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: isDark ? '#0A0B10' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.8)' : '0 20px 50px rgba(15,23,42,0.12)',
        },
      }}
    >
      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        {/* Passport Card */}
        <Box
          sx={{
            p: 3.5,
            borderRadius: 3.5,
            background: isDark
              ? 'linear-gradient(135deg, #181B28 0%, #0F121C 100%)'
              : 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)',
            border: `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Watermark Seal */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 140,
              height: 140,
              borderRadius: '50%',
              bgcolor: 'rgba(220, 38, 38, 0.04)',
              border: '1px dashed rgba(220, 38, 38, 0.2)',
              pointerEvents: 'none',
            }}
          />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <Shield sx={{ color: CR, fontSize: 22 }} />
              <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.08em' }}>
                KAVACH PASSPORT
              </Typography>
            </Box>
            <Chip
              label="VERIFIED"
              size="small"
              sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: SAFE, fontWeight: 900, fontSize: '0.62rem' }}
            />
          </Box>

          <Typography sx={{ fontSize: '2.5rem', mb: 0.5 }}>💻</Typography>
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: 'text.primary', mb: 0.2 }}>
            JASH LAPTOP
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', fontFamily: 'JetBrains Mono', mb: 2 }}>
            SWSTK-LPT-0492 • Windows 11
          </Typography>

          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, mb: 2 }}>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 800 }}>SECURITY POSTURE</Typography>
            <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2rem', color: SAFE }}>
              94 / 100
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: SAFE }}>
              🟢 FULLY PROTECTED
            </Typography>
          </Box>

          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
            Protected since August 2026 • Swastik Chemical Sovereign Defense
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleCopy}
          startIcon={<ContentCopy />}
          sx={{
            bgcolor: CR,
            color: '#FFFFFF',
            fontWeight: 800,
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': { bgcolor: '#B91C1C' },
          }}
        >
          {copied ? 'Copied ID!' : 'Share Passport'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
