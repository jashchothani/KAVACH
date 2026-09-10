import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper, Chip, Stack,
  Button, useTheme, Card, CardContent, Tabs, Tab
} from '@mui/material';
import {
  Shield, PrecisionManufacturing, Memory, RocketLaunch, WorkspacePremium,
  CalendarMonth, Storage, Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { KavachLogo } from '../../components/common/KavachLogo';
import { GanttProjectPlan } from '../../components/common/GanttProjectPlan';
import { SystemSpecsModal } from '../../components/common/SystemSpecsModal';

export const About: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const [sectionTab, setSectionTab] = useState<number>(0);

  const milestones = [
    { year: '2018', title: 'Industrial Security Foundation', desc: 'Swastik Chemical (India) established internal cybersecurity protocols for chemical manufacturing plants.' },
    { year: '2020', title: 'SCADA & OT Protocol R&D', desc: 'Developed native real-time telemetry parsers for Modbus, DNP3, and industrial PLCs.' },
    { year: '2022', title: 'Neural AI Correlation Engine', desc: 'Integrated deep learning models for zero-day execution signature correlation.' },
    { year: '2024', title: 'KAVACH SOAR-XDR Global Release', desc: 'Unveiled the full autonomous SOAR-XDR platform protecting global enterprise and industrial infrastructure.' },
  ];

  const corePillars = [
    {
      title: 'Autonomous Speed',
      desc: 'Executing containment playbooks in under 12 milliseconds to preempt lateral movement and ransomware encryption.',
      icon: <RocketLaunch sx={{ fontSize: 36, color: '#C1121F' }} />
    },
    {
      title: 'Neural Precision',
      desc: 'Multi-layer neural networks eliminating false positives while detecting stealthy zero-day exfiltration patterns.',
      icon: <Memory sx={{ fontSize: 36, color: '#F59E0B' }} />
    },
    {
      title: 'Industrial OT Resilience',
      desc: 'Deep domain expertise from Swastik Chemical (India) ensuring air-gapped chemical & SCADA safety.',
      icon: <PrecisionManufacturing sx={{ fontSize: 36, color: '#10B981' }} />
    },
    {
      title: 'Immutable Compliance',
      desc: 'Cryptographically sealed audit trails satisfying SOC2 Type II, ISO 27001, and CERT-In mandates.',
      icon: <WorkspacePremium sx={{ fontSize: 36, color: '#3B82F6' }} />
    }
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl">
        {/* Header Banner */}
        <Box textAlign="center" mb={6}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<Shield sx={{ color: '#C1121F !important' }} />}
              label="ABOUT SWASTIK CHEMICAL & KAVACH"
              sx={{ bgcolor: 'rgba(193, 18, 31, 0.12)', color: '#C1121F', fontWeight: 800, mb: 2 }}
            />
            <Typography variant="h1" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 2 }}>
              Pioneering Industrial & AI Cyber Defense
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 400, lineHeight: 1.7 }}>
              Born from the industrial chemical manufacturing heritage of <strong>Swastik Chemical (India)</strong>, KAVACH represents the pinnacle of AI-driven SOAR-XDR threat intelligence.
            </Typography>
          </motion.div>
        </Box>

        {/* Section Navigation Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <Tabs
            value={sectionTab}
            onChange={(_, val) => setSectionTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: isDark ? 'rgba(13, 14, 24, 0.8)' : '#FFFFFF',
              p: 0.8,
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiTabs-indicator': { bgcolor: '#C1121F', height: 3, borderRadius: '3px' },
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.92rem',
                minHeight: 44,
                borderRadius: 2,
                '&.Mui-selected': { color: '#FFFFFF', bgcolor: 'rgba(193, 18, 31, 0.15)' }
              }
            }}
          >
            <Tab icon={<Info sx={{ fontSize: 18 }} />} iconPosition="start" label="Heritage & Vision" />
            <Tab icon={<CalendarMonth sx={{ fontSize: 18 }} />} iconPosition="start" label="11-Week Gantt Roadmap" />
            <Tab icon={<Storage sx={{ fontSize: 18 }} />} iconPosition="start" label="System Architecture & Specs" />
          </Tabs>
        </Box>

        {/* TAB 0: Heritage & Vision */}
        {sectionTab === 0 && (
          <Box>
            {/* Brand Story Section */}
            <Paper
              elevation={0}
              className="glass-panel-enterprise"
              sx={{
                p: { xs: 4, md: 6 },
                borderRadius: 4,
                mb: 8,
              }}
            >
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={5} textAlign="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <KavachLogo size="lg" showSubtitle={true} />
                  </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Typography variant="h3" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 2, color: '#FFFFFF' }}>
                    Our Heritage & Vision
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.8, mb: 2 }}>
                    Swastik Chemical (India) has long stood as a leader in chemical manufacturing and industrial operations. Recognizing that modern industrial infrastructure faces unprecedented cyber threats, our engineering teams created <strong>KAVACH</strong>—a dedicated AI-driven Security Orchestration, Automation, and Response (SOAR-XDR) platform.
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.8, mb: 4 }}>
                    KAVACH bridges the gap between traditional IT cybersecurity and specialized industrial OT/SCADA environments. By combining real-time neural AI telemetry analysis with instant automated containment playbooks, KAVACH ensures continuous operational resilience.
                  </Typography>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<RocketLaunch />}
                      onClick={() => navigate('/download')}
                      sx={{
                        background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                        fontWeight: 800,
                        px: 3,
                        py: 1.2,
                        borderRadius: 2
                      }}
                    >
                      Explore Platform Agents
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/contact')}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        px: 3,
                        py: 1.2,
                        borderRadius: 2
                      }}
                    >
                      Contact SOC Team
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Four Core Pillars */}
            <Box mb={8}>
              <Box textAlign="center" mb={5}>
                <Typography variant="h2" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 1.5, color: '#FFFFFF' }}>
                  Core Engineering Pillars
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  The foundational principles guiding KAVACH's autonomous threat defense architecture.
                </Typography>
              </Box>

              <Grid container spacing={3.5}>
                {corePillars.map((pillar, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      className="glass-panel-enterprise"
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        p: 1
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box mb={2}>{pillar.icon}</Box>
                        <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit', mb: 1.5, color: '#FFFFFF' }}>
                          {pillar.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.6 }}>
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
                <Typography variant="h2" fontWeight={900} sx={{ fontFamily: 'Outfit', color: '#FFFFFF' }}>
                  Milestones & Innovation Journey
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {milestones.map((m, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Paper
                      elevation={0}
                      className="glass-panel-enterprise"
                      sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: 3,
                      }}
                    >
                      <Typography variant="h3" fontWeight={900} sx={{ color: '#C1121F', fontFamily: 'Outfit', mb: 1 }}>
                        {m.year}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1, color: '#FFFFFF' }}>
                        {m.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {m.desc}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}

        {/* TAB 1: 11-Week Gantt Project Plan */}
        {sectionTab === 1 && (
          <GanttProjectPlan />
        )}

        {/* TAB 2: System Specifications & Architecture */}
        {sectionTab === 2 && (
          <SystemSpecsModal />
        )}
      </Container>
    </Box>
  );
};
