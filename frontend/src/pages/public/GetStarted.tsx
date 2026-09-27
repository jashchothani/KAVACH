import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Chip, Divider, Stack
} from '@mui/material';
import {
  RocketLaunch, VpnKey, Dashboard,
  ArrowForward, Person, CheckCircle, Shield
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';
const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
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

export const GetStarted: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const onboardingSteps = [
    {
      num: '01',
      title: 'Initialize Authentication',
      desc: 'Enter your username or email address and password to initiate session verification.',
      icon: <Person sx={{ fontSize: 26, color: CR }} />,
      detail: 'Default administrator accounts and analyst credentials can sign in immediately through our secure authentication portal.',
      badge: 'Step 01',
    },
    {
      num: '02',
      title: 'Two-Factor OTP Verification',
      desc: 'A secure 6-digit verification code is generated and dispatched to your email for multi-factor identity protection.',
      icon: <VpnKey sx={{ fontSize: 26, color: '#3B82F6' }} />,
      detail: 'Manual code verification ensures strict identity safeguards without insecure client-side autofill shortcuts.',
      badge: 'MFA Security',
    },
    {
      num: '03',
      title: 'Access KAVACH Operations',
      desc: 'Enter your unified security dashboard and choose your operational experience mode.',
      icon: <Dashboard sx={{ fontSize: 26, color: '#22C55E' }} />,
      detail: 'Choose between Normal Mode (calm, plain-English posture) or Analyst Mode (raw telemetry, MITRE ATT&CK, and SOAR controls).',
      badge: 'Dual Modes',
    },
  ];

  const bg = isDark ? '#08080C' : '#FDFCFB';
  const cardBg = isDark ? '#0E1017' : '#FFFFFF';
  const elevatedBg = isDark ? '#141722' : '#F8FAFC';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const borderHover = isDark ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.3)';
  const textPrimary = isDark ? '#FFFFFF' : '#090A0F';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.68)' : '#475569';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.42)' : '#64748B';
  const cardShadow = isDark
    ? '0 12px 32px -8px rgba(0, 0, 0, 0.6)'
    : '0 10px 30px -8px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02)';

  return (
    <Box
      sx={{
        py: { xs: 14, md: 20 },
        bgcolor: 'transparent',
        color: textPrimary,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glows */}
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.1, 1],
          opacity: isDark ? [0.06, 0.12, 0.06] : [0.03, 0.06, 0.03],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: '5%',
          left: '-5%',
          width: '50vw',
          height: '50vw',
          background: `radial-gradient(circle, ${CR} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.15, 1],
          opacity: isDark ? [0.04, 0.08, 0.04] : [0.02, 0.05, 0.02],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
          filter: 'blur(110px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box textAlign="center" maxWidth={860} mx="auto" mb={{ xs: 8, md: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: smoothEase }}
          >
            <Chip
              icon={<RocketLaunch sx={{ color: `${CR} !important`, fontSize: 16 }} />}
              label="PLATFORM ONBOARDING GUIDE"
              sx={{
                bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                color: CR,
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                fontFamily: 'JetBrains Mono, monospace',
                border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)',
                mb: 3,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4.2rem' },
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: textPrimary,
                mb: 2.5,
              }}
            >
              Get started with KAVACH in 3 simple steps.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: textSecondary,
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                lineHeight: 1.7,
                maxWidth: 720,
                mx: 'auto',
              }}
            >
              Access your centralized security operations dashboard, review your endpoint security score, monitor live telemetry, and collaborate with Raksha AI.
            </Typography>
          </motion.div>
        </Box>

        {/* Steps Progression Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={containerVariants}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3.5,
              mb: 8,
            }}
          >
            {onboardingSteps.map((step) => (
              <motion.div
                key={step.num}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    p: { xs: 4, md: 4.5 },
                    height: '100%',
                    borderRadius: 3,
                    bgcolor: cardBg,
                    border: `1px solid ${border}`,
                    boxShadow: cardShadow,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      borderColor: borderHover,
                      boxShadow: isDark
                        ? '0 16px 40px -10px rgba(0,0,0,0.8), 0 0 20px -5px rgba(220,38,38,0.15)'
                        : '0 16px 36px -10px rgba(0,0,0,0.08), 0 0 20px -5px rgba(220,38,38,0.1)',
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: elevatedBg,
                        border: `1px solid ${border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Chip
                      label={`STEP ${step.num}`}
                      size="small"
                      sx={{
                        color: CR,
                        fontWeight: 900,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.75rem',
                        bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                        border: `1px solid ${CR}`,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '1.35rem',
                      mb: 1.5,
                      color: textPrimary,
                    }}
                  >
                    {step.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: textSecondary,
                      lineHeight: 1.7,
                      fontSize: '0.95rem',
                      mb: 3,
                      flexGrow: 1,
                    }}
                  >
                    {step.desc}
                  </Typography>

                  <Divider sx={{ borderColor: border, mb: 2.5 }} />

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22C55E', fontSize: 16, mt: 0.3, flexShrink: 0 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: textMuted,
                        lineHeight: 1.55,
                        fontSize: '0.8rem',
                      }}
                    >
                      {step.detail}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* Primary Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: smoothEase }}
        >
          <Box
            sx={{
              p: { xs: 5, sm: 7, md: 9 },
              borderRadius: 4,
              bgcolor: cardBg,
              color: textPrimary,
              textAlign: 'center',
              border: `1px solid ${border}`,
              boxShadow: cardShadow,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top crimson accent line */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '25%',
                right: '25%',
                height: 2,
                background: `linear-gradient(90deg, transparent 0%, ${CR} 50%, transparent 100%)`,
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontSize: { xs: '2rem', sm: '2.6rem', md: '3.2rem' },
                  letterSpacing: '-0.025em',
                  mb: 2,
                }}
              >
                Ready to secure your environment?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: textSecondary,
                  fontSize: { xs: '1.05rem', md: '1.18rem' },
                  maxWidth: 680,
                  mx: 'auto',
                  lineHeight: 1.75,
                  mb: 5,
                }}
              >
                Sign in to start receiving real-time telemetry, analyze URLs with KAVACH URL Shield, and investigate security incidents with Raksha AI.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                alignItems="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                  sx={{
                    bgcolor: CR,
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    fontFamily: 'Outfit, sans-serif',
                    px: 4.5,
                    py: 1.7,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.45)',
                    '&:hover': {
                      bgcolor: '#B91C1C',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 30px -4px rgba(220, 38, 38, 0.65)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Proceed to Login & OTP Verification
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/about')}
                  sx={{
                    color: textPrimary,
                    borderColor: border,
                    fontWeight: 700,
                    fontSize: '1rem',
                    fontFamily: 'Outfit, sans-serif',
                    px: 3.5,
                    py: 1.7,
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: elevatedBg,
                    '&:hover': {
                      borderColor: textPrimary,
                      bgcolor: elevatedBg,
                    },
                  }}
                >
                  Learn About KAVACH
                </Button>
              </Stack>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default GetStarted;
