import React, { useState } from 'react';
import { Box, Typography, Chip, Button, Stack, Collapse, IconButton } from '@mui/material';
import {
  Apps, CheckCircle, Warning, Update, Build, ExpandMore, ExpandLess, Settings
} from '@mui/icons-material';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export const ApplicationsView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [apps, setApps] = useState([
    { name: 'Google Chrome', version: 'v127.0.6533.120', status: 'warning', issue: 'Outdated (v128 available)', startup: false, vendor: 'Google LLC' },
    { name: 'Visual Studio Code', version: 'v1.92.2', status: 'safe', issue: 'Verified & Secure', startup: false, vendor: 'Microsoft Corporation' },
    { name: 'Slack Desktop', version: 'v4.39.95', status: 'safe', issue: 'Up to Date', startup: true, vendor: 'Slack Technologies' },
    { name: 'Node.js LTS Runtime', version: 'v20.17.0', status: 'safe', issue: 'Verified Digital Signature', startup: false, vendor: 'OpenJS Foundation' },
    { name: 'QuickPrintHelper', version: 'v1.2.0', status: 'warning', issue: 'Unused Startup Program (45 days inactive)', startup: true, vendor: 'Unknown Publisher' },
  ]);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const handleUpdate = (name: string) => {
    setApps(prev => prev.map(a => a.name === name ? { ...a, status: 'safe', version: 'v128.0.6613.85', issue: 'Updated to Latest' } : a));
  };

  const handleDisableStartup = (name: string) => {
    setApps(prev => prev.map(a => a.name === name ? { ...a, status: 'safe', startup: false, issue: 'Startup Disabled' } : a));
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
              bgcolor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}
          >
            <Apps sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              Application & System Security
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Installed Software Health, Startup Optimization & Signature Verification
            </Typography>
          </Box>
        </Box>

        <Chip
          label="5 Monitored Apps"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${border}`,
          }}
        />
      </Box>

      {/* App List */}
      <Stack spacing={1.5} mb={3}>
        {apps.map((app, idx) => {
          const isSafe = app.status === 'safe';
          return (
            <Box
              key={idx}
              sx={{
                p: 2,
                px: 2.5,
                borderRadius: 2.5,
                bgcolor: isSafe
                  ? (isDark ? 'rgba(255,255,255,0.02)' : '#FDFCFB')
                  : (isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)'),
                border: `1px solid ${isSafe ? border : 'rgba(245, 158, 11, 0.3)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                {isSafe ? <CheckCircle sx={{ color: SAFE, fontSize: 22 }} /> : <Warning sx={{ color: WARN, fontSize: 22 }} />}
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: 'text.primary' }}>
                      {app.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', fontFamily: 'JetBrains Mono' }}>
                      {app.version}
                    </Typography>
                    {app.startup && (
                      <Chip label="STARTUP APP" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(234, 179, 8, 0.15)', color: WARN }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.76rem', color: isSafe ? 'text.secondary' : WARN, mt: 0.2 }}>
                    {app.vendor} • {app.issue}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                {app.name === 'Google Chrome' && !isSafe && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleUpdate(app.name)}
                    startIcon={<Update sx={{ fontSize: 14 }} />}
                    sx={{ bgcolor: CR, color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#B91C1C' } }}
                  >
                    Update
                  </Button>
                )}

                {app.startup && !isSafe && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDisableStartup(app.name)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 2, borderColor: border }}
                  >
                    Disable Startup
                  </Button>
                )}

                {isSafe && (
                  <Chip label="HEALTHY" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: SAFE, fontWeight: 800, fontSize: '0.65rem' }} />
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Feature 19: System Security & Technical Details Toggle */}
      <Box pt={2} borderTop={`1px solid ${border}`}>
        <Button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          endIcon={showTechnicalDetails ? <ExpandLess /> : <ExpandMore />}
          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary' }}
        >
          {showTechnicalDetails ? 'Hide Technical Details' : 'View Technical Details'}
        </Button>

        <Collapse in={showTechnicalDetails}>
          <Box sx={{ mt: 2, p: 2.5, borderRadius: 2.5, bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#F8FAFC', border: `1px solid ${border}` }}>
            <Typography sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.8 }}>
              • Windows Kernel Patch Level: Cumulative Update KB5041585 (Secured)
              <br />• Microsoft Defender Antivirus Signature Engine: v1.417.382.0
              <br />• WFP Network Isolation Filter: Active • Sub-second SOAR enabled
              <br />• Process Execution Ring-0 Observer: Operational on PID root tree
              <br />• Immutable Audit Ledger: Active with SHA-256 event chaining
            </Typography>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};
