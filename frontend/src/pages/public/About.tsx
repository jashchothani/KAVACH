import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, Chip, Stack,
  Divider, Tooltip
} from '@mui/material';
import {
  Shield, Psychology, Hub, Bolt, SmartToy, Language,
  Terminal, Computer, PhoneIphone, Extension, CheckCircle,
  Speed, Lock, Visibility, Layers, ArrowForward,
  Sensors, Storage, PlayArrow, FiberManualRecord, AutoFixHigh,
  Security, VerifiedUser, Memory, Dns, OpenInNew
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';

// Animation easing curve
const smoothEase = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: smoothEase,
    },
  },
};

// Section Header with animated line and badge
const SectionHeader: React.FC<{
  num: string;
  title: string;
  subtitle?: string;
  isDark: boolean;
}> = ({ num, title, subtitle, isDark }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.5, ease: smoothEase }}
  >
    <Box sx={{ mb: { xs: 4, md: 6 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.4,
            borderRadius: 1,
            bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
            border: isDark ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid rgba(220, 38, 38, 0.2)',
          }}
        >
          <Typography
            sx={{
              color: CR,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
            }}
          >
            SECTION {num}
          </Typography>
        </Box>
        <Box
          sx={{
            height: '1px',
            flexGrow: 1,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }}
        />
      </Box>
      <Typography
        variant="h2"
        sx={{
          color: isDark ? '#FFFFFF' : '#090A0F',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 900,
          fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.6rem' },
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            mt: 1,
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </motion.div>
);

export const About: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [deflectedCount, setDeflectedCount] = useState<number>(1428);
  const [activeLog, setActiveLog] = useState<string>('All 16 collectors nominal. Zero active breaches.');

  const handleSimulateAttack = () => {
    if (simulating) return;
    setSimulating(true);
    setActiveLog('INCOMING: Encoded PowerShell (MITRE T1059.001) targeting WS-0492...');
    setTimeout(() => {
      setActiveLog('SOAR TRIGGERED: Host WS-0492 isolated • Process PID 4920 terminated in 14ms');
      setDeflectedCount((prev) => prev + 1);
      setTimeout(() => {
        setSimulating(false);
        setActiveLog('SYSTEM RESTORED: Endpoint re-baselined. Threat neutralized.');
      }, 2400);
    }, 1200);
  };

  // Theme-aware tokens
  const bg = isDark ? '#08080C' : '#FDFCFB';
  const cardBg = isDark ? '#0E1017' : '#FFFFFF';
  const elevatedBg = isDark ? '#141722' : '#F8FAFC';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const borderHover = isDark ? 'rgba(220, 38, 38, 0.45)' : 'rgba(220, 38, 38, 0.35)';
  const textPrimary = isDark ? '#FFFFFF' : '#090A0F';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.68)' : '#475569';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.42)' : '#64748B';
  const cardShadow = isDark
    ? '0 12px 32px -8px rgba(0, 0, 0, 0.6)'
    : '0 10px 30px -8px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02)';

  // Telemetry Pipeline Steps
  const pipelineSteps = [
    {
      name: 'Collect',
      label: 'Telemetry Aggregation',
      desc: '16 dedicated background collectors passively stream process, socket, registry, DNS, and auth events.',
      detail: 'Continuous event collection without kernel degradation or user interruption.',
      icon: <Sensors sx={{ fontSize: 20 }} />,
    },
    {
      name: 'Analyze',
      label: 'Dual-Engine Evaluation',
      desc: 'Simultaneous evaluation across deterministic MITRE ATT&CK rules and IsolationForest ML behavioral vector trees.',
      detail: 'Detects both known exploit signatures and zero-day anomaly deviations.',
      icon: <Psychology sx={{ fontSize: 20 }} />,
    },
    {
      name: 'Correlate',
      label: 'Incident Graph Stitching',
      desc: 'Connects isolated alerts across entities into unified multi-stage attack timelines and causal chains.',
      detail: 'Eliminates alert fatigue by clustering 100+ raw hits into single actionable incidents.',
      icon: <Hub sx={{ fontSize: 20 }} />,
    },
    {
      name: 'Score',
      label: 'Dynamic Risk Quantification',
      desc: 'Calculates real-time KAVACH Security Score (0–100) weighting active vulnerabilities and anomaly velocity.',
      detail: 'Translates high-dimensional telemetry into transparent posture indicators.',
      icon: <Speed sx={{ fontSize: 20 }} />,
    },
    {
      name: 'Alert',
      label: 'Priority Dispatch & Explanations',
      desc: 'Dispatches contextual alerts to SOC consoles with Raksha AI natural-language explanations and evidence snippets.',
      detail: 'Provides executive summaries alongside raw JSON telemetry forensics.',
      icon: <SmartToy sx={{ fontSize: 20 }} />,
    },
    {
      name: 'Respond',
      label: 'Automated SOAR Execution',
      desc: 'Executes decisive playbooks: host network isolation, malicious process kill, domain blocking, and memory capture.',
      detail: 'Sub-second response actions containing adversary lateral movement before breach escalation.',
      icon: <Bolt sx={{ fontSize: 20 }} />,
    },
  ];

  // Core Capabilities
  const coreCapabilities = [
    {
      num: '01',
      title: 'Detect',
      icon: <Shield sx={{ fontSize: 26, color: CR }} />,
      desc: 'Continuously monitor endpoint and system activity to identify suspicious behavior with sub-millisecond precision.',
      badge: 'Zero Latency',
    },
    {
      num: '02',
      title: 'Analyze',
      icon: <Psychology sx={{ fontSize: 26, color: '#3B82F6' }} />,
      desc: 'Combine rules, behavioral analytics, machine learning, threat intelligence, and event correlation to investigate potential threats.',
      badge: 'ML + Rules',
    },
    {
      num: '03',
      title: 'Correlate',
      icon: <Hub sx={{ fontSize: 26, color: '#A855F7' }} />,
      desc: 'Connect related security events into meaningful incidents instead of treating every individual event as an isolated alert.',
      badge: 'Incident Graph',
    },
    {
      num: '04',
      title: 'Respond',
      icon: <Bolt sx={{ fontSize: 26, color: '#EAB308' }} />,
      desc: 'Execute predefined SOAR playbooks for supported security-response actions including device isolation and process kills.',
      badge: 'Automated SOAR',
    },
    {
      num: '05',
      title: 'Assist',
      icon: <SmartToy sx={{ fontSize: 26, color: '#22C55E' }} />,
      desc: "Raksha AI, KAVACH's embedded AI security assistant, helps users understand alerts and query threat context using natural language.",
      badge: 'Natural Language',
    },
    {
      num: '06',
      title: 'Protect',
      icon: <Language sx={{ fontSize: 26, color: '#EC4899' }} />,
      desc: 'URL security layer helps identify potentially dangerous destinations and applies defenses against malicious domains and phishing.',
      badge: 'Web & Phishing Guard',
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: 'transparent',
        color: textPrimary,
        minHeight: '100vh',
        pb: { xs: 16, md: 24 },
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.08, 1],
          opacity: isDark ? [0.08, 0.14, 0.08] : [0.03, 0.06, 0.03],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: '-5%',
          right: '-5%',
          width: '55vw',
          height: '55vw',
          background: `radial-gradient(circle, ${CR} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.12, 1],
          opacity: isDark ? [0.05, 0.09, 0.05] : [0.02, 0.05, 0.02],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        sx={{
          position: 'absolute',
          top: '35%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── HERO SECTION ─── */}
      <Box
        sx={{
          pt: { xs: 16, sm: 20, md: 24 },
          pb: { xs: 10, sm: 14, md: 16 },
          position: 'relative',
          zIndex: 1,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 6, lg: 8 }} alignItems="center">
            {/* Left Column: Command Manifesto & Controls */}
            <Grid item xs={12} lg={6.5}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                {/* Top Status Badges */}
                <motion.div variants={itemVariants}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 0.6,
                        borderRadius: 999,
                        bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                        border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.25)',
                      }}
                    >
                      <Box
                        component={motion.div}
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CR }}
                      />
                      <Typography
                        sx={{
                          color: CR,
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        SWASTIK CHEMICAL (INDIA) // CYBER DEFENSE LABS
                      </Typography>
                    </Box>

                    <Chip
                      label="PRODUCTION RELEASE v2.4"
                      size="small"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        bgcolor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                        color: '#22C55E',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        borderRadius: 999,
                      }}
                    />
                  </Box>
                </motion.div>

                {/* Title */}
                <motion.div variants={itemVariants}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 900,
                      fontSize: { xs: '3rem', sm: '4.2rem', md: '5.2rem' },
                      color: textPrimary,
                      lineHeight: 1.0,
                      letterSpacing: '-0.035em',
                      mb: 2,
                    }}
                  >
                    KAVACH
                  </Typography>
                </motion.div>

                {/* Tagline */}
                <motion.div variants={itemVariants}>
                  <Typography
                    sx={{
                      color: isDark ? '#FFFFFF' : '#090A0F',
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                      fontWeight: 800,
                      fontFamily: 'Outfit, sans-serif',
                      letterSpacing: '-0.02em',
                      mb: 3,
                      lineHeight: 1.25,
                    }}
                  >
                    AI-Driven SOAR-XDR Threat Intelligence & Response Platform
                  </Typography>
                </motion.div>

                {/* Editorial Lead Paragraph */}
                <motion.div variants={itemVariants}>
                  <Typography
                    sx={{
                      color: textSecondary,
                      fontSize: { xs: '1.02rem', md: '1.15rem' },
                      lineHeight: 1.75,
                      mb: 4,
                      maxWidth: 680,
                    }}
                  >
                    Engineered by <Box component="span" sx={{ color: textPrimary, fontWeight: 700 }}>Swastik Chemical (India)</Box> to deliver enterprise-grade autonomous threat hunting, real-time kernel telemetry correlation, and instant SOAR containment playbooks across distributed modern endpoints.
                  </Typography>
                </motion.div>

                {/* Action Row */}
                <motion.div variants={itemVariants}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 5 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/login')}
                      endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                      sx={{
                        bgcolor: CR,
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '1rem',
                        textTransform: 'none',
                        px: 3.8,
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.45)',
                        '&:hover': {
                          bgcolor: '#B91C1C',
                          boxShadow: '0 12px 28px -4px rgba(220, 38, 38, 0.65)',
                        },
                      }}
                    >
                      Launch KAVACH Console
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleSimulateAttack}
                      disabled={simulating}
                      startIcon={<Bolt sx={{ color: CR }} />}
                      sx={{
                        color: textPrimary,
                        borderColor: border,
                        fontWeight: 700,
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '1rem',
                        textTransform: 'none',
                        px: 3.5,
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: elevatedBg,
                        '&:hover': {
                          borderColor: CR,
                          bgcolor: elevatedBg,
                        },
                      }}
                    >
                      {simulating ? 'Deflecting Threat...' : 'Simulate Threat Pulse'}
                    </Button>
                  </Stack>
                </motion.div>

                {/* 4 Quick Stat Cards */}
                <motion.div variants={itemVariants}>
                  <Grid container spacing={1.8}>
                    {[
                      { label: 'TELEMETRY SOURCES', value: '16 Passive Sensors', tag: 'Real-time OS' },
                      { label: 'INTELLIGENCE CORE', value: 'MITRE ATT&CK + ML', tag: 'Dual Engine' },
                      { label: 'SOAR PLAYBOOKS', value: 'Sub-Second Containment', tag: 'Zero Latency' },
                      { label: 'AI COPILOT', value: 'Raksha AI Embedded', tag: 'Neural Agent' },
                    ].map((stat, i) => (
                      <Grid item xs={6} sm={3} key={i}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: cardBg,
                            border: `1px solid ${border}`,
                            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            sx={{
                              color: textMuted,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              fontFamily: 'JetBrains Mono, monospace',
                              letterSpacing: '0.06em',
                              mb: 0.5,
                            }}
                          >
                            {stat.label}
                          </Typography>
                          <Typography
                            sx={{
                              color: textPrimary,
                              fontSize: '0.92rem',
                              fontWeight: 800,
                              fontFamily: 'Outfit, sans-serif',
                              lineHeight: 1.3,
                            }}
                          >
                            {stat.value}
                          </Typography>
                          <Typography
                            sx={{
                              color: CR,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              fontFamily: 'JetBrains Mono, monospace',
                              mt: 0.8,
                            }}
                          >
                            {stat.tag}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Right Column: Innovative Interactive Sovereign Radar & Defense Console */}
            <Grid item xs={12} lg={5.5}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: smoothEase }}
              >
                <Box
                  sx={{
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3.5,
                    boxShadow: cardShadow,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Console Header Bar */}
                  <Box
                    sx={{
                      px: 3,
                      py: 1.8,
                      bgcolor: elevatedBg,
                      borderBottom: `1px solid ${border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#EF4444' }} />
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#10B981' }} />
                      <Typography
                        sx={{
                          ml: 1,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          color: textPrimary,
                        }}
                      >
                        KAVACH_TELEMETRY_CORE.v2.4
                      </Typography>
                    </Box>

                    <Chip
                      label={simulating ? 'DEFLECTING...' : 'LIVE RADAR // 100% HEALTHY'}
                      size="small"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        bgcolor: simulating ? 'rgba(220, 38, 38, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                        color: simulating ? CR : '#22C55E',
                        border: simulating ? `1px solid ${CR}` : '1px solid rgba(34, 197, 94, 0.3)',
                      }}
                    />
                  </Box>

                  {/* Interactive Radar Visual Canvas */}
                  <Box
                    sx={{
                      position: 'relative',
                      height: 340,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      bgcolor: isDark ? '#050508' : '#0B0F19',
                    }}
                  >
                    {/* Background Radar Rings */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: 290,
                        height: 290,
                        borderRadius: '50%',
                        border: '1px dashed rgba(255, 255, 255, 0.08)',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        width: 110,
                        height: 110,
                        borderRadius: '50%',
                        border: `1px solid ${CR}`,
                        opacity: 0.3,
                      }}
                    />

                    {/* Rotating Radar Scan Beam */}
                    <Box
                      component={motion.div}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                      sx={{
                        position: 'absolute',
                        width: 290,
                        height: 290,
                        borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, transparent 75%, rgba(220, 38, 38, 0.25) 100%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Threat Node during Simulation */}
                    {simulating && (
                      <Box
                        component={motion.div}
                        initial={{ x: -130, y: -100, opacity: 0, scale: 0.5 }}
                        animate={{ x: -40, y: -30, opacity: [0, 1, 1, 0], scale: [0.8, 1.3, 1.6, 0] }}
                        transition={{ duration: 1.2, ease: 'easeIn' }}
                        sx={{
                          position: 'absolute',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: '#EF4444',
                          boxShadow: '0 0 15px #EF4444',
                          zIndex: 10,
                        }}
                      />
                    )}

                    {/* Center Sovereign Shield Core */}
                    <Box
                      component={motion.div}
                      animate={simulating ? { scale: [1, 1.2, 1], borderColor: ['#DC2626', '#22C55E', '#DC2626'] } : {}}
                      transition={{ duration: 0.8 }}
                      sx={{
                        width: 84,
                        height: 84,
                        borderRadius: '50%',
                        bgcolor: 'rgba(220, 38, 38, 0.15)',
                        border: `2px solid ${CR}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 5,
                        boxShadow: '0 0 30px rgba(220, 38, 38, 0.4)',
                      }}
                    >
                      <Shield sx={{ color: '#FFFFFF', fontSize: 32 }} />
                      <Typography
                        sx={{
                          color: '#FFFFFF',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.55rem',
                          fontWeight: 900,
                          letterSpacing: '0.08em',
                        }}
                      >
                        KAVACH
                      </Typography>
                    </Box>

                    {/* Satellite Nodes */}
                    {[
                      { name: 'WS-0492', ip: '10.0.9.14', x: -100, y: -80, color: '#22C55E' },
                      { name: 'GATEWAY', ip: '10.0.1.1', x: 105, y: -75, color: '#3B82F6' },
                      { name: 'VAULT-IN', ip: 'Sovereign', x: -105, y: 75, color: '#A855F7' },
                      { name: 'RAKSHA', ip: 'Neural', x: 100, y: 80, color: '#EAB308' },
                    ].map((node) => (
                      <Box
                        key={node.name}
                        sx={{
                          position: 'absolute',
                          transform: `translate(${node.x}px, ${node.y}px)`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.8,
                          px: 1.2,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: node.color }} />
                        <Box>
                          <Typography sx={{ color: '#FFFFFF', fontSize: '0.68rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                            {node.name}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.58rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            {node.ip}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Live Telemetry Ticker */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: elevatedBg,
                      borderTop: `1px solid ${border}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography
                        sx={{
                          color: textMuted,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        LIVE SOVEREIGN TELEMETRY FEED
                      </Typography>
                      <Typography
                        sx={{
                          color: CR,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        DEFLECTED: {deflectedCount}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: isDark ? '#050508' : '#0B0F19',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: simulating ? '#F87171' : '#4ADE80',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.78rem',
                          lineHeight: 1.5,
                        }}
                      >
                        &gt; {activeLog}
                        <Box component="span" sx={{ animation: 'blink 1s infinite' }}>_</Box>
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography sx={{ color: textMuted, fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif' }}>
                        Autonomous SOAR Engine • Swastik Chemical
                      </Typography>
                      <Button
                        size="small"
                        onClick={handleSimulateAttack}
                        disabled={simulating}
                        sx={{
                          color: CR,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          textTransform: 'none',
                          p: 0,
                          '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                        }}
                      >
                        {simulating ? 'Deflecting...' : '[ Re-run Deflection ]'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 8, md: 12 } }}>

        {/* ─── 01 MISSION ─── */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <SectionHeader
            num="01"
            title="Our Mission"
            isDark={isDark}
            subtitle="The fundamental belief that drives KAVACH's engineering and design principles."
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: smoothEase }}
          >
            <Box
              sx={{
                p: { xs: 4, sm: 6, md: 8 },
                bgcolor: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 3,
                boxShadow: cardShadow,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  bgcolor: CR,
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontSize: { xs: '2rem', sm: '2.8rem', md: '3.6rem' },
                  color: textPrimary,
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                  mb: 4,
                }}
              >
                "Make advanced cybersecurity{' '}
                <Box
                  component="span"
                  sx={{
                    color: CR,
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  simpler
                </Box>
                ,{' '}
                <Box
                  component="span"
                  sx={{
                    color: CR,
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  faster
                </Box>
                , and{' '}
                <Box
                  component="span"
                  sx={{
                    color: CR,
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  accessible
                </Box>
                ."
              </Typography>

              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Typography
                    sx={{
                      color: textSecondary,
                      fontSize: { xs: '1.05rem', md: '1.15rem' },
                      lineHeight: 1.8,
                    }}
                  >
                    KAVACH is built around the idea that security should not require every user to be a cybersecurity expert. The platform converts complex technical events into understandable security insights while providing advanced capabilities for security analysts.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: elevatedBg,
                      border: `1px solid ${border}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: CR,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        letterSpacing: '0.08em',
                        mb: 1.5,
                      }}
                    >
                      THE KAVACH TRANSFORMATION
                    </Typography>
                    <Typography
                      sx={{
                        color: textPrimary,
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        lineHeight: 1.5,
                      }}
                    >
                      KAVACH transforms complex security data into clear, actionable intelligence.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </Box>

        <Divider sx={{ borderColor: border }} />

        {/* ─── 02 HOW IT WORKS / PIPELINE & CAPABILITIES ─── */}
        <Box sx={{ py: { xs: 8, md: 14 } }}>
          <SectionHeader
            num="02"
            title="How It Works"
            isDark={isDark}
            subtitle="The 6-stage telemetry and response pipeline continuously protecting your fleet."
          />

          {/* Interactive Pipeline Ribbon */}
          <Box sx={{ mb: 8 }}>
            <Box
              sx={{
                p: { xs: 2, md: 3 },
                bgcolor: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 3,
                boxShadow: cardShadow,
              }}
            >
              <Grid container spacing={1.5} alignItems="stretch">
                {pipelineSteps.map((step, i) => {
                  const isActive = activePipelineStep === i;
                  return (
                    <Grid item xs={6} sm={4} md={2} key={step.name}>
                      <Box
                        component={motion.div}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActivePipelineStep(i)}
                        sx={{
                          p: 2,
                          height: '100%',
                          borderRadius: 2,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          bgcolor: isActive
                            ? (isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)')
                            : elevatedBg,
                          border: isActive
                            ? `1px solid ${CR}`
                            : `1px solid ${border}`,
                          transition: 'all 0.25s ease',
                          position: 'relative',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography
                            sx={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              color: isActive ? CR : textMuted,
                            }}
                          >
                            0{i + 1}
                          </Typography>
                          <Box sx={{ color: isActive ? CR : textSecondary }}>
                            {step.icon}
                          </Box>
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: isActive ? (isDark ? '#FFFFFF' : CR) : textPrimary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {step.name}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Active Pipeline Detail Box */}
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  bgcolor: elevatedBg,
                  borderRadius: 2,
                  border: `1px solid ${border}`,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Chip
                      label={`STEP 0${activePipelineStep + 1} — ${pipelineSteps[activePipelineStep].name.toUpperCase()}`}
                      size="small"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        bgcolor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)',
                        color: CR,
                        border: `1px solid ${CR}`,
                      }}
                    />
                    <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: '0.95rem' }}>
                      {pipelineSteps[activePipelineStep].label}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: textSecondary, fontSize: '0.92rem', lineHeight: 1.6 }}>
                    {pipelineSteps[activePipelineStep].desc} {pipelineSteps[activePipelineStep].detail}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/how-it-works')}
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  sx={{
                    color: textPrimary,
                    borderColor: border,
                    textTransform: 'none',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: CR,
                      color: CR,
                    },
                  }}
                >
                  Deep Dive
                </Button>
              </Box>
            </Box>
          </Box>

          {/* 6 Core Capabilities Cards */}
          <Typography
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: textPrimary,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box sx={{ width: 8, height: 8, bgcolor: CR, borderRadius: '50%' }} />
            Core Capabilities
          </Typography>

          <Grid container spacing={3}>
            {coreCapabilities.map((cap, i) => (
              <Grid item xs={12} sm={6} md={4} key={cap.num}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: smoothEase }}
                  whileHover={{
                    y: -6,
                    transition: { duration: 0.25 },
                  }}
                  style={{ height: '100%' }}
                >
                  <Box
                    sx={{
                      p: 4,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: cardBg,
                      border: `1px solid ${border}`,
                      borderRadius: 3,
                      boxShadow: cardShadow,
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        borderColor: borderHover,
                        boxShadow: isDark
                          ? '0 16px 40px -10px rgba(0,0,0,0.8), 0 0 20px -5px rgba(220,38,38,0.15)'
                          : '0 16px 36px -10px rgba(0,0,0,0.08), 0 0 20px -5px rgba(220,38,38,0.1)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: elevatedBg,
                          border: `1px solid ${border}`,
                        }}
                      >
                        {cap.icon}
                      </Box>
                      <Chip
                        label={cap.badge}
                        size="small"
                        sx={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                          color: textMuted,
                          border: `1px solid ${border}`,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        color: textPrimary,
                        fontWeight: 800,
                        fontSize: '1.35rem',
                        mb: 1.5,
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {cap.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: textSecondary,
                        fontSize: '0.95rem',
                        lineHeight: 1.65,
                        flexGrow: 1,
                      }}
                    >
                      {cap.desc}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ borderColor: border }} />

        {/* ─── 03 BUILT FOR TWO WORLDS ─── */}
        <Box sx={{ py: { xs: 8, md: 14 } }}>
          <SectionHeader
            num="03"
            title="Built for Two Worlds"
            isDark={isDark}
            subtitle="One unified platform providing purpose-built operational interfaces for everyday team members and senior security analysts."
          />

          <Grid container spacing={4}>
            {/* Experience 01: For Everyone */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: smoothEase }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    p: { xs: 4, sm: 6 },
                    height: '100%',
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3,
                    boxShadow: cardShadow,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: borderHover,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Chip
                      label="EXPERIENCE 01"
                      size="small"
                      sx={{
                        bgcolor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.1)',
                        color: '#22C55E',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        fontWeight: 800,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.72rem',
                      }}
                    />
                    <Visibility sx={{ color: '#22C55E', fontSize: 24 }} />
                  </Box>

                  <Typography
                    variant="h3"
                    sx={{
                      color: textPrimary,
                      fontSize: { xs: '1.8rem', md: '2.2rem' },
                      fontWeight: 900,
                      mb: 2,
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    For Everyone
                  </Typography>

                  <Typography
                    sx={{
                      color: textSecondary,
                      fontSize: '1.05rem',
                      lineHeight: 1.75,
                      mb: 4,
                    }}
                  >
                    A simplified security experience that presents security health through an understandable KAVACH Security Score (0–100) and plain-language explanations.
                  </Typography>

                  {/* Highlights */}
                  <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                    {[
                      'KAVACH Security Score (0–100) indicator',
                      'Plain-language risk explanations without confusing jargon',
                      'Actionable one-click recommendations for end-users',
                      'Zero impact background daemon with calm posture reporting',
                    ].map((feature, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckCircle sx={{ color: '#22C55E', fontSize: 18, flexShrink: 0 }} />
                        <Typography sx={{ color: textSecondary, fontSize: '0.92rem' }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </motion.div>
            </Grid>

            {/* Experience 02: For Security Analysts */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: smoothEase }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    p: { xs: 4, sm: 6 },
                    height: '100%',
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3,
                    boxShadow: cardShadow,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: borderHover,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Chip
                      label="EXPERIENCE 02"
                      size="small"
                      sx={{
                        bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                        color: CR,
                        border: `1px solid rgba(220, 38, 38, 0.25)`,
                        fontWeight: 800,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.72rem',
                      }}
                    />
                    <Terminal sx={{ color: CR, fontSize: 24 }} />
                  </Box>

                  <Typography
                    variant="h3"
                    sx={{
                      color: textPrimary,
                      fontSize: { xs: '1.8rem', md: '2.2rem' },
                      fontWeight: 900,
                      mb: 2,
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    For Security Analysts
                  </Typography>

                  <Typography
                    sx={{
                      color: textSecondary,
                      fontSize: '1.05rem',
                      lineHeight: 1.75,
                      mb: 4,
                    }}
                  >
                    A deeper SOC-oriented environment providing telemetry, alerts, incidents, behavioral anomalies, threat intelligence, investigation context, and response capabilities.
                  </Typography>

                  {/* Highlights */}
                  <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                    {[
                      '16 real-time low-level OS telemetry collector streams',
                      'MITRE ATT&CK Matrix mapping with TTP correlation',
                      'IsolationForest ML anomaly vectors & behavioral baseline',
                      'SOAR playbooks: Host isolation, domain block, process termination',
                    ].map((feature, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckCircle sx={{ color: CR, fontSize: 18, flexShrink: 0 }} />
                        <Typography sx={{ color: textSecondary, fontSize: '0.92rem' }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: border }} />

        {/* ─── 04 SECURITY ARCHITECTURE ─── */}
        <Box sx={{ py: { xs: 8, md: 14 } }}>
          <SectionHeader
            num="04"
            title="Security Architecture"
            isDark={isDark}
            subtitle="The three pillars of KAVACH's defense: In-depth telemetry, advanced detection & correlation, and automated SOAR response."
          />

          <Grid container spacing={4}>
            {/* Pillar 1: Telemetry Collection */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.1, ease: smoothEase }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    p: 4,
                    height: '100%',
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3,
                    boxShadow: cardShadow,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Sensors sx={{ color: CR, fontSize: 24 }} />
                    <Typography sx={{ color: textPrimary, fontWeight: 900, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                      Telemetry Collection
                    </Typography>
                  </Box>
                  <Typography sx={{ color: textMuted, fontSize: '0.85rem', mb: 3, fontFamily: 'JetBrains Mono, monospace' }}>
                    16 ACTIVE COLLECTORS
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {[
                      'Process activity', 'Network activity', 'File Integrity Monitoring',
                      'Authentication events', 'PowerShell activity', 'Sysmon',
                      'Windows Event Logs', 'DNS activity', 'Registry changes',
                      'USB devices', 'Windows Defender', 'Scheduled Tasks',
                      'Software inventory', 'System telemetry', 'Canary/Honeypot events',
                      'Windows services'
                    ].map((item, i) => (
                      <Chip
                        key={i}
                        label={item}
                        size="small"
                        sx={{
                          bgcolor: elevatedBg,
                          color: textSecondary,
                          border: `1px solid ${border}`,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          '&:hover': {
                            color: textPrimary,
                            borderColor: borderHover,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            {/* Pillar 2: Detection & Intelligence */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.2, ease: smoothEase }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    p: 4,
                    height: '100%',
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3,
                    boxShadow: cardShadow,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Psychology sx={{ color: '#3B82F6', fontSize: 24 }} />
                    <Typography sx={{ color: textPrimary, fontWeight: 900, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                      Detection & Intelligence
                    </Typography>
                  </Box>
                  <Typography sx={{ color: textMuted, fontSize: '0.85rem', mb: 3, fontFamily: 'JetBrains Mono, monospace' }}>
                    DUAL ENGINE ANALYTICS
                  </Typography>

                  <Stack spacing={1.8}>
                    {[
                      { title: 'Rule-based detection', desc: 'Deterministic signatures mapped to attacker tradecraft' },
                      { title: 'MITRE ATT&CK mapping', desc: 'Real-time TTP identification across the kill-chain' },
                      { title: 'ML anomaly detection', desc: 'IsolationForest profiling 10 behavioral dimensions' },
                      { title: 'Threat intelligence & IOCs', desc: 'Live reputation scoring across IPs, domains, hashes' },
                      { title: 'Behavioral baselines', desc: 'Calculates normative endpoint behavior deviations' },
                      { title: 'Incident correlation', desc: 'Assembles disparate alerts into coherent attack chains' },
                      { title: 'Dynamic risk scoring', desc: 'Continuous 0–100 posture calculation' },
                    ].map((item, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B82F6', mt: 1, flexShrink: 0 }} />
                        <Box>
                          <Typography sx={{ color: textPrimary, fontSize: '0.9rem', fontWeight: 700 }}>
                            {item.title}
                          </Typography>
                          <Typography sx={{ color: textSecondary, fontSize: '0.8rem' }}>
                            {item.desc}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </motion.div>
            </Grid>

            {/* Pillar 3: Automated Response */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.3, ease: smoothEase }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    p: 4,
                    height: '100%',
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3,
                    boxShadow: cardShadow,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Bolt sx={{ color: '#EAB308', fontSize: 24 }} />
                    <Typography sx={{ color: textPrimary, fontWeight: 900, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                      Automated Response
                    </Typography>
                  </Box>
                  <Typography sx={{ color: textMuted, fontSize: '0.85rem', mb: 3, fontFamily: 'JetBrains Mono, monospace' }}>
                    SOAR CONTAINMENT PLAYBOOKS
                  </Typography>

                  <Stack spacing={2.5}>
                    {[
                      {
                        action: 'Device Isolation',
                        desc: 'Immediately severs all network connections except encrypted telemetry channel to prevent lateral movement.',
                        icon: <Lock sx={{ fontSize: 18, color: CR }} />,
                      },
                      {
                        action: 'Domain & IP Blocking',
                        desc: 'Dynamically pushes firewall and hosts rules to null-route adversary C2 infrastructure.',
                        icon: <Dns sx={{ fontSize: 18, color: '#3B82F6' }} />,
                      },
                      {
                        action: 'Process Termination',
                        desc: 'Forces immediate SIGKILL termination of offending process trees, unhooks DLLs, and cleans execution handles.',
                        icon: <Speed sx={{ fontSize: 18, color: '#EAB308' }} />,
                      },
                      {
                        action: 'Evidence Collection',
                        desc: 'Generates atomic forensic bundle containing volatile memory dumps, socket states, and loaded module manifests.',
                        icon: <Storage sx={{ fontSize: 18, color: '#22C55E' }} />,
                      },
                    ].map((playbook, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 2,
                          bgcolor: elevatedBg,
                          borderRadius: 2,
                          border: `1px solid ${border}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
                          {playbook.icon}
                          <Typography sx={{ color: textPrimary, fontWeight: 800, fontSize: '0.92rem' }}>
                            {playbook.action}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: textSecondary, fontSize: '0.82rem', lineHeight: 1.5 }}>
                          {playbook.desc}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: border }} />

        {/* ─── 05 RAKSHA AI & SECURITY BY DESIGN ─── */}
        <Box sx={{ py: { xs: 8, md: 14 } }}>
          <Grid container spacing={6}>
            {/* Left: Raksha AI */}
            <Grid item xs={12} md={6}>
              <SectionHeader
                num="05"
                title="Raksha AI Copilot"
                isDark={isDark}
                subtitle="Your embedded artificial intelligence copilot engineered specifically for cybersecurity investigations."
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: smoothEase }}
              >
                <Box
                  sx={{
                    p: { xs: 4, sm: 5 },
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3,
                    boxShadow: cardShadow,
                    mb: 4,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <SmartToy sx={{ color: CR, fontSize: 28 }} />
                    <Typography
                      sx={{
                        color: textPrimary,
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      Natural Language Security
                    </Typography>
                  </Box>

                  <Typography sx={{ color: textSecondary, mb: 4, lineHeight: 1.75, fontSize: '1rem' }}>
                    Raksha AI is an embedded intelligence module designed to help users interact with security information using natural language. It assists with alert explanations, incident context, threat summaries, and investigation steps.
                  </Typography>

                  {/* Terminal Simulation Preview */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: isDark ? '#050508' : '#0B0F19',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontFamily: 'JetBrains Mono, monospace',
                      mb: 4,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', ml: 1 }}>
                        RAKSHA-AI // INTERACTIVE SESSION
                      </Typography>
                    </Box>

                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', mb: 1.5 }}>
                      <Box component="span" sx={{ color: '#3B82F6' }}>user@kavach:~$</Box> "Explain alert EVT-4091 on Host WS-0492"
                    </Typography>

                    <Box sx={{ pl: 2, borderLeft: '2px solid #22C55E' }}>
                      <Typography sx={{ color: '#22C55E', fontSize: '0.78rem', fontWeight: 700, mb: 0.5 }}>
                        [RAKSHA AI ANALYSIS]
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        Base64 encoded PowerShell command detected matching MITRE ATT&CK T1059.001. Process spawned via wscript.exe attempting socket connection to flagged external IP. Confidence: 98.4%. Recommended Action: Execute Host Isolation playbook.
                      </Typography>
                    </Box>
                  </Box>

                  {/* Principle Quote Callout */}
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.05)',
                      borderLeft: `3px solid ${CR}`,
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <Typography
                      sx={{
                        color: isDark ? '#FCA5A5' : '#B91C1C',
                        fontWeight: 700,
                        fontStyle: 'italic',
                        fontSize: '0.98rem',
                        lineHeight: 1.6,
                      }}
                    >
                      "AI assists security operations—it does not replace security telemetry or become the source of truth."
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            {/* Right: Security by Design */}
            <Grid item xs={12} md={6}>
              <SectionHeader
                num="06"
                title="Security by Design"
                isDark={isDark}
                subtitle="The 8 architectural guardrails protecting the KAVACH platform and safeguarding customer data."
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: smoothEase }}
              >
                <Box
                  sx={{
                    p: { xs: 4, sm: 5 },
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 3,
                    boxShadow: cardShadow,
                  }}
                >
                  <Typography
                    sx={{
                      color: textSecondary,
                      mb: 4,
                      lineHeight: 1.7,
                      fontSize: '1rem',
                    }}
                  >
                    KAVACH is built with a highly conscious architectural design to protect the security platform itself against compromise, model poisoning, and data leakage.
                  </Typography>

                  <Grid container spacing={2}>
                    {[
                      { name: 'Context sanitization for AI', desc: 'Redacts PII and tokens before LLM inference' },
                      { name: 'Protection of sensitive info', desc: 'Envelope encryption for all stored credentials' },
                      { name: 'SSRF protections', desc: 'Blocks metadata endpoints and intranet loopbacks' },
                      { name: 'Private-network restrictions', desc: 'Limits agent callbacks to authorized gateways' },
                      { name: 'Cloud metadata protection', desc: 'Hardened against 169.254.169.254 probing' },
                      { name: 'Role-based access control', desc: 'Granular permissions for users and analysts' },
                      { name: 'Authentication controls', desc: 'MFA session tokens and brute-force throttling' },
                      { name: 'Secure API communication', desc: 'Mutual TLS and strict signature validation' },
                    ].map((item, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: elevatedBg,
                            borderRadius: 2,
                            border: `1px solid ${border}`,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#22C55E',
                              bgcolor: isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.03)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E', flexShrink: 0 }} />
                            <Typography sx={{ color: textPrimary, fontSize: '0.85rem', fontWeight: 700 }}>
                              {item.name}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: textMuted, fontSize: '0.75rem', lineHeight: 1.4 }}>
                            {item.desc}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: border }} />

        {/* ─── 07 PLATFORMS & TECH ECOSYSTEM ─── */}
        <Box sx={{ py: { xs: 8, md: 14 } }}>
          <Grid container spacing={6}>
            {/* Left: Multi-Platform */}
            <Grid item xs={12} md={6}>
              <SectionHeader
                num="07"
                title="Multi-Platform Support"
                isDark={isDark}
                subtitle="Consistent protection across endpoints, cloud consoles, browsers, and mobile devices."
              />

              <Stack spacing={2.5}>
                {[
                  {
                    icon: <Computer sx={{ fontSize: 26, color: CR }} />,
                    title: 'Desktop Agent',
                    platform: 'Windows / Linux',
                    desc: 'Full-access security environment for continuous low-level kernel and user-space monitoring.',
                  },
                  {
                    icon: <Language sx={{ fontSize: 26, color: '#3B82F6' }} />,
                    title: 'Web Console',
                    platform: 'Cloud & On-Premises',
                    desc: 'Centralized security dashboard for telemetry analysis, live incident response, and SOC triage.',
                  },
                  {
                    icon: <PhoneIphone sx={{ fontSize: 26, color: '#22C55E' }} />,
                    title: 'Mobile Companion',
                    platform: 'iOS & Android (Flutter)',
                    desc: 'Lightweight experience for executive posture monitoring and urgent push incident notifications.',
                  },
                  {
                    icon: <Extension sx={{ fontSize: 26, color: '#EAB308' }} />,
                    title: 'Browser Extension',
                    platform: 'Chrome / Edge / Firefox',
                    desc: 'Manifest V3 extension for real-time URL inspection, credential theft alerts, and phishing protection.',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 6, transition: { duration: 0.2 } }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        bgcolor: cardBg,
                        border: `1px solid ${border}`,
                        borderRadius: 2.5,
                        boxShadow: cardShadow,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: elevatedBg,
                          border: `1px solid ${border}`,
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.3 }}>
                          <Typography sx={{ color: textPrimary, fontWeight: 800, fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif' }}>
                            {item.title}
                          </Typography>
                          <Chip
                            label={item.platform}
                            size="small"
                            sx={{
                              fontSize: '0.68rem',
                              fontFamily: 'JetBrains Mono, monospace',
                              bgcolor: elevatedBg,
                              color: textMuted,
                              border: `1px solid ${border}`,
                            }}
                          />
                        </Box>
                        <Typography sx={{ color: textSecondary, fontSize: '0.88rem', lineHeight: 1.5 }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Stack>
            </Grid>

            {/* Right: Technology Stack */}
            <Grid item xs={12} md={6}>
              <SectionHeader
                num="08"
                title="Technology Stack"
                isDark={isDark}
                subtitle="Engineered with modern, battle-tested programming languages, ML models, and high-performance protocols."
              />

              <Box
                sx={{
                  p: { xs: 4, sm: 5 },
                  bgcolor: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 3,
                  boxShadow: cardShadow,
                }}
              >
                <Typography sx={{ color: textSecondary, mb: 3.5, fontSize: '0.98rem', lineHeight: 1.6 }}>
                  Every component in KAVACH is chosen for maximum speed, strict determinism, and minimal computational overhead on monitored hosts.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                  {[
                    { name: 'Python + FastAPI', cat: 'High-Throughput Backend' },
                    { name: 'React + Vite', cat: 'Modern Frontend SPA' },
                    { name: 'Material UI', cat: 'Component Design' },
                    { name: 'Three.js + Chart.js', cat: 'Visualizations' },
                    { name: 'Isolation Forest (ML)', cat: 'Anomaly Detection' },
                    { name: 'NVIDIA NIM / Llama AI', cat: 'Raksha Intelligence' },
                    { name: 'SQLite / PostgreSQL', cat: 'Telemetry Persistence' },
                    { name: 'WebSockets', cat: 'Real-time Event Streaming' },
                    { name: 'MITRE ATT&CK', cat: 'Framework Standard' },
                    { name: 'Flutter', cat: 'Cross-Platform Mobile' },
                    { name: 'Manifest V3', cat: 'Browser Extension' },
                  ].map((tech, i) => (
                    <Tooltip title={tech.cat} key={i} arrow>
                      <Chip
                        label={tech.name}
                        sx={{
                          bgcolor: elevatedBg,
                          color: textPrimary,
                          border: `1px solid ${border}`,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          py: 2.2,
                          px: 1,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)',
                            borderColor: CR,
                            color: isDark ? '#FFFFFF' : CR,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: border }} />

        {/* ─── 09 ORIGIN / BUILT BY SWASTIK CHEMICAL ─── */}
        <Box sx={{ py: { xs: 10, md: 16 } }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: smoothEase }}
          >
            <Box
              sx={{
                p: { xs: 5, sm: 8, md: 10 },
                bgcolor: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 4,
                boxShadow: cardShadow,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle crimson gradient streak */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  background: `linear-gradient(90deg, transparent 0%, ${CR} 50%, transparent 100%)`,
                }}
              />

              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CR }} />
                <Typography
                  sx={{
                    color: CR,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    letterSpacing: '0.15em',
                  }}
                >
                  09 — ORIGIN & PROVENANCE
                </Typography>
              </Box>

              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontSize: { xs: '2.2rem', sm: '3rem', md: '3.8rem' },
                  color: textPrimary,
                  lineHeight: 1.12,
                  letterSpacing: '-0.025em',
                  mb: 3,
                }}
              >
                Built by Swastik Chemical (India)
              </Typography>

              <Typography
                sx={{
                  color: textSecondary,
                  fontSize: { xs: '1.05rem', sm: '1.2rem' },
                  lineHeight: 1.8,
                  maxWidth: 780,
                  mx: 'auto',
                  mb: 6,
                }}
              >
                KAVACH is an enterprise cybersecurity platform engineered and developed by Swastik Chemical (India). Built to unite high-performance endpoint telemetry, automated SOAR playbooks, and artificial intelligence, KAVACH represents our commitment to making modern sovereign security infrastructure robust, intelligent, and accessible.
              </Typography>

              {/* Core Motto */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 3 },
                  px: { xs: 2.5, sm: 4 },
                  py: 1.5,
                  borderRadius: 999,
                  bgcolor: elevatedBg,
                  border: `1px solid ${border}`,
                  mb: 6,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {['DETECT', 'UNDERSTAND', 'RESPOND', 'PROTECT'].map((pillar, i, arr) => (
                  <React.Fragment key={pillar}>
                    <Typography
                      sx={{
                        color: textPrimary,
                        fontWeight: 900,
                        fontSize: { xs: '0.8rem', sm: '0.95rem' },
                        fontFamily: 'Outfit, sans-serif',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {pillar}
                    </Typography>
                    {i < arr.length - 1 && (
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: CR }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>

              {/* Call to action buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: CR,
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1rem',
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.4)',
                    '&:hover': {
                      bgcolor: '#B91C1C',
                      boxShadow: '0 12px 28px -4px rgba(220, 38, 38, 0.6)',
                    },
                  }}
                >
                  Launch KAVACH Console
                </Button>
                <Button
                  component="a"
                  href="https://swastikchemindia.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="large"
                  endIcon={<OpenInNew sx={{ fontSize: 18 }} />}
                  sx={{
                    color: textPrimary,
                    borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.3)',
                    fontWeight: 700,
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1rem',
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.04)',
                    '&:hover': {
                      borderColor: CR,
                      bgcolor: isDark ? 'rgba(220, 38, 38, 0.16)' : 'rgba(220, 38, 38, 0.08)',
                      color: isDark ? '#FFFFFF' : CR,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Visit Swastik Chemical (India)
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/features')}
                  sx={{
                    color: textPrimary,
                    borderColor: border,
                    fontWeight: 700,
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1rem',
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: elevatedBg,
                    '&:hover': {
                      borderColor: textPrimary,
                      bgcolor: elevatedBg,
                    },
                  }}
                >
                  Explore Protection Features
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Box>

      </Container>
    </Box>
  );
};
