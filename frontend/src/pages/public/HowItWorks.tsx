import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, Chip, Stack,
  Divider, Paper
} from '@mui/material';
import {
  Sensors, FilterList, Psychology, Hub, Balance,
  Bolt, AutoAwesome, ArrowForward, CheckCircle, PlayArrow,
  Refresh, Shield, Terminal, Storage, Lan
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';

export const HowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Sense',
      subtitle: '16 Telemetry Collectors',
      icon: <Sensors sx={{ fontSize: 24 }} />,
      desc: 'KAVACH background daemons continuously observe low-level operating system events across processes, network sockets, DNS requests, registry modifications, PowerShell commands, and canary tripwires.',
      signals: [
        'Process created: powershell.exe (PID 4920, Parent: svchost.exe)',
        'Outbound socket opened to 185.220.101.5 on port 443',
        'Registry Run key modification: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        'Decoy canary file access event triggered on C:\\Canary\\ledger.docx',
      ],
      output: 'Raw Telemetry Events Stream',
      metric: '16 Active Collectors',
    },
    {
      num: '02',
      title: 'Normalize',
      subtitle: 'Async Event Bus & Deduplication',
      icon: <FilterList sx={{ fontSize: 24 }} />,
      desc: 'Raw event objects pass through an asynchronous in-memory event bus. Fields are standardized into canonical schemas, noisy heartbeat bursts are deduplicated, and correlation IDs are stamped.',
      signals: [
        'Timestamp normalized to ISO 8601 UTC',
        'Process hash calculated: SHA-256 (3c7a1f...9b2)',
        'Repetitive OS telemetry filtered to eliminate alert fatigue',
        'Event bus dispatches unified payload to detection pipelines',
      ],
      output: 'Normalized Security Event Objects',
      metric: 'Sub-millisecond Pipeline',
    },
    {
      num: '03',
      title: 'Detect',
      subtitle: 'Deterministic Rules + IsolationForest ML',
      icon: <Psychology sx={{ fontSize: 24 }} />,
      desc: 'The event is evaluated simultaneously by two engines: deterministic rules mapped to MITRE ATT&CK techniques, and an IsolationForest ML model analyzing 10 behavioral vector dimensions.',
      signals: [
        'MITRE ATT&CK Rule Triggered: T1059.001 (PowerShell Obfuscation)',
        'IsolationForest Anomaly Score: -0.68 (anomalous parent-child lineage)',
        'Feature Vector: High command entropy, rare destination port, burst ratio 4.2',
        'Model status verified: "READY" (sufficient baseline collected)',
      ],
      output: 'Validated Threat Signal + Anomaly Score',
      metric: 'Multi-Engine Detection',
    },
    {
      num: '04',
      title: 'Correlate',
      subtitle: 'Incident Clustering & Kill-Chain Mapping',
      icon: <Hub sx={{ fontSize: 24 }} />,
      desc: 'Isolated signals rarely happen in a vacuum. KAVACH correlates alerts over time across host endpoints, user accounts, and network destinations to build a comprehensive incident timeline.',
      signals: [
        'Correlated: Alert #482 (PowerShell) linked to Alert #483 (C2 Socket)',
        'Temporal proximity: Events occurred within 140ms on DESKTOP-49A',
        'Incident #INC-1042 created with full forensic evidence bundle',
        'Attack stage mapped: Execution → Lateral Movement attempt',
      ],
      output: 'Clustered Incident Dossier',
      metric: 'Cross-Host Context',
    },
    {
      num: '05',
      title: 'Score',
      subtitle: 'Hybrid Risk Engine',
      icon: <Balance sx={{ fontSize: 24 }} />,
      desc: 'Combines deterministic rule severity, ML anomaly confidence, and threat intelligence lookup into a transparent, calibrated risk score (0 to 100).',
      signals: [
        'Deterministic rule base weight: 45 pts',
        'ML anomaly deviation weight: 35 pts',
        'Threat intelligence reputation match (known C2 ASN): 15 pts',
        'Total Incident Risk Score: 95 / 100 (CRITICAL SEVERITY)',
      ],
      output: 'Calibrated Risk Score & Priority',
      metric: '0 to 100 Calibrated',
    },
    {
      num: '06',
      title: 'Respond',
      subtitle: 'SOAR Playbook Execution',
      icon: <Bolt sx={{ fontSize: 24 }} />,
      desc: 'Controlled automated response actions are triggered based on security policy. High-impact actions require authorization, provide dry-run capabilities, and log an immutable audit trail.',
      signals: [
        'Playbook #14 (Ransomware / C2 Containment) engaged',
        'Host isolated from external network via Windows Filtering Platform (WFP)',
        'Malicious PID 4920 terminated safely',
        'Immutable audit log hash recorded in database ledger',
      ],
      output: 'Neutralized Threat & Secured Endpoint',
      metric: 'Controlled Response',
    },
    {
      num: '07',
      title: 'Explain',
      subtitle: 'Raksha AI Cybersecurity Copilot',
      icon: <AutoAwesome sx={{ fontSize: 24 }} />,
      desc: 'Raksha AI translates the complex incident evidence, process tree, and response actions into clear, human explanations for everyday users and deep forensic summaries for SOC analysts.',
      signals: [
        'Sensitive context sanitized: Passwords, tokens, and PII redacted',
        'Plain English summary generated: "A malicious script tried to download unauthorized code. KAVACH stopped it."',
        'Defensive recommendations generated for administrators',
        'AI fallback ready: NVIDIA NIM → Local Model → Heuristic Engine',
      ],
      output: 'Plain-English Incident Intelligence',
      metric: 'Human Understanding',
    },
  ];

  const current = steps[activeStep];

  return (
    <Box
      sx={{
        py: { xs: 12, md: 16 },
        bgcolor: 'transparent',
        color: isDark ? '#FFFFFF' : '#0F172A',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box textAlign="center" maxWidth={860} mx="auto" mb={8}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<Shield sx={{ color: `${CR} !important`, fontSize: 16 }} />}
              label="THE KAVACH DEFENSIVE LIFECYCLE"
              sx={{
                bgcolor: 'rgba(220, 38, 38, 0.1)',
                color: CR,
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 2,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: { xs: '2.5rem', sm: '3.4rem', md: '4.2rem' },
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: isDark ? '#FFFFFF' : '#0B0B0F',
                mb: 2.5,
              }}
            >
              How KAVACH protects your digital infrastructure.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                fontSize: { xs: '1.05rem', md: '1.18rem' },
                lineHeight: 1.7,
              }}
            >
              Follow a security signal from the moment it touches an endpoint through normalization, machine learning detection, correlation, risk scoring, automated response, and Raksha AI explanation.
            </Typography>
          </motion.div>
        </Box>

        {/* 7-Step Interactive Pipeline Stepper */}
        <Box sx={{ mb: 7, overflowX: 'auto', pb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', lg: 'center' },
              minWidth: 840,
              gap: 1.5,
              p: 1.5,
              borderRadius: '100px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            {steps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <Box
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '100px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    bgcolor: isSelected ? CR : 'transparent',
                    color: isSelected ? '#FFFFFF' : isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748B',
                    boxShadow: isSelected ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isSelected ? '#B91C1C' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)',
                      color: isSelected ? '#FFFFFF' : isDark ? '#FFFFFF' : '#0B0B0F',
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'JetBrains Mono', fontSize: '0.75rem', opacity: isSelected ? 1 : 0.6 }}>
                    {step.num}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    {step.title}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Active Step Deep-Dive Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.num}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={4} alignItems="stretch">
              {/* Left Column: Stage Explanation */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: { xs: 3.5, md: 5 },
                    height: '100%',
                    borderRadius: 4,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.025)' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 3,
                          bgcolor: 'rgba(220, 38, 38, 0.12)',
                          color: CR,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {current.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: CR, fontWeight: 800, letterSpacing: '0.08em', display: 'block' }}>
                          STAGE {current.num} OF 07
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'Outfit', color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
                          {current.title} — {current.subtitle}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#475569',
                        fontSize: '1.05rem',
                        lineHeight: 1.75,
                        mb: 4,
                      }}
                    >
                      {current.desc}
                    </Typography>
                  </Box>

                  <Box>
                    <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0', mb: 3 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8', display: 'block' }}>
                          PIPELINE METRIC
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#22C55E' }}>
                          {current.metric}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8', display: 'block' }}>
                          STAGE ARTIFACT
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
                          {current.output}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Right Column: Simulated Live Signal Inspector */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: { xs: 3.5, md: 5 },
                    height: '100%',
                    borderRadius: 4,
                    bgcolor: isDark ? '#050508' : '#0F172A',
                    color: '#E2E8F0',
                    fontFamily: 'JetBrains Mono, monospace',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #1E293B',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} pb={2} borderBottom="1px solid rgba(255,255,255,0.1)">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                      <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 800, fontFamily: 'inherit' }}>
                        TELEMETRY BUS // INSPECTOR ACTIVE
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>
                      SAMPLE INCIDENT TRACE
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 2, fontFamily: 'inherit' }}>
                    // SIGNALS PROCESSED IN STAGE {current.num}:
                  </Typography>

                  <Stack spacing={2} sx={{ mb: 'auto' }}>
                    {current.signals.map((sig, sidx) => (
                      <Box
                        key={sidx}
                        sx={{
                          p: 1.8,
                          borderRadius: 2,
                          bgcolor: 'rgba(255, 255, 255, 0.03)',
                          borderLeft: `3px solid ${sidx === 0 ? CR : '#3B82F6'}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'inherit',
                            color: sidx === 0 ? '#FCA5A5' : '#93C5FD',
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            display: 'block',
                          }}
                        >
                          {sig}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} pt={2} borderTop="1px solid rgba(255,255,255,0.1)">
                    <Button
                      size="small"
                      disabled={activeStep === 0}
                      onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
                      sx={{ color: '#FFFFFF', textTransform: 'none', fontFamily: 'inherit', fontSize: '0.78rem' }}
                    >
                      ← Previous Stage
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setActiveStep((p) => (p + 1) % steps.length)}
                      sx={{ color: '#60A5FA', textTransform: 'none', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      {activeStep === steps.length - 1 ? 'Restart Lifecycle ↺' : 'Next Stage →'}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        </AnimatePresence>

        {/* Flow Diagram Summary */}
        <Box sx={{ mt: 10, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8', fontWeight: 800, letterSpacing: '0.1em', display: 'block', mb: 2 }}>
            CONTINUOUS SECURITY FABRIC
          </Typography>
          <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 900, mb: 4, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
            SENSE → DETECT → CORRELATE → SCORE → RESPOND → EXPLAIN → PROTECT
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: CR,
              color: '#FFFFFF',
              fontWeight: 800,
              borderRadius: '100px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Access the KAVACH Platform
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
export default HowItWorks;
