import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, Stack, Accordion, AccordionSummary, AccordionDetails,
  Paper, LinearProgress, Divider
} from '@mui/material';
import {
  Shield, ExpandMore, CheckCircle,
  PlayArrow, Memory, PrecisionManufacturing,
  AutoAwesome, Lock, ArrowForward,
  VerifiedUser, Speed, Security
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

  const HERO_INK = '#0B0B0F';

  return (
    <Box sx={{ width: '100%', bgcolor: '#FFFFFF', color: '#0B0B0F', overflowX: 'hidden' }}>
      {/* =========================================================================
          HERO SECTION — Cinematic near-black, crimson-lit shield visual
          ========================================================================= */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 14, md: 16 },
          pb: { xs: 10, md: 12 },
          background: `radial-gradient(ellipse 80% 60% at 78% 8%, rgba(220,38,38,0.16) 0%, transparent 55%), linear-gradient(160deg, ${HERO_INK} 0%, #16161B 55%, #0B0B0F 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Ambient atmosphere */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5) 0, transparent 100%), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.35) 0, transparent 100%), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.3) 0, transparent 100%)',
        }} />
        <Box sx={{ position: 'absolute', bottom: -160, left: '10%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,38,38,0.10) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        <Container maxWidth="xl" sx={{ position: 'relative' }}>
          <Grid container spacing={{ xs: 8, lg: 6 }} alignItems="center">
            {/* Left Column: Headline, Value Proposition, Action Buttons */}
            <Grid item xs={12} lg={6.5}>
              <Box>
                {/* Top Badge */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.7,
                    borderRadius: 50,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(220, 38, 38, 0.35)',
                    backdropFilter: 'blur(6px)',
                    mb: 3.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: '#EF4444',
                      boxShadow: '0 0 10px #EF4444',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: '#F5D0D0',
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      fontSize: '0.72rem',
                    }}
                  >
                    AI-Powered Digital Defense • Sub-12ms Response
                  </Typography>
                </Box>

                {/* Primary Headline */}
                <Typography
                  component={motion.h1}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  variant="h1"
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 800,
                    fontSize: { xs: '2.7rem', sm: '3.8rem', md: '4.4rem' },
                    lineHeight: 1.06,
                    letterSpacing: '-0.035em',
                    color: '#FBFAF9',
                    mb: 3,
                  }}
                >
                  Security that{' '}
                  <Box component="span" sx={{ color: '#EF4444' }}>understands</Box>
                  {' '}what's happening.
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    fontSize: { xs: '1.02rem', md: '1.15rem' },
                    lineHeight: 1.65,
                    color: 'rgba(245,243,241,0.65)',
                    mb: 4.5,
                    maxWidth: 580,
                  }}
                >
                  KAVACH combines real-time threat detection, AI-powered insight, and autonomous
                  response to keep your devices, data, and people safe — effortlessly.
                </Typography>

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={5}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/login')}
                    sx={{
                      bgcolor: '#DC2626',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '1rem',
                      px: 3.8,
                      py: 1.55,
                      borderRadius: 2.5,
                      boxShadow: '0 12px 30px -8px rgba(220, 38, 38, 0.55)',
                      '&:hover': {
                        bgcolor: '#B91C1C',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 16px 36px -8px rgba(220, 38, 38, 0.6)',
                      },
                      transition: 'all 0.2s ease',
                      textTransform: 'none',
                    }}
                  >
                    Get Started
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
                      borderColor: 'rgba(255,255,255,0.22)',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      px: 3.2,
                      py: 1.55,
                      borderRadius: 2.5,
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        bgcolor: 'rgba(255,255,255,0.06)',
                      },
                      textTransform: 'none',
                    }}
                  >
                    Watch Demo
                  </Button>
                </Stack>

                {/* Trust Checklist */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 3 }} flexWrap="wrap">
                  {[
                    'Instant Sub-12ms AI Response',
                    'Zero System Slowdown',
                    'Enterprise Backed',
                  ].map((text, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1, sm: 0 } }}>
                      <CheckCircle sx={{ fontSize: 16, color: '#4ADE80' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(245,243,241,0.7)', fontSize: '0.83rem' }}>
                        {text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>

            {/* Right Column: Cinematic Shield Visual */}
            <Grid item xs={12} lg={5.5}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                sx={{ position: 'relative', width: '100%', maxWidth: 520, mx: 'auto', aspectRatio: '1 / 1' }}
              >
                {/* Orbiting rings */}
                {[0, 1, 2].map((r) => (
                  <Box
                    key={r}
                    component={motion.div}
                    animate={{ rotate: r % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 40 + r * 20, repeat: Infinity, ease: 'linear' }}
                    sx={{
                      position: 'absolute',
                      inset: `${r * 10}%`,
                      borderRadius: '50%',
                      border: `1px solid rgba(220,38,38,${0.22 - r * 0.05})`,
                      borderTopColor: `rgba(220,38,38,${0.55 - r * 0.1})`,
                    }}
                  />
                ))}

                {/* Glow behind shield */}
                <Box sx={{
                  position: 'absolute', inset: '18%', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(220,38,38,0.35) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }} />

                {/* Central shield */}
                <Box
                  onClick={triggerHeroDeflection}
                  sx={{
                    position: 'absolute', inset: '26%', borderRadius: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(155deg, #1C1C22 0%, #0B0B0F 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 30px 80px -20px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <AnimatePresence>
                    {shieldState === 'deflecting' && (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 1 }}
                        animate={{ scale: 2.4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{
                          position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(239,68,68,0.55) 0%, transparent 70%)',
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
                      height: '46%', width: 'auto', objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 30px rgba(220, 38, 38, 0.45))',
                      transition: 'transform 0.3s ease',
                      transform: shieldState === 'deflecting' ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                </Box>

                {/* Floating status card — top right */}
                <Paper
                  component={motion.div}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  elevation={0}
                  sx={{
                    position: 'absolute', top: '2%', right: { xs: '-4%', sm: '-10%' }, px: 2, py: 1.4,
                    borderRadius: 3, bgcolor: 'rgba(24,24,29,0.85)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)', minWidth: 150,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.65rem' }}>
                    Threats Blocked Today
                  </Typography>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1.2 }}>
                    {deflectedCount.toLocaleString()}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ADE80' }} />
                    <Typography variant="caption" sx={{ color: '#4ADE80', fontWeight: 700, fontSize: '0.65rem' }}>Protected</Typography>
                  </Box>
                </Paper>

                {/* Floating status card — bottom left */}
                <Paper
                  component={motion.div}
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  elevation={0}
                  sx={{
                    position: 'absolute', bottom: '4%', left: { xs: '-4%', sm: '-8%' }, px: 2, py: 1.2,
                    borderRadius: 3, bgcolor: 'rgba(24,24,29,0.85)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)', minWidth: 175,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.65rem', display: 'block', mb: 0.4 }}>
                    Mean Response Time
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={0.6}>
                    <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.05rem' }}>&lt; 11.8ms</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>on click, try it</Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          STAT STRIP — dark band, direct continuation of the hero
          ========================================================================= */}
      <Box sx={{ bgcolor: '#111114', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', py: { xs: 4, md: 5 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 3, md: 2 }}>
            {[
              { icon: <Speed sx={{ fontSize: 22 }} />, kpi: '24/7', label: 'Threat Monitoring' },
              { icon: <Memory sx={{ fontSize: 22 }} />, kpi: '16+', label: 'Security Collectors' },
              { icon: <AutoAwesome sx={{ fontSize: 22 }} />, kpi: 'AI-Powered', label: 'Detection & Response' },
              { icon: <VerifiedUser sx={{ fontSize: 22 }} />, kpi: 'Trusted', label: 'For Individuals & Businesses' },
            ].map((s, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Stack direction="row" spacing={1.6} alignItems="center">
                  <Box sx={{
                    width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(220,38,38,0.12)', color: '#EF4444',
                    border: '1px solid rgba(220,38,38,0.2)',
                  }}>
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.2 }}>
                      {s.kpi}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.75rem' }}>
                      {s.label}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          SECTION 2: 3-COLUMN VALUE PILLARS (Directly like Reference Image 2 - WBuilder)
          ========================================================================= */}
      <Box sx={{ bgcolor: '#FAF9F7', py: { xs: 9, md: 12 } }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-end' }} spacing={3} mb={7}>
            <Box maxWidth={640}>
              <Typography variant="overline" sx={{ color: '#DC2626', fontWeight: 800, letterSpacing: 1.5, fontSize: '0.75rem' }}>
                WHY KAVACH
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  color: '#0B0B0F',
                  mt: 1,
                }}
              >
                A simple, proven way to safeguard your digital world.
              </Typography>
            </Box>
            <Typography sx={{ color: '#5C5A57', fontSize: '1rem', maxWidth: 360 }}>
              Engineered for everyday employees, families, and businesses — no cybersecurity background required.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {[
              {
                icon: <Shield sx={{ fontSize: 34, color: '#DC2626' }} />,
                title: 'Autonomous Defense',
                desc: 'Continuous kernel-level protection that stops ransomware, malware, and intrusions in under 12 milliseconds without waiting for human approval.',
                featured: true,
              },
              {
                icon: <AutoAwesome sx={{ fontSize: 30, color: '#0369A1' }} />,
                title: 'Plain-English Clarity',
                desc: 'No confusing security jargon or cryptic terminal logs. Every notification tells you exactly what was stopped, why, and gives you a simple 1-click action.',
              },
              {
                icon: <PrecisionManufacturing sx={{ fontSize: 30, color: '#15803D' }} />,
                title: 'Industrial Heritage',
                desc: 'Born from the mission-critical manufacturing standards of Swastik Chemical (India). Built for absolute zero-failure dependability.',
              },
            ].map((pillar, idx) => (
              <Grid item xs={12} md={pillar.featured ? 5 : 3.5} key={idx}>
                <Paper
                  component={motion.div}
                  whileHover={{ y: -6 }}
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: pillar.featured ? 5 : 4 },
                    height: '100%',
                    minHeight: pillar.featured ? 320 : 280,
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    bgcolor: pillar.featured ? '#0B0B0F' : '#FFFFFF',
                    color: pillar.featured ? '#FFFFFF' : 'inherit',
                    border: pillar.featured ? 'none' : '1px solid #E9E6E2',
                    boxShadow: pillar.featured ? '0 20px 50px -18px rgba(220,38,38,0.35)' : '0 4px 16px rgba(11,11,15,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {pillar.featured && (
                    <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(220,38,38,0.35) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                  )}
                  <Box sx={{ mb: 2.5, position: 'relative' }}>{pillar.icon}</Box>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', color: pillar.featured ? '#FFFFFF' : '#0B0B0F', mb: 1.25, position: 'relative' }}>
                    {pillar.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: pillar.featured ? 'rgba(255,255,255,0.65)' : '#5C5A57', lineHeight: 1.65, fontSize: '0.95rem', position: 'relative' }}>
                    {pillar.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

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
