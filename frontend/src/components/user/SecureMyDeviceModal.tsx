import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton, Button, LinearProgress, Stack, Chip, Divider
} from '@mui/material';
import {
  Close, Shield, CheckCircle, Warning, Build, Refresh, PlayArrow, DoneAll
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

interface CheckItem {
  name: string;
  category: string;
  status: 'pending' | 'checking' | 'passed' | 'warning';
  issueText?: string;
  fixAction?: string;
}

const INITIAL_CHECKS: CheckItem[] = [
  { name: 'Windows Defender', category: 'Antivirus', status: 'pending' },
  { name: 'WFP Firewall Rules', category: 'Network', status: 'pending' },
  { name: 'Security Updates', category: 'OS', status: 'pending' },
  { name: 'Windows OS Patches', category: 'System', status: 'pending' },
  { name: 'Suspicious Processes', category: 'Process', status: 'pending' },
  { name: 'Startup Applications', category: 'Boot', status: 'pending' },
  { name: 'Running Services', category: 'System', status: 'pending' },
  { name: 'Active Network Sockets', category: 'Network', status: 'pending' },
  { name: 'Encrypted DNS Queries', category: 'DNS', status: 'pending' },
  { name: 'Suspicious File Activity', category: 'FIM', status: 'pending' },
  { name: 'File Integrity Monitoring', category: 'Storage', status: 'pending' },
  { name: 'Browser Configuration', category: 'Web', status: 'pending' },
  { name: 'Installed Applications', category: 'Apps', status: 'pending', issueText: 'Google Chrome v127 requires security update', fixAction: 'Update to v128.0.6613.85' },
  { name: 'USB & External Media', category: 'Hardware', status: 'pending' },
  { name: 'User Account Security', category: 'Identity', status: 'pending' },
  { name: 'Login & Authentication', category: 'Access', status: 'pending' },
  { name: 'Security Baseline Config', category: 'Hardening', status: 'pending' },
  { name: 'Suspicious Scheduled Tasks', category: 'Persistence', status: 'pending' },
];

interface SecureMyDeviceModalProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  onScanCompleted?: () => void;
}

