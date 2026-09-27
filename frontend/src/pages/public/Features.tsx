import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, Chip, Stack,
  Tabs, Tab, IconButton, Divider
} from '@mui/material';
import {
  Shield, Psychology, Terminal, Speed, Storage, Usb, Lan,
  Insights, Bolt, Lock, ArrowForward, CheckCircle, Code,
  BugReport, Memory, Security, Layers, DeviceHub, Visibility,
  Link as LinkIcon, GppGood, WarningAmber, Policy
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';

export const Features: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [selectedPillar, setSelectedPillar] = useState(0);

  const pillars = [
    {
      id: 'protect',
      label: '01 — Protect',
      title: 'Continuous Endpoint Visibility & Host Defense',
      subtitle: '16 specialized telemetry engines observe system internals without degrading host performance.',
      icon: <Shield sx={{ fontSize: 20 }} />,
      highlights: [
        {
          title: '16-Engine Endpoint Telemetry',
          desc: 'High-frequency host observation capturing process trees, network sockets, DNS queries, registry modifications, and PowerShell execution.',
          tag: 'Core Ingestion',
          details: [
            'Process Lineage: Parent-child PID tracking and LOLBin abuse detection',
            'Network Telemetry: Raw socket connection monitoring and unusual port tracking',
            'File Integrity (FIM): Rapid hashing and mass-modification alerts',
            'PowerShell Watcher: Script block logging and Base64 deobfuscation',
          ],
        },
        {
          title: 'Ransomware Canary Decoys',
          desc: 'Strategically placed tripwire files monitored with sub-millisecond interrupts to detect unauthorized mass-encryption before user files are touched.',
          tag: 'Early Warning',
          details: [
            'Automated decoy placement in user profile and shared directories',
            'Instantaneous process suspension upon canary access attempt',
            'Zero false positives from normal background applications',
          ],
        },
        {
          title: 'USB & Peripheral Watchdog',
          desc: 'Monitors plug-and-play events to identify rogue HID devices (BadUSB), mass storage injection, and unauthorized data extraction vectors.',
          tag: 'Physical Vectors',
          details: [
            'VID/PID device hardware identification',
            'Rogue keystroke injection heuristic detection',
            'Real-time administrative alert upon unverified storage mounts',
          ],
        },
        {
          title: 'Windows Defender Coordination',
          desc: 'Synchronizes directly with native Windows Defender telemetry to correlate external AV signatures with real-time process behaviors.',
          tag: 'Ecosystem Sync',
          details: [
            'Direct WMI and event log query integration',
            'Correlates antivirus quarantine actions with active network sockets',
            'Aggregated threat visibility in a single unified dashboard',
          ],
        },
      ],
    },
    {
      id: 'detect',
      label: '02 — Detect',
      title: 'Behavioral Machine Learning & MITRE ATT&CK',
      subtitle: 'Deterministic rule evaluation paired with real IsolationForest anomaly detection on behavioral vectors.',
      icon: <Psychology sx={{ fontSize: 20 }} />,
      highlights: [
        {
          title: 'Genuine IsolationForest ML',
          desc: 'Real scikit-learn IsolationForest anomaly detection analyzing 10-dimensional behavioral feature vectors. Insufficient baseline data outputs "insufficient_data" — never fabricated scores.',
          tag: 'Unsupervised ML',
          details: [
            'Vector Dimensions: Process rarity, port diversity, network burst ratio',
            'Entropy Scoring: Evaluates command-line randomness and script complexity',
            'Strict Model Readiness: Requires sufficient historical baseline before scoring',
          ],
        },
        {
          title: 'MITRE ATT&CK Matrix Mapping',
          desc: 'Every observed alert and anomaly is automatically cross-referenced against standardized MITRE tactics and techniques for clear SOC context.',
          tag: 'Standardized Framework',
          details: [
            'Covers Initial Access, Execution, Persistence, Defense Evasion, and C2',
            'Instant technique lookup: T1059 (Command Shell), T1055 (Process Injection)',
            'Visual technique heatmap highlighting enterprise coverage in SOC mode',
          ],
        },
        {
          title: 'Parent-Child Process Anomaly Engine',
          desc: 'Identifies suspicious process lineage anomalies, such as Office documents or web servers spawning PowerShell, cmd.exe, or scripting interpreters.',
          tag: 'Execution Defense',
          details: [
            'Monitors LOLBins (Living Off the Land Binaries) like certutil, mshta, bitsadmin',
            'Maintains baseline parent-child legitimacy rules',
            'Flags anomalous token elevation and process hollowing attempts',
          ],
        },
        {
          title: 'DNS Tunneling & DGA Identification',
          desc: 'Analyzes DNS query frequency, Shannon entropy, and character distribution to detect Command-and-Control beacons and data exfiltration through DNS.',
          tag: 'C2 Disruption',
          details: [
            'Subdomain length and character entropy heuristics',
            'Algorithmically Generated Domain (DGA) pattern detection',
            'Automatic correlation with threat intelligence blacklists',
          ],
        },
      ],
    },
    {
      id: 'understand',
      label: '03 — Understand',
      title: 'Threat Intelligence & Composite Risk Scoring',
      subtitle: 'Enriches raw events with contextual IOC evidence and translates technical signals into an intuitive 0–100 security score.',
      icon: <Insights sx={{ fontSize: 20 }} />,
      highlights: [
        {
          title: 'KAVACH Security Score Engine',
          desc: 'A real mathematical composite score aggregating network health, device status, active threats, application security, and identity posture into one actionable number.',
          tag: 'Posture Metric',
          details: [
            'Weighted algorithm: Network (25%), Device (25%), Threats (25%), Apps (15%), Accounts (10%)',
            'Dynamic status badges: YOU ARE PROTECTED (80+), ATTENTION NEEDED (60-79), AT RISK (<60)',
            'Actionable remediation suggestions tied directly to detected risk factors',
          ],
        },
        {
          title: 'IOC & Threat Intelligence Enrichment',
          desc: 'Queries real-time threat intelligence feeds for malicious IP addresses, known malware hashes (SHA-256), phishing domains, and rogue infrastructure.',
          tag: 'Threat Intel',
          details: [
            'Automated hash matching against known adversary repositories',
            'Autonomous scoring of destination IP reputation and ASN metadata',
            'Correlates external threat alerts with internal telemetry events',
          ],
        },
        {
          title: 'Multi-Event Incident Correlation',
          desc: 'Groups isolated alerts occurring across endpoints and network connections into unified incident clusters so security teams see the full attack chain.',
          tag: 'Incident Engine',
          details: [
            'Temporal correlation linking initial access to subsequent lateral movement',
            'Consolidated root-cause summary preventing alert fatigue',
            'Single incident dossier containing all correlated forensic evidence',
          ],
        },
        {
          title: 'Dual-Mode Experience (Normal & SOC)',
          desc: 'Offers two distinct interfaces: a clean, reassuring view for general users and a comprehensive, raw telemetry terminal for cybersecurity professionals.',
          tag: 'Adaptive UI',
          details: [
            'Normal Mode: One score, plain-English notifications, clear one-click actions',
            'Analyst Mode: Raw JSON payloads, process trees, network sockets, MITRE codes',
            'Seamless toggle allowing instant role-based deep dives',
          ],
        },
      ],
    },
    {
      id: 'respond',
      label: '04 — Respond',
      title: 'Controlled SOAR Automation & URL Security',
      subtitle: 'Pre-configured defensive playbooks with human authorization, dry-run capabilities, audit trails, and real-time URL inspection.',
      icon: <Bolt sx={{ fontSize: 20 }} />,
      highlights: [
        {
          title: 'Autonomous & Controlled SOAR Playbooks',
          desc: 'Automated response workflows designed around safety and authorization. High-impact actions support dry-run verification and rollback.',
          tag: 'Response Engine',
          details: [
            'Ransomware Containment: Suspends suspicious process, preserves canary artifacts',
            'Device Isolation: Disables external network routing while keeping SOC communications active',
            'Process Termination: Kills rogue PID and logs process memory footprint for analysis',
            'Domain Blocking: Enforces local policy block on malicious destination IPs/domains',
          ],
        },
        {
          title: 'KAVACH URL Shield',
          desc: 'In-depth URL security engine checking links for homograph attacks, typosquatting, private IP access (SSRF), and suspicious lexical structures.',
          tag: 'Web Defense',
          details: [
            'IDN / Punycode decoding for Cyrillic/Greek lookalike characters',
            'Strict SSRF filtering preventing access to cloud metadata (169.254.169.254) and private subnets',
            'Lexical analysis: Detects abnormal entropy, nested subdomains, and obfuscated ports',
          ],
        },
        {
          title: 'Chromium MV3 Browser Shield',
          desc: 'Lightweight browser extension powered by Manifest V3 providing real-time URL inspection, phishing warnings, and safe link redirection.',
          tag: 'Browser Extension',
          details: [
            'Zero performance overhead with declarative net request filtering',
            'Direct API synchronization with KAVACH URL security analyzer',
            'Instant visual warning banner on suspicious or typosquatted sites',
          ],
        },
        {
          title: 'Immutable Audit Trail & Rollback',
          desc: 'Every playbook execution, automated block, and administrative intervention is recorded in a cryptographically verifiable database audit log.',
          tag: 'Audit & Safety',
          details: [
            'Complete provenance: Timestamp, actor, target entity, and execution parameters',
            'One-click rollback for safe actions like network un-isolation',
            'Exportable compliance audit reports in CSV and JSON formats',
          ],
        },
      ],
    },
  ];

  const current = pillars[selectedPillar];

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
              label="AUTHENTIC PLATFORM CAPABILITIES"
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
              Engineered for continuous visibility. Built for rapid response.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                fontSize: { xs: '1.05rem', md: '1.18rem' },
                lineHeight: 1.7,
              }}
            >
              Every feature listed here is an authentic component of the KAVACH architecture — from real 16-engine endpoint telemetry and genuine scikit-learn IsolationForest ML to controlled SOAR playbooks and URL protection.
            </Typography>
          </motion.div>
        </Box>

        {/* Pillar Navigation Tabs */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 6,
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              p: 0.8,
              borderRadius: '100px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 6px 20px rgba(15, 23, 42, 0.05)',
              flexWrap: 'wrap',
              gap: 0.5,
            }}
          >
            {pillars.map((pillar, idx) => {
              const isSelected = selectedPillar === idx;
              return (
                <Button
                  key={pillar.id}
                  onClick={() => setSelectedPillar(idx)}
                  startIcon={pillar.icon}
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 1.2,
                    borderRadius: '100px',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: { xs: '0.82rem', sm: '0.9rem' },
                    color: isSelected ? '#FFFFFF' : isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B',
                    bgcolor: isSelected ? CR : 'transparent',
                    boxShadow: isSelected ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none',
                    textTransform: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isSelected ? '#B91C1C' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.04)',
                      color: isSelected ? '#FFFFFF' : isDark ? '#FFFFFF' : '#0B0B0F',
                    },
                  }}
                >
                  {pillar.label}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Selected Pillar Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {/* Pillar Overview Banner */}
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.025)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                mb: 5,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: isDark
                    ? 'radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: CR,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    PILLAR OVERVIEW
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: { xs: '1.8rem', md: '2.4rem' },
                      mb: 1.5,
                      color: isDark ? '#FFFFFF' : '#0B0B0F',
                    }}
                  >
                    {current.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                      fontSize: '1.05rem',
                      lineHeight: 1.7,
                      maxWidth: 750,
                    }}
                  >
                    {current.subtitle}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/login')}
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    sx={{
                      bgcolor: CR,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      borderRadius: '100px',
                      px: 3.5,
                      py: 1.4,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                      '&:hover': { bgcolor: '#B91C1C' },
                    }}
                  >
                    Experience in Platform
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Highlights Grid */}
            <Grid container spacing={3.5}>
              {current.highlights.map((item, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Box
                    sx={{
                      p: { xs: 3, md: 4 },
                      height: '100%',
                      borderRadius: 3.5,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
                      boxShadow: isDark ? 'none' : '0 2px 12px rgba(15, 23, 42, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.3)',
                        transform: 'translateY(-3px)',
                        boxShadow: isDark
                          ? '0 12px 30px rgba(0,0,0,0.5)'
                          : '0 12px 28px rgba(15, 23, 42, 0.08)',
                      },
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip
                        label={item.tag}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(220, 38, 38, 0.1)',
                          color: CR,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                        }}
                      />
                      <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8', fontFamily: 'JetBrains Mono' }}>
                        0{idx + 1}
                      </Typography>
                    </Box>

                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '1.35rem',
                        mb: 1.5,
                        color: isDark ? '#FFFFFF' : '#0B0B0F',
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                        fontSize: '0.95rem',
                        lineHeight: 1.7,
                        mb: 3,
                      }}
                    >
                      {item.desc}
                    </Typography>

                    <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0', mb: 2.5, mt: 'auto' }} />

                    <Stack spacing={1.2}>
                      {item.details.map((detail, didx) => (
                        <Box key={didx} display="flex" alignItems="flex-start" gap={1.2}>
                          <CheckCircle sx={{ color: '#22C55E', fontSize: 16, mt: 0.3, flexShrink: 0 }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#334155',
                              fontSize: '0.82rem',
                              lineHeight: 1.5,
                            }}
                          >
                            {detail}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation CTA */}
        <Box
          sx={{
            mt: 10,
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            bgcolor: isDark ? '#06060A' : '#F1F5F9',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #CBD5E1',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              color: isDark ? '#FFFFFF' : '#0B0B0F',
              mb: 1.5,
            }}
          >
            Ready to explore how KAVACH responds to threats?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B',
              fontSize: '1.05rem',
              maxWidth: 650,
              mx: 'auto',
              mb: 4,
            }}
          >
            Trace a security signal through all seven stages of our autonomous response loop or meet Raksha AI, the cybersecurity copilot embedded inside KAVACH.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => navigate('/how-it-works')}
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: CR,
                color: '#FFFFFF',
                fontWeight: 800,
                borderRadius: '100px',
                px: 3.5,
                py: 1.3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#B91C1C' },
              }}
            >
              See How It Works
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/raksha-ai')}
              sx={{
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)',
                color: isDark ? '#FFFFFF' : '#0B0B0F',
                fontWeight: 700,
                borderRadius: '100px',
                px: 3.5,
                py: 1.3,
                textTransform: 'none',
                '&:hover': { borderColor: CR, color: CR },
              }}
            >
              Meet Raksha AI
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
export default Features;
