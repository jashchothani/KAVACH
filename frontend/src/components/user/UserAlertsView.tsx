import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, Button, Stack, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Collapse, CircularProgress
} from '@mui/material';
import {
  Warning, ErrorOutline, InfoOutlined, CheckCircle, Psychology,
  Build, Visibility, Check, DeleteOutline, ExpandMore, ExpandLess, Close
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api/client';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export interface UserFriendlyAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  status: 'active' | 'resolved' | 'ignored';
  whatHappened: string;
  whyItMatters: string;
  whatKavachDid: string;
  doINeedToDoAnything: string;
  rakshaExplanation?: string;
  evidence?: string[];
  recommendedFix?: string;
}

const SAMPLE_ALERTS: UserFriendlyAlert[] = [
  {
    id: 'alt-101',
    title: 'Unusual PowerShell Activity Detected',
    severity: 'high',
    timestamp: '10:42 AM Today',
    status: 'active',
    whatHappened: 'KAVACH detected an encoded PowerShell command attempting to run in the background without a visible window.',
    whyItMatters: 'PowerShell is a legitimate Windows tool, but attackers frequently use hidden or encoded commands to download untrusted software.',
    whatKavachDid: 'KAVACH intercepted the process, suspended execution within 12ms, and prevented any files from being modified.',
    doINeedToDoAnything: 'No immediate damage occurred. We recommend letting KAVACH terminate the lingering parent process.',
    rakshaExplanation: 'KAVACH observed unusual PowerShell activity originating from an unverified temporary directory. While PowerShell is normal, the arguments were base64 encoded to obscure actions. KAVACH halted execution before any unauthorized changes occurred.',
    evidence: ['PID: 4920 (powershell.exe)', 'Parent: wscript.exe (PID 3108)', 'CommandLine: -encodedCommand JABzAGUAYwByAGUAdAA...'],
    recommendedFix: 'Terminate suspicious process tree and clear temp cache',
  },
  {
    id: 'alt-102',
    title: 'Phishing Website Blocked During Web Browsing',
    severity: 'medium',
    timestamp: 'Yesterday at 04:15 PM',
    status: 'resolved',
    whatHappened: 'A link attempted to connect to a website mimicking your corporate login portal (paypa1-verify.xyz).',
    whyItMatters: 'Phishing websites deceive users into submitting passwords, credit cards, or two-factor security codes.',
    whatKavachDid: 'KAVACH URL Shield analyzed the domain homograph spoofing and severed the HTTP connection before the webpage could load.',
    doINeedToDoAnything: 'You are completely safe. Your passwords were never exposed.',
    rakshaExplanation: 'The domain used a deceptive lookalike character ("1" instead of "l") known as a homoglyph spoof. KAVACH recognized the domain mismatch and safely dropped the outbound network socket.',
    evidence: ['URL: http://paypa1-verify.xyz/login', 'Remote IP: 185.220.101.44 (Flagged C2 Host)', 'Browser: Chrome Process ID 8112'],
  },
  {
    id: 'alt-103',
    title: 'Pending Chrome Browser Security Update',
    severity: 'low',
    timestamp: '2 days ago',
    status: 'active',
    whatHappened: 'Your installed version of Google Chrome has a known security vulnerability fixed in the latest version.',
    whyItMatters: 'Outdated browsers can be exploited by malicious advertisements or compromised websites.',
    whatKavachDid: 'Flagged the component in your device health audit and reduced your KAVACH score by 3 points until updated.',
    doINeedToDoAnything: 'Click "Update Chrome Now" below to download and install the official security patch.',
    recommendedFix: 'Install Google Chrome Update v128.0',
  },
];

