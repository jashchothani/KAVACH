import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, Alert } from '@mui/material';
import { Warning, Security, CheckCircle, Shield, Block } from '@mui/icons-material';

const CR = '#DC2626';
const SAFE = '#22C55E';

interface EmergencyLockdownModalProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const EmergencyLockdownModal: React.FC<EmergencyLockdownModalProps> = ({
  open,
  onClose,
  isDark,
}) => {
  const [lockedDown, setLockedDown] = useState(false);

  const handleActivate = () => {
    setLockedDown(true);
  };

  const handleDeactivate = () => {
    setLockedDown(false);
    onClose();
  };

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
          border: `1px solid ${lockedDown ? 'rgba(220, 38, 38, 0.4)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 3, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            bgcolor: 'rgba(220, 38, 38, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: CR,
          }}
        >
          <Warning sx={{ fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.2rem', color: CR }}>
            {lockedDown ? 'LOCKDOWN MODE ACTIVE' : 'EMERGENCY PROTECTION MODE'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Predefined Sovereign Host Isolation & Defensive Escalation
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        {lockedDown ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5, fontWeight: 600 }}>
            HOST ISOLATION ENGAGED: Outbound untrusted sockets are severed via Windows Filtering Platform (WFP). Legitimate local network & management channels remain active.
          </Alert>
        ) : (
          <Box mb={2}>
            <Typography sx={{ fontSize: '0.9rem', color: 'text.primary', mb: 1.5, lineHeight: 1.6 }}>
              Activating <strong>Emergency Lockdown Mode</strong> triggers sub-second defensive containment across your endpoints without disconnecting your active user session.
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: '1px solid rgba(220,38,38,0.2)' }}>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.7 }}>
                • <strong>WFP Firewall:</strong> Drops all unverified outbound IP sockets
                <br />• <strong>Kernel Watchdog:</strong> Halts any unsigned child processes
                <br />• <strong>Canary Traps:</strong> Engages high-priority cryptographic honeypots
                <br />• <strong>Sovereign Cloud:</strong> Dispatches forensic memory snapshot to SOC
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        {lockedDown ? (
          <Button
            variant="contained"
            onClick={handleDeactivate}
            sx={{ bgcolor: SAFE, color: '#FFFFFF', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#16A34A' } }}
          >
            Deactivate Lockdown
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleActivate}
            startIcon={<Shield />}
            sx={{ bgcolor: CR, color: '#FFFFFF', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            Activate Lockdown Mode
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
