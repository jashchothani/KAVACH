import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper, Chip, Stack,
  Button, useTheme, Card, CardContent, Tabs, Tab, Divider
} from '@mui/material';
import {
  Shield, PrecisionManufacturing, Memory, RocketLaunch, WorkspacePremium,
  CalendarMonth, Storage, Info, CheckCircle, ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { KavachLogo } from '../../components/common/KavachLogo';
import { GanttProjectPlan } from '../../components/common/GanttProjectPlan';
import { SystemSpecsModal } from '../../components/common/SystemSpecsModal';

export const About: React.FC = () => {
  const navigate = useNavigate();
  const [sectionTab, setSectionTab] = useState<number>(0);

  const milestones = [
    { year: '2018', title: 'Industrial Security Foundation', desc: 'Swastik Chemical (India) established internal cybersecurity protocols for chemical manufacturing plants.' },
    { year: '2020', title: 'SCADA & OT Protocol R&D', desc: 'Developed native real-time telemetry parsers for Modbus, DNP3, and industrial PLCs.' },
    { year: '2022', title: 'Neural AI Correlation Engine', desc: 'Integrated deep learning models for zero-day execution signature correlation.' },
    { year: '2024', title: 'KAVACH Sovereign Release', desc: 'Unveiled the full autonomous SOAR-XDR platform protecting global enterprise and industrial infrastructure.' },
  ];

  const corePillars = [
    {
      title: 'Autonomous Speed',
      desc: 'Executing containment playbooks in under 12 milliseconds to preempt lateral movement and ransomware encryption.',
      icon: <RocketLaunch sx={{ fontSize: 36, color: '#DC2626' }} />
    },
    {
      title: 'Neural Precision',
      desc: 'Multi-layer neural networks eliminating false positives while detecting stealthy zero-day exfiltration patterns.',
      icon: <Memory sx={{ fontSize: 36, color: '#D97706' }} />
    },
    {
      title: 'Industrial OT Resilience',
      desc: 'Deep domain expertise from Swastik Chemical (India) ensuring air-gapped chemical & SCADA safety.',
      icon: <PrecisionManufacturing sx={{ fontSize: 36, color: '#16A34A' }} />
    },
    {
      title: 'Immutable Compliance',
      desc: 'Cryptographically sealed audit trails satisfying SOC2 Type II, ISO 27001, and CERT-In mandates.',
      icon: <WorkspacePremium sx={{ fontSize: 36, color: '#0284C7' }} />
    }
  ];

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F8FAFC', color: '#0F172A', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Header Banner */}
        <Box textAlign="center" mb={7}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<Shield sx={{ color: '#DC2626 !important' }} />}
              label="ABOUT SWASTIK CHEMICAL & KAVACH"
              sx={{ bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontWeight: 800, mb: 2 }}
            />
            <Typography
              variant="h1"
              fontWeight={900}
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: { xs: '2.4rem', md: '3.6rem' },
                color: '#0F172A',
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              Pioneering Industrial & AI Cyber Defense
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 800, mx: 'auto', color: '#64748B', fontWeight: 400, lineHeight: 1.7 }}>
              Born from the industrial chemical manufacturing heritage of <strong>Swastik Chemical (India)</strong>, KAVACH represents the pinnacle of AI-driven threat intelligence and effortless user protection.
            </Typography>
          </motion.div>
        </Box>

        {/* Section Navigation Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <Tabs
            value={sectionTab}
            onChange={(_, val) => setSectionTab(val)}
            sx={{
              bgcolor: '#FFFFFF',
              p: 0.8,
              borderRadius: 3.5,
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
              '& .MuiTabs-indicator': { bgcolor: '#DC2626', height: 3, borderRadius: '3px' },
              '& .MuiTab-root': {
                color: '#64748B',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.92rem',
                minHeight: 44,
                borderRadius: 2.5,
                '&.Mui-selected': { color: '#DC2626', bgcolor: 'rgba(220, 38, 38, 0.08)' }
              }
            }}
          >
            <Tab icon={<Info sx={{ fontSize: 18 }} />} iconPosition="start" label="Heritage & Corporate Vision" />
            <Tab icon={<Storage sx={{ fontSize: 18 }} />} iconPosition="start" label="Architecture & Specifications" />
          </Tabs>
        </Box>

        {/* TAB 0: Heritage & Vision */}
        {sectionTab === 0 && (
          <Box>
            {/* Brand Story Section */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                borderRadius: 4.5,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 32px rgba(15, 23, 42, 0.04)',
                mb: 8,
              }}
            >
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={5} textAlign="center">
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 4,
                      borderRadius: 3.5,
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Box
                      component="img"
                      src="/kavach-logo-transparent.png"
                      alt="KAVACH"
                      onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
                      sx={{ height: 80, width: 'auto', objectFit: 'contain', mb: 2 }}
                    />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        Swastik Chemical (India)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Enterprise Cyber R&D Division
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Typography variant="h3" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 2, color: '#0F172A' }}>
                    Our Heritage & Vision
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, mb: 2 }}>
                    Swastik Chemical (India) has long stood as a leader in chemical manufacturing and industrial operations. Recognizing that modern industrial and everyday computing environments face unprecedented cyber threats, our engineering teams created <strong>KAVACH</strong>—a dedicated autonomous threat deflection and security platform.
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, mb: 4 }}>
                    KAVACH bridges the gap between complex enterprise cybersecurity and everyday simplicity. By combining real-time kernel telemetry analysis with instant automated containment playbooks, KAVACH delivers effortless peace of mind to individuals, businesses, and critical infrastructure alike.
                  </Typography>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<RocketLaunch />}
                      onClick={() => navigate('/download')}
                      sx={{
                        bgcolor: '#DC2626',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        px: 3,
                        py: 1.3,
                        borderRadius: 2.5,
                        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
                        '&:hover': { bgcolor: '#B91C1C' },
                      }}
                    >
                      Explore Platform Agents
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/contact')}
                      sx={{
                        borderColor: '#CBD5E1',
                        color: '#0F172A',
                        fontWeight: 700,
                        px: 3,
                        py: 1.3,
                        borderRadius: 2.5,
                        '&:hover': { borderColor: '#0F172A', bgcolor: '#F8FAFC' },
                      }}
                    >
                      Contact Support
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Four Core Pillars */}
            <Box mb={8}>
              <Box textAlign="center" mb={5}>
                <Typography variant="h2" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 1.5, color: '#0F172A' }}>
                  Core Engineering Pillars
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B' }}>
                  The foundational principles guiding KAVACH's autonomous threat defense architecture.
                </Typography>
              </Box>

              <Grid container spacing={3.5}>
                {corePillars.map((pillar, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        borderRadius: 3.5,
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                          borderColor: '#CBD5E1',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3.5 }}>
                        <Box mb={2}>{pillar.icon}</Box>
                        <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit', mb: 1.5, color: '#0F172A' }}>
                          {pillar.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                          {pillar.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Milestone Timeline */}
            <Box>
              <Box textAlign="center" mb={5}>
                <Typography variant="h2" fontWeight={900} sx={{ fontFamily: 'Outfit', color: '#0F172A' }}>
                  Milestones & Innovation Journey
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {milestones.map((m, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3.5,
                        height: '100%',
                        borderRadius: 3.5,
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
                      }}
                    >
                      <Typography variant="h3" fontWeight={900} sx={{ color: '#DC2626', fontFamily: 'Outfit', mb: 1 }}>
                        {m.year}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1, color: '#0F172A' }}>
                        {m.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                        {m.desc}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}

        {/* TAB 1: System Specifications & Architecture */}
        {sectionTab === 1 && (
          <SystemSpecsModal />
        )}
      </Container>
    </Box>
  );
};
export default About;
