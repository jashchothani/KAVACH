import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, Chip, Stack,
  Divider, Paper
} from '@mui/material';
import {
  Shield, Lock, VisibilityOff, Policy, HistoryEdu,
  Security, ArrowForward, CheckCircle, Code, DataObject,
  AdminPanelSettings, Fingerprint, SyncAlt
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const securityPillars = [
    {
      title: 'Context Sanitization & AI Privacy',
      icon: <VisibilityOff sx={{ fontSize: 26, color: CR }} />,
      desc: 'Before any telemetry or incident context is processed by Raksha AI, sensitive data is stripped in memory. Credentials, bearer tokens, API keys, and personal identifiers never reach external providers.',
      points: [
        'Deterministic regex and pattern scrubbers for API keys, passwords, and private tokens',
        'Automatic token hashing: Sensitive identifiers are anonymized prior to analysis',
        'Advisory AI layer: The AI assistant never has write access to raw database tables or operating system execution rings',
      ],
    },
    {
      title: 'Controlled SOAR & Dry-Run Safety',
      icon: <Policy sx={{ fontSize: 26, color: '#3B82F6' }} />,
      desc: 'High-impact response actions (such as device isolation, domain blocking, or process termination) are designed around strict authorization gates and safe rollback mechanisms.',
      points: [
        'Dry-Run Simulation: Test playbook impact and target validation before live enforcement',
        'Human-in-the-loop authorization required for critical endpoint isolation',
        'One-click rollback capability for network isolation and policy adjustments',
      ],
    },
    {
      title: 'Immutable Database Audit Trail',
      icon: <HistoryEdu sx={{ fontSize: 26, color: '#F59E0B' }} />,
      desc: 'Every security event, alert triage status change, login attempt, and playbook execution is written to an immutable audit ledger with user provenance and timestamps.',
      points: [
        'Complete actor traceability: Records username, role, IP address, and correlation ID',
        'Exportable audit records in CSV and JSON formats for internal compliance and review',
        'Persistent logging preserved across application lifecycles and restarts',
      ],
    },
    {
      title: 'URL Shield & SSRF Policy Enforcement',
      icon: <Security sx={{ fontSize: 26, color: '#22C55E' }} />,
      desc: 'Protects systems from phishing, malicious redirections, and Server-Side Request Forgery (SSRF) by validating destination hosts against strict IP policy bounds.',
      points: [
        'Restricted CIDR blocking: Enforces quarantine on 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254, and ::1',
        'IDN / Punycode decoding for deceptive Cyrillic and Greek lookalike domains',
        'Typosquatting distance algorithm comparing input against known legitimate enterprise domains',
      ],
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      icon: <AdminPanelSettings sx={{ fontSize: 26, color: '#8B5CF6' }} />,
      desc: 'Granular permissions ensure users and administrators only access features relevant to their verified responsibilities.',
      points: [
        'Roles: Administrator, SOC Analyst, and User',
        'Granular permissions: VIEW_TELEMETRY, EXECUTE_PLAYBOOK, CONFIGURE_SECURITY, MANAGE_DEVICES',
        'JWT token validation with cryptographic expiration and session invalidation on logout',
      ],
    },
    {
      title: 'Local Sovereignty & Data Residency',
      icon: <Lock sx={{ fontSize: 26, color: '#06B6D4' }} />,
      desc: 'KAVACH is architected for sovereign data containment. Telemetry, event logs, and incident databases remain securely stored on your internal systems.',
      points: [
        'All telemetry databases (SQLite / PostgreSQL) run within your designated infrastructure',
        'No telemetry metrics are broadcast or sold to third-party ad networks or brokers',
        'Built with the industrial manufacturing resilience standards of Swastik Chemical (India)',
      ],
    },
  ];

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
              label="TRANSPARENT SECURITY ARCHITECTURE"
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
              Security designed with honesty and rigor.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                fontSize: { xs: '1.05rem', md: '1.18rem' },
                lineHeight: 1.7,
              }}
            >
              We do not invent synthetic compliance badges or fabricated guarantees. Instead, KAVACH implements concrete defensive engineering: automated context sanitization, dry-run response verification, immutable audit records, and strict SSRF policy enforcement.
            </Typography>
          </motion.div>
        </Box>

        {/* Pillars Grid */}
        <Grid container spacing={4} mb={8}>
          {securityPillars.map((pillar, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Box
                sx={{
                  p: { xs: 3.5, md: 4.5 },
                  height: '100%',
                  borderRadius: 4,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.025)' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.3)',
                    transform: 'translateY(-3px)',
                    boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 10px 24px rgba(15, 23, 42, 0.06)',
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 3,
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pillar.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
                    {pillar.title}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569', lineHeight: 1.75, mb: 3 }}>
                  {pillar.desc}
                </Typography>

                <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0', mb: 2.5, mt: 'auto' }} />

                <Stack spacing={1.5}>
                  {pillar.points.map((pt, pidx) => (
                    <Box key={pidx} display="flex" alignItems="flex-start" gap={1.2}>
                      <CheckCircle sx={{ color: '#22C55E', fontSize: 16, mt: 0.3, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#334155', fontSize: '0.84rem', lineHeight: 1.5 }}>
                        {pt}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Code of Ethics / Responsible Defense Banner */}
        <Box
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            bgcolor: isDark ? '#06060A' : '#F1F5F9',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #CBD5E1',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 900, mb: 1.5, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
            Security should be protective, transparent, and controllable.
          </Typography>
          <Typography variant="body1" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B', maxWidth: 680, mx: 'auto', mb: 4 }}>
            Explore the platform hands-on to see how KAVACH correlates telemetry, enforces safety guardrails, and keeps you informed every step of the way.
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
              py: 1.4,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Access KAVACH Security Operations
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
export default SecurityPage;
