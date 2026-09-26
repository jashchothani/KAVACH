import React from 'react';
import { Box, Container, Typography, Paper, Chip, Stack } from '@mui/material';
import { Gavel, Security, Bolt, Verified, AssignmentTurnedIn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

export const TermsOfService: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const sections = [
    {
      icon: <Security sx={{ color: '#DC2626', fontSize: 26 }} />,
      title: '1. Service Scope & Autonomous Protection SLA',
      content: `KAVACH grants the subscribing entity a non-exclusive license to deploy endpoint telemetry collectors, SCADA DPI gateways, and cloud correlation modules. We commit to a 99.99% telemetry ingestion uptime and sub-12 millisecond autonomous containment latency for verified high-severity zero-day threats.`,
    },
    {
      icon: <Bolt sx={{ color: '#F59E0B', fontSize: 26 }} />,
      title: '2. Autonomous Containment Authorization',
      content: `You expressly authorize KAVACH to execute pre-approved SOAR containment playbooks (including network socket severing, process suspension, and Active Directory session invalidation) when an ongoing attack vector is confirmed. KAVACH operates in deterministic mode to prevent unintended system disruption.`,
    },
    {
      icon: <Verified sx={{ color: '#16A34A', fontSize: 26 }} />,
      title: '3. Intellectual Property & Brand Ownership',
      content: `KAVACH, the Raksha AI neural engine, and associated algorithms are the exclusive intellectual property of Swastik Chemical (India). Customers retain 100% intellectual property ownership of their own business telemetry, logs, and internal enterprise data.`,
    },
    {
      icon: <AssignmentTurnedIn sx={{ color: '#3B82F6', fontSize: 26 }} />,
      title: '4. Limitation of Liability & Warranties',
      content: `While KAVACH delivers state-of-the-art multi-layer behavioral anomaly detection with 99.98% verified accuracy, cybersecurity defense is inherently adversarial. KAVACH is provided as a defense-in-depth platform. Swastik Chemical (India) shall not be held liable for indirect, incidental, or consequential damages beyond the subscription fees paid in the preceding twelve months.`,
    },
    {
      icon: <Gavel sx={{ color: '#8B5CF6', fontSize: 26 }} />,
      title: '5. Governing Law & Sovereign Jurisdiction',
      content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra, India.`,
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
        <Box textAlign="center" mb={8}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<Gavel sx={{ color: '#DC2626 !important' }} />}
              label="LEGAL TERMS & ENTERPRISE SLA"
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
              Terms of Service
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                fontSize: '1.1rem',
                maxWidth: 740,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Enterprise terms governing the deployment, telemetry processing, and autonomous threat mitigation services provided by KAVACH.
            </Typography>
          </motion.div>
        </Box>

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

        <Box textAlign="center" mt={8} pt={4} borderTop={isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'}>
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B' }}>
            For enterprise SLA customizations or master service agreements (MSA), contact legal@swastikchemical.in
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TermsOfService;