export const UserAlertsView: React.FC<{ isDark: boolean; onAskRaksha?: (prompt: string) => void }> = ({
  isDark,
  onAskRaksha,
}) => {
  const [alerts, setAlerts] = useState<UserFriendlyAlert[]>(SAMPLE_ALERTS);
  const [expandedId, setExpandedId] = useState<string | null>('alt-101');
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [evidenceModalAlert, setEvidenceModalAlert] = useState<UserFriendlyAlert | null>(null);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Fetch real backend alerts if available
  useEffect(() => {
    const fetchBackendAlerts = async () => {
      try {
        const raw = await api.threats.getAlerts();
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped: UserFriendlyAlert[] = raw.map((a: any, i: number) => ({
            id: a.id || `alert-${i}`,
            title: a.title || 'Suspicious Activity Detected',
            severity: (a.severity?.toLowerCase() || 'medium') as any,
            timestamp: a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : 'Recent',
            status: a.status === 'resolved' ? 'resolved' : 'active',
            whatHappened: a.description || 'KAVACH flagged unusual host behavior across endpoints.',
            whyItMatters: 'Deviations from normal device patterns could indicate persistence or unauthorized execution.',
            whatKavachDid: 'Active defense collectors isolated the anomaly and logged telemetry for verification.',
            doINeedToDoAnything: 'Review the recommendation and resolve the issue with one click.',
            evidence: a.indicators || ['Host: Primary Workstation', 'Engine: Behavioral Sensor'],
          }));
          setAlerts(mapped);
        }
      } catch {
        // Fallback to rich sample alerts
      }
    };
    fetchBackendAlerts();
  }, []);

  const handleFix = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  const handleIgnore = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ignored' } : a));
  };

  const handleExplainWithRaksha = async (alert: UserFriendlyAlert) => {
    setExplainingId(alert.id);
    try {
      const resp = await api.threats.explainAlert(alert.id);
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, rakshaExplanation: resp.explanation } : a));
    } catch {
      // Keep existing explanation
    } finally {
      setExplainingId(null);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
      case 'high':
        return <Chip label="ACTION REQUIRED" size="small" sx={{ bgcolor: 'rgba(220, 38, 38, 0.15)', color: CR, fontWeight: 800, fontSize: '0.65rem', border: `1px solid ${CR}` }} />;
      case 'medium':
        return <Chip label="ATTENTION" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: WARN, fontWeight: 800, fontSize: '0.65rem', border: `1px solid ${WARN}` }} />;
      default:
        return <Chip label="INFORMATIONAL" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: 800, fontSize: '0.65rem', border: '1px solid #3B82F6' }} />;
    }
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
              bgcolor: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: CR,
            }}
          >
            <Warning sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              Security Alerts
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Plain-English Threat Alerts with Automated Fixes & Raksha AI Explanations
            </Typography>
          </Box>
        </Box>

        <Chip
          label={`${alerts.filter(a => a.status === 'active').length} Active Issues`}
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            bgcolor: 'rgba(220, 38, 38, 0.12)',
            color: CR,
            border: `1px solid ${CR}`,
          }}
        />
      </Box>

      {/* Alert List */}
      <Stack spacing={2.5}>
        {alerts.map((alt) => {
          const isExpanded = expandedId === alt.id;
          const isResolved = alt.status === 'resolved';

          return (
            <Box
              key={alt.id}
              sx={{
                borderRadius: 3.5,
                border: `1px solid ${isResolved ? 'rgba(34, 197, 94, 0.3)' : border}`,
                bgcolor: isResolved
                  ? (isDark ? 'rgba(34, 197, 94, 0.04)' : 'rgba(34, 197, 94, 0.03)')
                  : (isDark ? '#12141F' : '#FDFCFB'),
                overflow: 'hidden',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Card Header Row */}
              <Box
                onClick={() => setExpandedId(isExpanded ? null : alt.id)}
                sx={{
                  p: 2.2,
                  px: 2.8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.8}>
                  {isResolved ? (
                    <CheckCircle sx={{ color: SAFE, fontSize: 24 }} />
                  ) : (
                    <Warning sx={{ color: alt.severity === 'high' ? CR : WARN, fontSize: 24 }} />
                  )}
                  <Box>
                    <Box display="flex" alignItems="center" gap={1.2} flexWrap="wrap">
                      <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: 'text.primary' }}>
                        {alt.title}
                      </Typography>
                      {getSeverityBadge(alt.severity)}
                      {isResolved && (
                        <Chip
                          label="RESOLVED"
                          size="small"
                          sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(34, 197, 94, 0.15)', color: SAFE }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 0.3 }}>
                      {alt.timestamp}
                    </Typography>
                  </Box>
                </Box>

                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              {/* Collapsible Plain-English Breakdown */}
              <Collapse in={isExpanded}>
                <Box sx={{ p: 3, pt: 0, borderTop: `1px solid ${border}` }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                      gap: 2,
                      my: 2.5,
                    }}
                  >
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
                        What Happened?
                      </Typography>
                      <Typography sx={{ fontSize: '0.86rem', color: 'text.primary', lineHeight: 1.5 }}>
                        {alt.whatHappened}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
                        Why Does It Matter?
                      </Typography>
                      <Typography sx={{ fontSize: '0.86rem', color: 'text.primary', lineHeight: 1.5 }}>
                        {alt.whyItMatters}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: SAFE, textTransform: 'uppercase', mb: 0.5 }}>
                        What Did KAVACH Do?
                      </Typography>
                      <Typography sx={{ fontSize: '0.86rem', color: 'text.primary', lineHeight: 1.5 }}>
                        {alt.whatKavachDid}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: CR, textTransform: 'uppercase', mb: 0.5 }}>
                        Do I Need To Do Anything?
                      </Typography>
                      <Typography sx={{ fontSize: '0.86rem', color: 'text.primary', lineHeight: 1.5 }}>
                        {alt.doINeedToDoAnything}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Raksha AI Explanation Banner */}
                  {alt.rakshaExplanation && (
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: 2.5,
                        mb: 2.5,
                        bgcolor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={0.8}>
                        <Psychology sx={{ color: '#3B82F6', fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#3B82F6', fontFamily: 'JetBrains Mono, monospace' }}>
                          RAKSHA AI EXPLANATION
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.84rem', color: 'text.primary', lineHeight: 1.6 }}>
                        {alt.rakshaExplanation}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleExplainWithRaksha(alt)}
                        disabled={explainingId === alt.id}
                        startIcon={explainingId === alt.id ? <CircularProgress size={14} /> : <Psychology />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          borderRadius: 2,
                          color: '#3B82F6',
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        Explain with Raksha
                      </Button>

                      {alt.evidence && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setEvidenceModalAlert(alt)}
                          startIcon={<Visibility />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            borderRadius: 2,
                            borderColor: border,
                            color: 'text.secondary',
                          }}
                        >
                          Show Evidence
                        </Button>
                      )}

                      {onAskRaksha && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => onAskRaksha(`Explain this alert in detail: "${alt.title}"`)}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', color: CR }}
                        >
                          Ask Raksha →
                        </Button>
                      )}
                    </Stack>

                    {!isResolved && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          onClick={() => handleIgnore(alt.id)}
                          sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                        >
                          Ignore
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleFix(alt.id)}
                          startIcon={<Check />}
                          sx={{
                            bgcolor: SAFE,
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            borderRadius: 2,
                            px: 2,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#16A34A' },
                          }}
                        >
                          Mark Resolved
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Stack>

      {/* Evidence Modal */}
      <Dialog
        open={Boolean(evidenceModalAlert)}
        onClose={() => setEvidenceModalAlert(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            bgcolor: isDark ? '#0A0B10' : '#FFFFFF',
            border: `1px solid ${border}`,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Incident Evidence Dossier
          </Typography>
          <IconButton size="small" onClick={() => setEvidenceModalAlert(null)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 2 }}>
            Captured telemetry artifacts recorded by KAVACH kernel hooks:
          </Typography>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? '#050508' : '#F1F5F9', border: `1px solid ${border}` }}>
            {evidenceModalAlert?.evidence?.map((e, idx) => (
              <Typography key={idx} sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'text.primary', mb: 0.8 }}>
                &gt; {e}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvidenceModalAlert(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