export const SecureMyDeviceModal: React.FC<SecureMyDeviceModalProps> = ({
  open,
  onClose,
  isDark,
  onScanCompleted,
}) => {
  const [stage, setStage] = useState<'idle' | 'scanning' | 'complete' | 'fixed'>('idle');
  const [items, setItems] = useState<CheckItem[]>(INITIAL_CHECKS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fixed, setFixed] = useState(false);

  const cardBg = isDark ? '#12141D' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStage('scanning');
      setCurrentIndex(0);
      setFixed(false);
      setItems(INITIAL_CHECKS.map(item => ({ ...item, status: 'pending' })));
    }
  }, [open]);

  // Scan simulation sequence across the 18 components
  useEffect(() => {
    if (stage === 'scanning') {
      if (currentIndex < items.length) {
        const timer = setTimeout(() => {
          setItems(prev => {
            const next = [...prev];
            // If it's the installed apps item and not fixed, give warning
            if (next[currentIndex].name === 'Installed Applications' && !fixed) {
              next[currentIndex].status = 'warning';
            } else {
              next[currentIndex].status = 'passed';
            }
            return next;
          });
          setCurrentIndex(prev => prev + 1);
        }, 110);
        return () => clearTimeout(timer);
      } else {
        setStage('complete');
        if (onScanCompleted) onScanCompleted();
      }
    }
  }, [stage, currentIndex, items.length, fixed, onScanCompleted]);

  const handleFixIssues = () => {
    setStage('scanning');
    setFixed(true);
    setCurrentIndex(0);
    setItems(prev => prev.map(i => ({ ...i, status: 'pending' })));
  };

  const progressPercent = Math.round((currentIndex / items.length) * 100);
  const warningCount = items.filter(i => i.status === 'warning').length;

  return (
    <Dialog
      open={open}
      onClose={stage === 'scanning' ? undefined : onClose}
      maxWidth="md"
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
      <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              bgcolor: stage === 'scanning' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              border: `1px solid ${stage === 'scanning' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stage === 'scanning' ? CR : SAFE,
            }}
          >
            <Shield sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              {stage === 'scanning' ? 'Scanning Your Device...' : 'Security Check Complete'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {stage === 'scanning'
                ? `Auditing 18 telemetry collectors & endpoints (${progressPercent}%)`
                : warningCount === 0
                ? 'All 18 security checkpoints passed. Zero active vulnerabilities.'
                : `${warningCount} issue requires your attention.`}
            </Typography>
          </Box>
        </Box>
        {stage !== 'scanning' && (
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        {/* Progress Bar while scanning */}
        {stage === 'scanning' && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" mb={0.8}>
              <Typography sx={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: CR, fontWeight: 700 }}>
                AUDITING: {items[Math.min(currentIndex, items.length - 1)]?.name}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary', fontWeight: 700 }}>
                {progressPercent}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: CR,
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        {/* Scan Summary Banner when done */}
        {stage === 'complete' && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              mb: 3,
              bgcolor: warningCount === 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${warningCount === 0 ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              {warningCount === 0 ? (
                <DoneAll sx={{ color: SAFE, fontSize: 26 }} />
              ) : (
                <Warning sx={{ color: WARN, fontSize: 26 }} />
              )}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                  {warningCount === 0 ? 'Device Fully Hardened' : '1 Software Update Required'}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {warningCount === 0
                    ? 'All host engines, kernel hooks, and network firewall rules are verified.'
                    : 'Patching Google Chrome will restore your security score to 100/100.'}
                </Typography>
              </Box>
            </Box>

            {warningCount > 0 && (
              <Button
                variant="contained"
                onClick={handleFixIssues}
                startIcon={<Build sx={{ fontSize: 16 }} />}
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
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                FIX ISSUE
              </Button>
            )}
          </Box>
        )}

        {/* 18-Point Checks Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1.2,
            maxHeight: 380,
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
          {items.map((item, idx) => {
            const isCurrent = stage === 'scanning' && idx === currentIndex;
            const isPassed = item.status === 'passed';
            const isWarn = item.status === 'warning';

            return (
              <Box
                key={idx}
                sx={{
                  p: 1.4,
                  px: 2,
                  borderRadius: 2.5,
                  bgcolor: isWarn
                    ? (isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)')
                    : cardBg,
                  border: `1px solid ${isWarn ? 'rgba(245, 158, 11, 0.3)' : borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                <Box display="flex" alignItems="center" gap={1.2}>
                  {isPassed && <CheckCircle sx={{ color: SAFE, fontSize: 18 }} />}
                  {isWarn && <Warning sx={{ color: WARN, fontSize: 18 }} />}
                  {item.status === 'pending' && (
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: `2px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` }} />
                  )}
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
                      {item.name}
                    </Typography>
                    {item.issueText && isWarn && (
                      <Typography sx={{ fontSize: '0.7rem', color: WARN, fontWeight: 600 }}>
                        {item.issueText}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Chip
                  label={isPassed ? 'PASSED' : isWarn ? 'ACTION' : 'PENDING'}
                  size="small"
                  sx={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    fontSize: '0.62rem',
                    height: 20,
                    bgcolor: isPassed
                      ? 'rgba(34, 197, 94, 0.12)'
                      : isWarn
                      ? 'rgba(245, 158, 11, 0.15)'
                      : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                    color: isPassed ? SAFE : isWarn ? WARN : 'text.secondary',
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={stage === 'scanning'}
          onClick={onClose}
          sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
        >
          Close
        </Button>
        <Button
          disabled={stage === 'scanning'}
          variant="outlined"
          onClick={() => {
            setStage('scanning');
            setCurrentIndex(0);
            setItems(INITIAL_CHECKS.map(i => ({ ...i, status: 'pending' })));
          }}
          startIcon={<Refresh />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            borderColor: borderColor,
            color: 'text.primary',
          }}
        >
          Re-run Assessment
        </Button>
      </DialogActions>
    </Dialog>
  );
};
