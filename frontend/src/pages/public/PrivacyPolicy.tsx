import React from 'react';
import { Box, Container, Typography, Grid, Paper, Chip, Divider, Stack } from '@mui/material';
import { Shield, Lock, VerifiedUser, Storage, Gavel, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

export const PrivacyPolicy: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const sections = [
    {
      icon: <VerifiedUser sx={{ color: '#DC2626', fontSize: 28 }} />,
      title: '1. Sovereign Architecture & Indian Data Residency',
      content: `KAVACH is developed and operated by Swastik Chemical (India). All telemetry, endpoint logs, and behavioral analysis data are processed within sovereign data centers located exclusively within the territory of India. We adhere strictly to the Digital Personal Data Protection Act (DPDP Act 2023) and CERT-In cybersecurity directives. Zero customer data is ever transferred, mirrored, or routed to extraterritorial jurisdictions without explicit sovereign authorization.`,
    },
    {
      icon: <Storage sx={{ color: '#3B82F6', fontSize: 28 }} />,
      title: '2. Telemetry Collection & Forensic Scope',
      content: `KAVACH collects metadata strictly required to perform autonomous threat prevention, incident correlation, and zero-day defense. This includes: (a) Process execution trees and parent PID lineage; (b) Network socket connection endpoints (IP, port, protocol); (c) File cryptographic hashes (SHA-256); (d) Ring-0 system call telemetry. We do NOT inspect, harvest, or store personal documents, keystrokes, personal communications, or non-security file contents.`,
    },
    {
      icon: <Lock sx={{ color: '#16A34A', fontSize: 28 }} />,
      title: '3. Zero-Knowledge Cryptography & Tamper-Proof Audit',
      content: `All collected telemetry is encrypted in transit via TLS 1.3 with forward secrecy and at rest via AES-256-GCM. Log integrity is cryptographically sealed using SHA3-256 Merkle tree state anchors. This guarantees complete non-repudiation and prevents any party—including KAVACH administrators—from retroactively tampering with forensic incident records.`,
    },
    {
      icon: <Gavel sx={{ color: '#D97706', fontSize: 28 }} />,
      title: '4. Autonomous Threat Containment Consent',
      content: `By deploying the KAVACH endpoint sensor or cloud collector, the organization authorizes KAVACH's autonomous SOAR engine to execute pre-compiled containment playbooks (such as host network isolation, malicious thread suspension, or session revocation) in sub-12 milliseconds when threat thresholds exceed 99% precision confidence. All automated interventions are logged with immutable timestamps.`,
    },
    {
      icon: <Shield sx={{ color: '#8B5CF6', fontSize: 28 }} />,
      title: '5. Telemetry Retention & Right to Erasure',
      content: `Standard security telemetry is retained for 90 days in warm forensic storage and 365 days in encrypted cold archival to satisfy SOC 2 Type II and CERT-In mandates. Customers retain full ownership of their data and may request cryptographically verified purge of non-incident logs upon subscription termination within 30 days.`,
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
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<Shield sx={{ color: '#DC2626 !important' }} />}
              label="SOVEREIGN PRIVACY & COMPLIANCE"
              sx={{
                bgcolor: 'rgba(220, 38, 38, 0.1)',
                color: '#DC2626',
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
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: isDark ? '#FFFFFF' : '#0F172A',
                mb: 2,
              }}
            >
              Privacy Policy & Sovereign Trust
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                fontSize: '1.1rem',
                maxWidth: 760,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              How KAVACH and <strong>Swastik Chemical (India)</strong> protect your enterprise data, enforce Indian sovereign residency, and adhere to zero-knowledge telemetry principles.
            </Typography>
          </motion.div>
        </Box>

        {/* Highlight Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            bgcolor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.06)',
            border: isDark ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid #BBF7D0',
            mb: 6,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                <CheckCircle sx={{ color: '#16A34A', fontSize: 24 }} />
                <Typography variant="h6" fontWeight={800} sx={{ color: '#16A34A', fontFamily: 'Outfit' }}>
                  DPDP Act 2023 & CERT-In Compliant Architecture
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#334155' }}>
                All cryptographic keys remain in sovereign Hardware Security Modules (HSM) located in Mumbai, India.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#64748B', display: 'block' }}>
                Effective Date: September 2026
              </Typography>
              <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 800 }}>
                Version 2.4 Sovereign Standard
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Sections */}
        <Stack spacing={4}>
          {sections.map((sec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3.5, md: 4.5 },
                  borderRadius: 4,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(15, 23, 42, 0.04)',
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  {sec.icon}
                  <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'Outfit', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                    {sec.title}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#334155', lineHeight: 1.8, fontSize: '0.98rem' }}>
                  {sec.content}
                </Typography>
              </Paper>
            </motion.div>
          ))}
        </Stack>

        {/* Contact Footer Note */}
        <Box textAlign="center" mt={8} pt={4} borderTop={isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'}>
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B' }}>
            Questions regarding our privacy framework or sovereign data guarantees? Contact our Data Protection Officer at{' '}
            <Box component="span" sx={{ color: '#DC2626', fontWeight: 700 }}>
              dpo@swastikchemical.in
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
