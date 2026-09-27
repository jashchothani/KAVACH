import React, { useState } from 'react';
import {
  Box, Typography, Chip, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert
} from '@mui/material';
import {
  Person, Security, CheckCircle, Warning, VpnKey, Devices,
  ExitToApp, ErrorOutlined, Shield
} from '@mui/icons-material';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export const AccountSecurityView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [sessions, setSessions] = useState([
    { id: 'sess-1', device: 'Windows 11 PC (SWSTK-LPT-0492)', location: 'Mumbai, India', current: true, ip: '192.168.1.104', time: 'Active now' },
    { id: 'sess-2', device: 'Android Phone (Pixel 8)', location: 'Mumbai, India', current: false, ip: '192.168.1.230', time: '2 hours ago' },
  ]);

  const [logins, setLogins] = useState([
    { id: 'log-1', time: '10:32 AM Today', device: 'Windows PC (SWSTK-LPT-0492)', ip: '192.168.1.104', status: 'success', title: 'Successful Login' },
    { id: 'log-2', time: '12:41 PM Today', device: 'Windows PC (SWSTK-LPT-0492)', ip: '192.168.1.104', status: 'success', title: 'Successful Session Refresh' },
    { id: 'log-3', time: '03:12 PM Today', device: 'Unknown Browser (IP 185.220.101.4)', ip: '185.220.101.4', status: 'failed', title: 'Failed Login Attempt' },
  ]);

  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputedSuccess, setDisputedSuccess] = useState(false);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const handleSignOutOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.current));
  };

  const handleDispute = () => {
    setDisputeDialogOpen(false);
    setDisputedSuccess(true);
    setLogins(prev => prev.filter(l => l.id !== 'log-3'));
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
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SAFE,
            }}
          >
            <Person sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              Account Security & Login Activity
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              MFA Authentication, Active Sessions & Incident Dispute Workflows
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<CheckCircle sx={{ fontSize: '14px !important', color: `${SAFE} !important` }} />}
          label="MFA Protected"
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

      {disputedSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600 }}>
          Incident reported! Suspicious IP 185.220.101.4 has been blacklisted across the sovereign network shield.
        </Alert>
      )}

      {/* Account Status Card */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3.5,
          bgcolor: isDark ? '#12141F' : '#F8FAFC',
          border: `1px solid ${border}`,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800 }}>MFA STATUS</Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: SAFE, mt: 0.3 }}>
            ✓ Multi-Factor Active
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800 }}>PASSWORD HEALTH</Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: SAFE, mt: 0.3 }}>
            Strong (Changed 24d ago)
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800 }}>ACTIVE SESSIONS</Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: 'text.primary', mt: 0.3 }}>
            {sessions.length} Authorized Devices
          </Typography>
        </Box>
      </Box>

      {/* Active Sessions */}
      <Box mb={3.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
            Active Sessions ({sessions.length})
          </Typography>
          {sessions.length > 1 && (
            <Button
              size="small"
              onClick={handleSignOutOtherSessions}
              startIcon={<ExitToApp sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: CR }}
            >
              Sign out other sessions
            </Button>
          )}
        </Box>

        <Stack spacing={1}>
          {sessions.map((sess) => (
            <Box
              key={sess.id}
              sx={{
                p: 1.8,
                px: 2.2,
                borderRadius: 2.5,
                bgcolor: cardBg,
                border: `1px solid ${border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Devices sx={{ color: sess.current ? SAFE : 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: 'text.primary' }}>
                    {sess.device} {sess.current && '(This Device)'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>
                    {sess.location} • {sess.ip} • {sess.time}
                  </Typography>
                </Box>
              </Box>

              {sess.current && (
                <Chip label="CURRENT" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: SAFE, fontWeight: 800, fontSize: '0.62rem' }} />
              )}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Login Activity Timeline (Feature 15) */}
      <Box>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5 }}>
          Recent Login Activity
        </Typography>

        <Stack spacing={1.5}>
          {logins.map((log) => {
            const isFailed = log.status === 'failed';
            return (
              <Box
                key={log.id}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: isFailed ? (isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.05)') : cardBg,
                  border: `1px solid ${isFailed ? 'rgba(220, 38, 38, 0.3)' : border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {isFailed ? (
                    <Warning sx={{ color: CR, fontSize: 22 }} />
                  ) : (
                    <CheckCircle sx={{ color: SAFE, fontSize: 22 }} />
                  )}
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: isFailed ? CR : 'text.primary' }}>
                        {log.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', fontFamily: 'JetBrains Mono, monospace' }}>
                        {log.time}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.2 }}>
                      {log.device} • IP: {log.ip}
                    </Typography>
                  </Box>
                </Box>

                {isFailed && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setDisputeDialogOpen(true)}
                    sx={{
                      bgcolor: CR,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#B91C1C' },
                    }}
                  >
                    This wasn't me
                  </Button>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* "This wasn't me" Confirmation Modal */}
      <Dialog
        open={disputeDialogOpen}
        onClose={() => setDisputeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, bgcolor: isDark ? '#0A0B10' : '#FFFFFF', border: `1px solid ${border}` } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Shield sx={{ color: CR }} />
          <Typography sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Security Threat Response
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.88rem', mb: 2 }}>
            You are reporting an unrecognized login attempt from <strong>IP 185.220.101.4</strong>.
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            KAVACH will immediately:
            <br />• Terminate all other remote sessions
            <br />• Block inbound traffic from this IP address
            <br />• Dispatch forensic telemetry to your audit log
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDisputeDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDispute}
            sx={{ bgcolor: CR, color: '#FFFFFF', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            Confirm & Lockdown IP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
