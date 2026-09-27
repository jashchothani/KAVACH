import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, Stack, Chip } from '@mui/material';
import { PictureAsPdf, Code, CheckCircle, Download, Close, Assessment } from '@mui/icons-material';

const CR = '#DC2626';
const SAFE = '#22C55E';

interface SecurityReportModalProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  score: number;
}

export const SecurityReportModal: React.FC<SecurityReportModalProps> = ({
  open,
  onClose,
  isDark,
  score,
}) => {
  const handleDownloadJSON = () => {
    const report = {
      platform: 'KAVACH Sovereign Security System',
      generated_at: new Date().toISOString(),
      organization: 'Swastik Chemical (India)',
      device: 'SWSTK-LPT-0492',
      kavach_security_score: score,
      status: 'PROTECTED',
      active_collectors: 16,
      threats_deflected_this_month: 14,
      network_status: 'Swastik-Corp-5G (DoH Encrypted)',
      privacy_score: 78,
      recommendations_completed: 4,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `KAVACH_Security_Report_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handleDownloadPDF = () => {
    // Generate text/markdown export formatted as report
    const textReport = `=====================================================
            KAVACH SECURITY COMPLIANCE REPORT
      Engineered by Swastik Chemical (India)
=====================================================
Report Date: ${new Date().toLocaleDateString('en-IN')}
Device: JASH LAPTOP (SWSTK-LPT-0492)
Operating System: Windows 11 Enterprise x64

KAVACH SECURITY SCORE: ${score} / 100 [OPTIMAL]
Status: PROTECTED (All 16 ring-0 telemetry collectors nominal)

SUMMARY OF DEFENSE TELEMETRY:
- Total Events Processed Today: 1,480 events/sec
- Threats Detected (September): 18
- Autonomously Deflected (SOAR): 14
- Active Uncontained Breaches: ZERO (0)
- Network Security: Encrypted DoH DNS active • WFP rules verified
- Privacy Posture: 78/100 (1 action pending: background mic restriction)

AUTHENTICATION AUDIT:
- Multi-Factor Authentication: Enabled
- Registered Sessions: 2 Authorized Endpoints

=====================================================
Certified Sovereign Security Audit by KAVACH Engine v2.4
=====================================================`;

    const blob = new Blob([textReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KAVACH_Security_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
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
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Assessment sx={{ color: CR, fontSize: 24 }} />
          <Typography sx={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.15rem' }}>
            Generate Security Report
          </Typography>
        </Box>
        <Button size="small" onClick={onClose} sx={{ minWidth: 'auto', p: 0.5 }}>
          <Close fontSize="small" />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', mb: 2.5 }}>
          Export a certified audit dossier covering your device health, privacy compliance, threat deflections, and security history.
        </Typography>

        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', mb: 3 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.secondary', mb: 1 }}>
            REPORT CONTENTS:
          </Typography>
          <Stack spacing={0.6}>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.primary' }}>✓ Overall KAVACH Security Score ({score}/100)</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.primary' }}>✓ 16 Telemetry Collectors Status & Uptime</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.primary' }}>✓ September Threat Detection & SOAR Deflections</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.primary' }}>✓ Network Sockets & DNS Encryption Posture</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.primary' }}>✓ Privacy Status & Hardware Sensor Permissions</Typography>
          </Stack>
        </Box>

        <Box display="flex" gap={2}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleDownloadPDF}
            startIcon={<PictureAsPdf />}
            sx={{
              py: 1.4,
              bgcolor: CR,
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2.5,
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Export Certified Report
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleDownloadJSON}
            startIcon={<Code />}
            sx={{
              py: 1.4,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2.5,
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
              color: 'text.primary',
            }}
          >
            Export JSON Data
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
