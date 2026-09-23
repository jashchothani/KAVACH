import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, Stack, Accordion, AccordionSummary, AccordionDetails,
  Paper, LinearProgress, Divider
} from '@mui/material';
import {
  Shield, RocketLaunch, ExpandMore, CheckCircle,
  PlayArrow, Memory, PrecisionManufacturing,
  AutoAwesome, Lock, ArrowForward,
  Laptop, PhoneIphone, Cloud, VerifiedUser,
  Speed, Refresh, Security, Check, Psychology
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductShowcaseSection } from '../../components/common/ProductShowcaseSection';

interface AttackScenario {
  id: string;
  name: string;
  category: string;
  plainSummary: string;
  steps: {
    title: string;
    desc: string;
    time: string;
  }[];
}

const SCENARIOS: AttackScenario[] = [
  {
    id: 'ransomware',
    name: '1. Ransomware Attempt',
    category: 'Endpoint Protection',
    plainSummary: 'A suspicious program tries to silently encrypt user documents and demand a ransom.',
    steps: [
      { title: 'Suspicious Behavior Detected', desc: 'KAVACH AI notices a rogue process trying to delete backup files and modify system files.', time: '0.8ms' },
      { title: 'Device Isolated Automatically', desc: 'KAVACH instantly isolates the network connection so the infection cannot spread.', time: '4.2ms' },
      { title: 'Ransomware Process Terminated', desc: 'The rogue executable is forcibly shut down and moved into quarantine.', time: '8.1ms' },
      { title: 'Threat Deflected & Verified', desc: 'Attack completely halted in 11.8 milliseconds. Zero files were altered.', time: '11.8ms' },
    ],
  },
  {
    id: 'deepfake',
    name: '2. Fake Voice Call / Phishing',
    category: 'Communication Shield',
    plainSummary: 'An attacker uses an AI-cloned executive voice attempting to authorize an emergency transfer.',
    steps: [
      { title: 'Inbound Audio Inspected', desc: 'KAVACH monitors real-time audio frequencies for synthetic speech artifacts.', time: '1.2ms' },
      { title: 'Synthetic Voice Confirmed', desc: 'Acoustic biometrics confirm an AI clone with 99.8% confidence.', time: '5.6ms' },
      { title: 'Call Flagged & Blocked', desc: 'The fake call is dropped and an alert is delivered to the user with plain explanations.', time: '8.4ms' },
      { title: 'Fleet Blacklist Updated', desc: 'The scam signature is instantly blocked across all protected employee devices.', time: '11.2ms' },
    ],
  },
  {
    id: 'scada',
    name: '3. Plant Safety Valve Tampering',
    category: 'Industrial OT Defense',
    plainSummary: 'A rogue device on a factory network attempts to tamper with emergency safety pressure valves.',
    steps: [
      { title: 'Industrial Packet Inspected', desc: 'KAVACH monitors Modbus TCP frames across the plant network at wire speed.', time: '0.6ms' },
      { title: 'Unauthorized Command Caught', desc: 'The system recognizes emergency valve register 0x1FA0 is locked by safety rules.', time: '3.9ms' },
      { title: 'Malicious Command Dropped', desc: 'The packet is neutralized before reaching physical plant machinery.', time: '7.8ms' },
      { title: 'Operations Safely Maintained', desc: 'Chemical production continues uninterrupted with full hardware safety verified.', time: '11.5ms' },
    ],
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  // Hero interactive visual simulation state
  const [simulating, setSimulating] = useState(false);
  const [deflectedCount, setDeflectedCount] = useState(1429);
  const [shieldState, setShieldState] = useState<'normal' | 'deflecting'>('normal');

  const triggerHeroDeflection = () => {
    if (simulating) return;
    setSimulating(true);
    setShieldState('deflecting');
    setTimeout(() => {
      setDeflectedCount((c) => c + 1);
      setShieldState('normal');
      setSimulating(false);
    }, 1800);
  };

  // Scenario Simulator State
  const [activeScenario, setActiveScenario] = useState<AttackScenario>(SCENARIOS[0]);
  const [simStep, setSimStep] = useState(0);

  return (
    <Box sx={{ width: '100%', bgcolor: '#FFFFFF', color: '#0F172A', overflowX: 'hidden' }}>
      {/* =========================================================================
          HERO SECTION (Apple-level Clean Light SaaS Aesthetic)
          ========================================================================= */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          background: 'linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 60%, #F8FAFC 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Soft Ambient Radial Accents */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '10%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '-5%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 6, lg: 8 }} alignItems="center">
            {/* Left Column: Headline, Value Proposition, Action Buttons */}
            <Grid item xs={12} lg={6.5}>
              <Box>
                {/* Top Badge */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.6,
                    borderRadius: 50,
                    bgcolor: '#FFFFFF',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    boxShadow: '0 2px 10px rgba(220, 38, 38, 0.06)',
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#DC2626',
                      boxShadow: '0 0 8px #DC2626',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: '#DC2626',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    AI-Powered Digital Defense • Sub-12ms Response
                  </Typography>
                </Box>

                {/* Primary Headline */}
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 900,
                    fontSize: { xs: '2.6rem', sm: '3.6rem', md: '4.2rem' },
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    color: '#0F172A',
                    mb: 2.5,
                  }}
                >
                  Your Digital Protection,{' '}
                  <span style={{ color: '#DC2626' }}>Made Simple.</span>
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    fontSize: { xs: '1.05rem', md: '1.2rem' },
                    lineHeight: 1.65,
                    color: '#475569',
                    mb: 4.5,
                    maxWidth: 620,
                  }}
                >
                  KAVACH continuously defends your computers, network, and communications from ransomware,
                  phishing, and intrusive zero-day threats — giving you complete peace of mind with autonomous AI deflection.
                </Typography>

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4.5}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/login')}
                    sx={{
                      bgcolor: '#DC2626',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '1rem',
                      px: 3.8,
                      py: 1.6,
                      borderRadius: 2.5,
                      boxShadow: '0 8px 25px rgba(220, 38, 38, 0.35)',
                      '&:hover': {
                        bgcolor: '#B91C1C',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease',
                      textTransform: 'none',
                    }}
                  >
                    Get Started Free
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={() => {
                      const el = document.getElementById('product-showcase');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    sx={{
                      borderColor: '#CBD5E1',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      px: 3.2,
                      py: 1.6,
                      borderRadius: 2.5,
                      bgcolor: '#FFFFFF',
                      '&:hover': {
                        borderColor: '#DC2626',
                        color: '#DC2626',
                        bgcolor: 'rgba(220, 38, 38, 0.04)',
                      },
                      textTransform: 'none',
                    }}
                  >
                    Explore Platform
                  </Button>

                  <Button
                    variant="text"
                    size="large"
                    startIcon={<Lock />}
                    onClick={() => navigate('/login')}
                    sx={{
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      px: 2.5,
                      py: 1.6,
                      borderRadius: 2.5,
                      '&:hover': { color: '#0F172A', bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      textTransform: 'none',
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>

                {/* Trust Checklist */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 3 }}>
                  {[
                    'Instant Sub-12ms AI Response',
                    'Zero System Slowdown',
                    'Swastik Chemical Enterprise Backed',
                  ].map((text, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 18, color: '#16A34A' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                        {text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>

            {/* Right Column: Clean Light-Themed SaaS Interactive Product Card */}
            <Grid item xs={12} lg={5.5}>
              <Box sx={{ position: 'relative', width: '100%', maxWidth: 580, mx: 'auto' }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 4.5,
                    p: { xs: 3, sm: 4 },
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Status Bar */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1.2}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: '#16A34A',
                          boxShadow: '0 0 8px rgba(22, 163, 74, 0.6)',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: 0.5 }}>
                        ACTIVE SENTINEL SHIELD • 100% SECURE
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={triggerHeroDeflection}
                      disabled={simulating}
                      startIcon={<PlayArrow sx={{ fontSize: 14 }} />}
                      sx={{
                        borderColor: '#DC2626',
                        color: '#DC2626',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 1.5,
                        '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.06)' },
                      }}
                    >
                      {simulating ? 'Deflecting...' : 'Simulate Deflection'}
                    </Button>
                  </Box>

                  {/* Central Shield Graphic with Official Logo */}
                  <Box
                    sx={{
                      position: 'relative',
                      textAlign: 'center',
                      py: 4,
                      my: 2,
                      borderRadius: 3.5,
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Animated deflection pulse wave */}
                    <AnimatePresence>
                      {shieldState === 'deflecting' && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 1 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: 120,
                            height: 120,
                            marginTop: -60,
                            marginLeft: -60,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, transparent 70%)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <Box
                      component="img"
                      src="/kavach-logo-transparent.png"
                      alt="KAVACH Shield"
                      onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
                      sx={{
                        height: 96,
                        width: 'auto',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 8px 20px rgba(220, 38, 38, 0.2))',
                        transition: 'transform 0.3s ease',
                        transform: shieldState === 'deflecting' ? 'scale(1.08)' : 'scale(1)',
                      }}
                    />

                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 900,
                        color: '#0F172A',
                        mt: 1.5,
                      }}
                    >
                      Continuous Kernel Protection Active
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Sub-1% CPU Overhead • Autonomous Threat Interception
                    </Typography>
                  </Box>

                  {/* Connected Fleet Strip */}
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 1 }}>
                    PROTECTED FLEET ENDPOINTS:
                  </Typography>
                  <Grid container spacing={1.5} mb={2.5}>
                    {[
                      { name: 'Workstation Host', status: 'Active • Monitored', icon: <Laptop sx={{ fontSize: 18, color: '#0284C7' }} /> },
                      { name: 'Executive Phone', status: 'Encrypted • Safe', icon: <PhoneIphone sx={{ fontSize: 18, color: '#16A34A' }} /> },
                      { name: 'Cloud Gateway', status: 'Firewall Active', icon: <Cloud sx={{ fontSize: 18, color: '#7C3AED' }} /> },
                    ].map((d, i) => (
                      <Grid item xs={4} key={i}>
                        <Box
                          sx={{
                            p: 1.2,
                            borderRadius: 2.5,
                            bgcolor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            textAlign: 'center',
                          }}
                        >
                          <Box mb={0.3}>{d.icon}</Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A', display: 'block', fontSize: '0.72rem' }}>
                            {d.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600, fontSize: '0.65rem' }}>
                            {d.status}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Telemetry Footer Bar */}
                  <Divider sx={{ mb: 2 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Threats Deflected Today:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#DC2626' }}>
                        {deflectedCount.toLocaleString()} Neutralized
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Mean Response Time:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        &lt; 11.8ms
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          SECTION 2: 3-COLUMN VALUE PILLARS (Directly like Reference Image 2 - WBuilder)
          ========================================================================= */}
      <Container maxWidth="xl" sx={{ py: 12 }}>
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '2.8rem' },
              color: '#0F172A',
              mb: 1.5,
            }}
          >
            A simple, proven way to safeguard your digital world.
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '1.05rem', maxWidth: 650, mx: 'auto' }}>
            Engineered for everyday employees, families, and businesses without cybersecurity background.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            {
              icon: <Shield sx={{ fontSize: 36, color: '#DC2626' }} />,
              title: 'Autonomous Defense',
              desc: 'Continuous kernel-level protection that stops ransomware, malware, and intrusions in under 12 milliseconds without waiting for human approval.',
            },
            {
              icon: <AutoAwesome sx={{ fontSize: 36, color: '#0284C7' }} />,
              title: 'Plain-English Clarity',
              desc: 'No confusing security jargon or cryptic terminal logs. Every notification tells you exactly what was stopped, why, and gives you simple 1-click actions.',
            },
            {
              icon: <PrecisionManufacturing sx={{ fontSize: 36, color: '#16A34A' }} />,
              title: 'Industrial Heritage',
              desc: 'Originating from the mission-critical manufacturing standards of Swastik Chemical (India). Built for absolute zero-failure dependability.',
            },
          ].map((pillar, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 4.5,
                  height: '100%',
                  borderRadius: 4,
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
                <Box sx={{ mb: 2.5 }}>{pillar.icon}</Box>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0F172A', mb: 1.5 }}>
                  {pillar.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.65, fontSize: '0.95rem' }}>
                  {pillar.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* =========================================================================
          SECTION 3: INTERACTIVE PLATFORM SHOWCASE (5 Interfaces)
          ========================================================================= */}
      <Box id="product-showcase" sx={{ py: 11, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="xl">
          <ProductShowcaseSection />
        </Container>
      </Box>

      {/* =========================================================================
          SECTION 4: 3 SIMPLE STEPS TO TOTAL PEACE OF MIND
          ========================================================================= */}
      <Container maxWidth="xl" sx={{ py: 12 }}>
        <Box textAlign="center" mb={8}>
          <Chip
            label="HOW IT WORKS"
            size="small"
            sx={{
              bgcolor: 'rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              fontWeight: 800,
              mb: 1.5,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '2.8rem' },
              color: '#0F172A',
              mb: 1.5,
            }}
          >
            Protection in 3 Simple Steps
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '1.05rem', maxWidth: 650, mx: 'auto' }}>
            No complicated setup. No cybersecurity team required.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            {
              step: '01',
              title: 'Sign In via Email OTP',
              desc: 'Enter your email or username. Receive a secure 6-digit one-time code via Resend and you are in.',
            },
            {
              step: '02',
              title: 'KAVACH Guards In Background',
              desc: 'Autonomous kernel sensors run silently with sub-1% CPU usage. Zero device lag, zero intrusive popups.',
            },
            {
              step: '03',
              title: 'Complete Peace of Mind',
              desc: 'Threats, phishing URLs, and malware are neutralized before they touch your files or private data.',
            },
          ].map((item, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 4.5,
                  height: '100%',
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '2.2rem',
                    fontWeight: 900,
                    color: 'rgba(220, 38, 38, 0.15)',
                    fontFamily: 'Outfit, sans-serif',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  {item.step}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0F172A', mb: 1.5 }}>
                  {item.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.65 }}>
                  {item.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* =========================================================================
          SECTION 5: LIVE DEFENSE SIMULATOR
          ========================================================================= */}
      <Box sx={{ py: 11, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={6}>
            <Chip
              label="INTERACTIVE DEFENSE DEMO"
              size="small"
              sx={{ bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', fontWeight: 800, mb: 1.5 }}
            />
            <Typography
              variant="h2"
              sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: { xs: '2rem', md: '2.8rem' }, color: '#0F172A', mb: 1.5 }}
            >
              See Threat Neutralization in Action
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '1rem', maxWidth: 650, mx: 'auto' }}>
              Select a cyber attack scenario to witness how KAVACH deflects threats automatically.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center" mb={5} flexWrap="wrap">
            {SCENARIOS.map((sc) => (
              <Button
                key={sc.id}
                variant={activeScenario.id === sc.id ? 'contained' : 'outlined'}
                onClick={() => { setActiveScenario(sc); setSimStep(0); }}
                sx={{
                  py: 1.2,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  bgcolor: activeScenario.id === sc.id ? '#DC2626' : '#FFFFFF',
                  color: activeScenario.id === sc.id ? '#FFFFFF' : '#334155',
                  borderColor: activeScenario.id === sc.id ? '#DC2626' : '#CBD5E1',
                  '&:hover': {
                    bgcolor: activeScenario.id === sc.id ? '#B91C1C' : '#F8FAFC',
                  },
                }}
              >
                {sc.name}
              </Button>
            ))}
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3.5, md: 5 },
              borderRadius: 4.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              maxWidth: 960,
              mx: 'auto',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Chip label={activeScenario.category} size="small" sx={{ bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontWeight: 700 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#DC2626' }}>
                Time: {activeScenario.steps[simStep].time}
              </Typography>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              {activeScenario.steps[simStep].title}
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.6, mb: 3 }}>
              {activeScenario.steps[simStep].desc}
            </Typography>

            {/* Step indicators */}
            <Grid container spacing={1.5} mb={3}>
              {activeScenario.steps.map((st, i) => (
                <Grid item xs={3} key={i}>
                  <Box
                    onClick={() => setSimStep(i)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: i === simStep ? '#DC2626' : '#FFFFFF',
                      color: i === simStep ? '#FFFFFF' : '#475569',
                      border: '1px solid',
                      borderColor: i === simStep ? '#DC2626' : '#E2E8F0',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                      Step {i + 1}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Button
              variant="contained"
              onClick={() => setSimStep((prev) => (prev + 1) % activeScenario.steps.length)}
              sx={{
                bgcolor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                borderRadius: 2.5,
                '&:hover': { bgcolor: '#B91C1C' },
              }}
            >
              Next Step →
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* =========================================================================
          SECTION 6: SWASTIK CHEMICAL (INDIA) ENTERPRISE ASSURANCE
          ========================================================================= */}
      <Container maxWidth="xl" sx={{ py: 12 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 7 },
            borderRadius: 4.5,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.04)',
          }}
        >
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.6,
                  borderRadius: 50,
                  bgcolor: 'rgba(220, 38, 38, 0.08)',
                  color: '#DC2626',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  mb: 2.5,
                }}
              >
                <PrecisionManufacturing sx={{ fontSize: 18 }} />
                INDUSTRIAL ENTERPRISE HERITAGE
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  color: '#0F172A',
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                Powered by Swastik Chemical (India)
              </Typography>

              <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7, mb: 3 }}>
                KAVACH was born from the rigorous operational security requirements of chemical and industrial
                manufacturing plants. Protecting physical SCADA valves, executive communication lines, and
                mission-critical databases requires absolute zero-failure reliability.
              </Typography>

              <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6, mb: 4 }}>
                Today, that same industrial-grade resilience is packaged into an effortless, modern cybersecurity
                product that any everyday employee, family, or business can deploy in under 60 seconds.
              </Typography>

              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#DC2626' }}>
                    100%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Operational Uptime
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>
                    Zero
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Ransomware Breaches
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#16A34A' }}>
                    24/7
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Autonomous Sentinel
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 4,
                  borderRadius: 3.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                }}
              >
                <Box
                  component="img"
                  src="/kavach-logo-transparent.png"
                  alt="KAVACH"
                  onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
                  sx={{
                    height: 84,
                    width: 'auto',
                    objectFit: 'contain',
                    mb: 2,
                    filter: 'drop-shadow(0 4px 12px rgba(220, 38, 38, 0.15))',
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                  Swastik Chemical Cyber Division
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                  Mumbai & Gujarat, India
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/about')}
                  sx={{
                    bgcolor: '#0F172A',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2.5,
                    '&:hover': { bgcolor: '#1E293B' },
                  }}
                >
                  Read Corporate Story
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* =========================================================================
          SECTION 7: PLAIN-ENGLISH FREQUENTLY ASKED QUESTIONS
          ========================================================================= */}
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h3"
            sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#0F172A', mb: 1.5 }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '1rem' }}>
            Everything you need to know about setting up and enjoying KAVACH.
          </Typography>
        </Box>

        <Stack spacing={2}>
          {[
            {
              q: 'Do I need cybersecurity experience to use KAVACH?',
              a: 'Not at all. KAVACH was specifically created so anyone can have enterprise-grade security. The dashboard explains every alert in plain English with clear, one-click action buttons.',
            },
            {
              q: 'Will KAVACH slow down my computer or gaming?',
              a: 'No. The KAVACH sensor runs at the low-level kernel layer, taking less than 1% of your CPU and under 50MB of RAM.',
            },
            {
              q: 'How does the Email OTP login work?',
              a: 'Enter your credentials, and KAVACH dispatches a secure 6-digit one-time code via Resend API directly to your inbox. Enter the code and you are in.',
            },
            {
              q: 'Can KAVACH protect my entire team or family?',
              a: 'Yes. KAVACH allows you to invite team members or connect multiple laptops, phones, and servers under a unified overview console.',
            },
          ].map((faq, idx) => (
            <Accordion
              key={idx}
              elevation={0}
              sx={{
                borderRadius: '12px !important',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#0F172A' }} />}>
                <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>
                  {faq.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: '#475569', lineHeight: 1.7, fontSize: '0.92rem' }}>
                  {faq.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>

      {/* =========================================================================
          SECTION 8: FINAL HIGH-IMPACT CALL TO ACTION
          ========================================================================= */}
      <Container maxWidth="xl" sx={{ pb: 14 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 5, md: 8 },
            borderRadius: 5,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 700, mx: 'auto' }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                mb: 2,
              }}
            >
              Ready for Real-Time Protection Without the Headache?
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', mb: 4, lineHeight: 1.6 }}>
              Join thousands of protected devices safeguarded by KAVACH’s autonomous AI deflection engine.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.6,
                  borderRadius: 2.5,
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.4)',
                  '&:hover': { bgcolor: '#B91C1C' },
                  textTransform: 'none',
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Lock />}
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  px: 3.5,
                  py: 1.6,
                  borderRadius: 2.5,
                  '&:hover': {
                    borderColor: '#FFFFFF',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                  },
                  textTransform: 'none',
                }}
              >
                Access KAVACH Portal
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
export default Home;
