import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, Stack, Accordion, AccordionSummary, AccordionDetails,
  Paper, useTheme, Slider, LinearProgress
} from '@mui/material';
import {
  Shield, Security, RocketLaunch, Download, ExpandMore, CheckCircle,
  PlayArrow, Memory, PrecisionManufacturing, BugReport,
  AutoFixHigh, Hub, Storage, AutoAwesome, Terminal,
  Speed, Lock, VerifiedUser, FlashOn, HelpOutline, ArrowForward,
  Laptop, NotificationsActive, AssignmentTurnedIn, Dns, CalendarMonth,
  Groups, Assessment
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GanttProjectPlan } from '../../components/common/GanttProjectPlan';
import { PROJECT_DETAILS, TEAM_MEMBERS } from '../../data/projectData';

interface AttackScenario {
  id: string;
  name: string;
  category: string;
  plainSummary: string;
  target: string;
  steps: {
    title: string;
    plainExplanation: string;
    log: string;
    time: string;
  }[];
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'ransomware',
    name: '1. Ransomware Attack Attempt',
    category: 'Ransomware Protection',
    plainSummary: 'A hacker tries to encrypt company databases to demand a ransom payment.',
    target: 'Company Database Server (192.168.10.84)',
    steps: [
      {
        title: 'Step 1: Suspicious Activity Detected',
        plainExplanation: 'KAVACH AI notices a rogue program attempting to delete backup shadow copies.',
        log: '[09:14:02.102] eBPF sensor intercepted malicious process: "vssadmin.exe delete shadows /all"',
        time: '0.8ms',
      },
      {
        title: 'Step 2: Server Isolated Automatically',
        plainExplanation: 'KAVACH instantly disconnects the affected machine from the network so the infection cannot spread.',
        log: '[09:14:02.106] Applied emergency null-route firewall policy to 192.168.10.84. Network quarantined.',
        time: '4.2ms',
      },
      {
        title: 'Step 3: Malicious Program Killed',
        plainExplanation: 'The ransomware process is forcibly shut down and compromised user logins are revoked.',
        log: '[09:14:02.110] Terminated PID 4920. Revoked active login tokens to lock out the attacker.',
        time: '8.1ms',
      },
      {
        title: 'Step 4: Threat Neutralized & Logged',
        plainExplanation: 'The attack was completely stopped in under 12 milliseconds. Zero files were encrypted.',
        log: '[09:14:02.114] Incident INC-4091 verified & cryptographically sealed in tamper-proof audit vault.',
        time: '11.8ms',
      },
    ],
  },
  {
    id: 'deepfake',
    name: '2. Fake CEO Voice Call (Voice Scam)',
    category: 'AI Voice Shield',
    plainSummary: 'An attacker uses an AI-cloned voice of the CEO to order an unauthorized wire transfer.',
    target: 'Finance Executive Phone Line',
    steps: [
      {
        title: 'Step 1: Phone Audio Inspected Live',
        plainExplanation: 'KAVACH analyzes incoming call frequencies in real time looking for synthetic AI audio patterns.',
        log: '[09:14:05.210] Inbound SIP stream analyzed: Artificial high-frequency cutoff detected at 16.4 kHz.',
        time: '1.2ms',
      },
      {
        title: 'Step 2: Voice Clone Confirmed',
        plainExplanation: 'AI vocal tract biometrics determine the caller is an AI generated voice clone (99.8% confidence).',
        log: '[09:14:05.215] Biometric acoustic score mismatch: Confirmed synthetic voice clone.',
        time: '5.6ms',
      },
      {
        title: 'Step 3: Call Blocked Automatically',
        plainExplanation: 'The call is immediately terminated and a security alert is sent to the executive team.',
        log: '[09:14:05.218] Terminated call session at SIP gateway; broadcasted fraud warning.',
        time: '8.4ms',
      },
      {
        title: 'Step 4: Number Blacklisted Across Company',
        plainExplanation: 'The scammer number and carrier route are blocked across all company phones.',
        log: '[09:14:05.221] Distributed gateway ACL updated across all company phone systems.',
        time: '11.2ms',
      },
    ],
  },
  {
    id: 'scada',
    name: '3. Factory Machine Tampering (SCADA)',
    category: 'Industrial Plant Defense',
    plainSummary: 'A rogue device tries to change safety pressure valves in a chemical manufacturing plant.',
    target: 'Swastik Chemical Reactor PLC Controller',
    steps: [
      {
        title: 'Step 1: Industrial Signal Inspected',
        plainExplanation: 'KAVACH monitors factory sensor signals on the plant network at wire speed.',
        log: '[09:14:08.401] Monitored Modbus TCP frame on Port 502: Write command to memory register 0x1FA0.',
        time: '0.6ms',
      },
      {
        title: 'Step 2: Unauthorized Command Detected',
        plainExplanation: 'The system recognizes that register 0x1FA0 is an emergency valve that should never be altered remotely.',
        log: '[09:14:08.405] Safety whitelist violation: Register 0x1FA0 is locked by emergency safety policy.',
        time: '3.9ms',
      },
      {
        title: 'Step 3: Command Dropped Immediately',
        plainExplanation: 'The dangerous command is rejected before it can reach the chemical plant machine.',
        log: '[09:14:08.409] Command dropped at industrial gateway. Hardware fail-safe kept active.',
        time: '7.8ms',
      },
      {
        title: 'Step 4: Plant Control Room Notified',
        plainExplanation: 'Plant engineers receive an instant ticket with full forensic details of the blocked command.',
        log: '[09:14:08.412] Swastik Chemical control room alerted with packet capture analysis.',
        time: '10.9ms',
      },
    ],
  },
  {
    id: 'passwords',
    name: '4. Hacker Password Guessing (Brute Force)',
    category: 'Intrusion Defense',
    plainSummary: 'A botnet attempts thousands of password combinations to break into an employee account.',
    target: 'Corporate Active Directory Domain',
    steps: [
      {
        title: 'Step 1: Rapid Login Attempts Detected',
        plainExplanation: 'KAVACH detects 45 failed login attempts in 2 seconds from an unrecognized location.',
        log: '[09:14:12.802] Ingested 45 anomalous login attempts from external IP 185.220.101.5.',
        time: '1.4ms',
      },
      {
        title: 'Step 2: Attacker IP Address Banned',
        plainExplanation: 'The attacker IP address is blocked at the edge firewall across the entire company.',
        log: '[09:14:12.807] Null-routed 185.220.101.5 on edge firewall. Inbound packets dropped.',
        time: '4.8ms',
      },
      {
        title: 'Step 3: User Account Protected',
        plainExplanation: 'The targeted employee account requires two-factor authentication and session reset.',
        log: '[09:14:12.811] Enforced temporary password reset and revoked active access tokens.',
        time: '8.9ms',
      },
      {
        title: 'Step 4: Attack Thwarted',
        plainExplanation: 'Account takeover was prevented with zero human delay.',
        log: '[09:14:12.815] Incident logged in security ledger with 100% containment record.',
        time: '12.0ms',
      },
    ],
  },
];

export const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  // Interactive Sandbox state
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario>(ATTACK_SCENARIOS[0]);
  const [simState, setSimState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [simProgressStep, setSimProgressStep] = useState(0);

  // Interactive ROI Calculator state
  const [deviceCount, setDeviceCount] = useState<number>(500);

  // FAQ Category Filter State
  const [faqCategory, setFaqCategory] = useState<string>('All');

  const runSimulation = () => {
    setSimState('running');
    setSimProgressStep(1);
    setTimeout(() => setSimProgressStep(2), 650);
    setTimeout(() => setSimProgressStep(3), 1300);
    setTimeout(() => {
      setSimProgressStep(4);
      setSimState('completed');
    }, 1950);
  };

  const scrollToSandbox = () => {
    const el = document.getElementById('interactive-demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      category: 'Basics',
      q: 'What exactly does KAVACH do in simple terms?',
      a: 'KAVACH is like an automatic digital security guard for your company computers, cloud servers, and factory machines. When a hacker, virus, or ransomware tries to break in, KAVACH notices in less than 1 millisecond and stops the attack automatically in under 12 milliseconds without waiting for an IT person to manually fix it.',
    },
    {
      category: 'Basics',
      q: 'Who should use KAVACH?',
      a: 'KAVACH is built for IT and security teams at businesses, healthcare organizations, and industrial manufacturing facilities (like Swastik Chemical India) that cannot afford downtime, stolen files, or ransomware shutdowns.',
    },
    {
      category: 'How It Works',
      q: 'How is KAVACH different from normal antivirus software?',
      a: 'Normal antivirus only scans individual computers and usually just alerts an IT person. Traditional alerts take hours or days to be reviewed. KAVACH not only detects attacks with neural AI, but automatically contains them in under 12 milliseconds (disconnects the infected computer, terminates malicious processes, and blocks the hacker IP).',
    },
    {
      category: 'Factory & OT',
      q: 'How does KAVACH protect factory machinery and chemical plants?',
      a: 'KAVACH was engineered with domain expertise from Swastik Chemical (India). It monitors industrial protocols like Modbus and PROFINET, ensuring hackers cannot tamper with chemical valves, temperature controls, or industrial robots.',
    },
    {
      category: 'Installation',
      q: 'How do I install KAVACH on my computers?',
      a: 'Installation takes under 5 minutes. You can download a single lightweight agent file from our Download Center for Windows, Mac, or Linux, or deploy across all company machines at once using your IT management console.',
    },
    {
      category: 'Compliance',
      q: 'Does KAVACH help us pass compliance and security audits?',
      a: 'Yes. KAVACH automatically writes every security event and response into a tamper-proof cryptographic audit log that meets SOC2 Type II, ISO 27001, and CERT-In compliance standards.',
    },
  ];

  const filteredFaqs = faqCategory === 'All' ? faqs : faqs.filter((f) => f.category === faqCategory);

  // Plain language ROI Calculations
  const hoursSavedPerMonth = Math.round(deviceCount * 0.4);
  const estimatedSavings = (deviceCount * 18).toLocaleString();

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* 1. HERO SECTION: 5-Second Comprehension First */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          overflow: 'hidden',
          background: isDark
            ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(193, 18, 31, 0.22), rgba(3, 4, 8, 0.98) 85%)'
            : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(193, 18, 31, 0.08), rgba(248, 250, 252, 0.98) 85%)',
        }}
        className="cyber-grid-bg"
      >
        <Container maxWidth="xl">
          {/* Academic Sponsor & Diploma Project Badge */}
          <Box display="flex" justifyContent="center" mb={1.5}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.2,
                px: 2.2,
                py: 0.8,
                borderRadius: '9999px',
                bgcolor: isDark ? 'rgba(193, 18, 31, 0.12)' : 'rgba(193, 18, 31, 0.08)',
                border: '1px solid rgba(193, 18, 31, 0.35)',
              }}
            >
              <Shield sx={{ color: '#C1121F', fontSize: 16 }} />
              <Typography
                sx={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: { xs: '0.72rem', md: '0.8rem' },
                  fontWeight: 700,
                  color: isDark ? '#FCA5A5' : '#991B1B',
                  letterSpacing: '0.02em',
                }}
              >
                Diploma Final Year Project • Shri Bhagubhai Mafatlal Polytechnic | Sponsored by <strong>Swastik Chemical (India)</strong>
              </Typography>
            </Box>
          </Box>

          {/* Top Posture Badge */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.2,
                px: 2,
                py: 0.7,
                borderRadius: '9999px',
                bgcolor: isDark ? 'rgba(13, 14, 24, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(193, 18, 31, 0.35)',
                boxShadow: '0 0 20px rgba(193, 18, 31, 0.15)',
              }}
            >
              <Box className="live-status-dot" />
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: { xs: '0.75rem', md: '0.82rem' },
                  fontWeight: 700,
                  color: isDark ? '#F1F5F9' : '#0F172A',
                }}
              >
                AUTOMATIC THREAT DEFENSE • SUB-12ms RESPONSE • AI-POWERED
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={5} alignItems="center">
            {/* Hero Left: Crystal Clear 5-Second Headline & Value Proposition */}
            <Grid item xs={12} lg={7}>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: '"Outfit", "Space Grotesk", sans-serif',
                  fontWeight: 900,
                  fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4.2rem' },
                  lineHeight: 1.12,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  mb: 2.5,
                }}
              >
                Stop Cyberattacks <span className="crimson-gradient-text">Automatically</span> in Under 12 Milliseconds.
              </Typography>

              <Typography
                sx={{
                  fontFamily: '"Space Grotesk", "Inter", sans-serif',
                  fontSize: { xs: '1.05rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155',
                  mb: 4,
                  maxWidth: 680,
                }}
              >
                KAVACH protects company computers, cloud servers, and factory machinery. When ransomware, hackers, or AI voice scams strike, KAVACH stops them <strong>instantly without waiting for human intervention</strong>.
              </Typography>

              {/* Primary Call to Action Buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={5} flexWrap="wrap">
                {/* 1. Primary Action */}
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={scrollToSandbox}
                  sx={{
                    background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '1rem',
                    px: 3.8,
                    py: 1.6,
                    borderRadius: '8px',
                    boxShadow: '0 8px 25px rgba(193, 18, 31, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E63946 0%, #C1121F 100%)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Try 30-Sec Live Attack Demo
                </Button>

                {/* 2. Secondary Action */}
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AutoAwesome sx={{ color: '#93C5FD' }} />}
                  onClick={() => navigate('/showcase')}
                  sx={{
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    px: 3.2,
                    py: 1.6,
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 8px 25px rgba(30, 58, 138, 0.45)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Explore 3D Showcase
                </Button>

                {/* 3. Download Action */}
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Download />}
                  onClick={() => navigate('/download')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    px: 3,
                    py: 1.6,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    },
                  }}
                >
                  Download Free Agent
                </Button>
              </Stack>
            </Grid>

            {/* Hero Right: 5-Second "At a Glance" Clarity Card */}
            <Grid item xs={12} lg={5}>
              <Paper
                elevation={0}
                className="glass-panel-enterprise"
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: '1px solid rgba(193, 18, 31, 0.4)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                  position: 'relative',
                }}
              >
                <Box display="flex" alignItems="center" gap={1.2} mb={2.5}>
                  <Shield sx={{ color: '#C1121F', fontSize: 26 }} />
                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF' }}>
                    KAVACH At a Glance
                  </Typography>
                </Box>

                <Stack spacing={2.5}>
                  {/* Item 1 */}
                  <Box sx={{ p: 1.8, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 800, letterSpacing: '0.04em' }}>
                      1. WHAT IS IT?
                    </Typography>
                    <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.92rem', mt: 0.3 }}>
                      An automated AI Cybersecurity & Incident Response system that monitors and defends your devices 24/7.
                    </Typography>
                  </Box>

                  {/* Item 2 */}
                  <Box sx={{ p: 1.8, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800, letterSpacing: '0.04em' }}>
                      2. WHO IS IT FOR?
                    </Typography>
                    <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.92rem', mt: 0.3 }}>
                      Businesses, IT teams, chemical manufacturing plants, and infrastructure operators (e.g. Swastik Chemical).
                    </Typography>
                  </Box>

                  {/* Item 3 */}
                  <Box sx={{ p: 1.8, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 800, letterSpacing: '0.04em' }}>
                      3. WHY DO YOU NEED IT?
                    </Typography>
                    <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.92rem', mt: 0.3 }}>
                      Human response takes 4 hours. KAVACH stops ransomware and data theft in <strong>12 milliseconds automatically</strong>.
                    </Typography>
                  </Box>
                </Stack>

                {/* Direct Action Link */}
                <Box mt={3} pt={2} borderTop="1px solid rgba(255, 255, 255, 0.1)" display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                    Ready to see it in action?
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={scrollToSandbox}
                    sx={{ color: '#E63946', fontWeight: 800, textTransform: 'none' }}
                  >
                    Test Live Simulator
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Quick Module Navigation Cards (From svdgamerz/KAVACH) */}
          <Grid container spacing={3} mt={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                onClick={scrollToSandbox}
                className="glass-panel-enterprise"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '1px solid rgba(193, 18, 31, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': { transform: 'translateY(-4px)', borderColor: '#C1121F', boxShadow: '0 8px 30px rgba(193, 18, 31, 0.25)' },
                }}
              >
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(193, 18, 31, 0.15)', color: '#C1121F', display: 'inline-flex', mb: 2 }}>
                  <PlayArrow />
                </Box>
                <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 0.5, fontSize: '1.05rem' }}>
                  XDR Simulator
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Simulate live ransomware, deepfake voice scams, and SCADA attacks in real-time.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                onClick={() => navigate('/about')}
                className="glass-panel-enterprise"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': { transform: 'translateY(-4px)', borderColor: '#3B82F6', boxShadow: '0 8px 30px rgba(59, 130, 246, 0.25)' },
                }}
              >
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', display: 'inline-flex', mb: 2 }}>
                  <Shield />
                </Box>
                <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 0.5, fontSize: '1.05rem' }}>
                  MITRE ATT&CK
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Explore 14 enterprise tactics and behavioral telemetry rules mapped to MITRE v14.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                onClick={scrollToSandbox}
                className="glass-panel-enterprise"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': { transform: 'translateY(-4px)', borderColor: '#10B981', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)' },
                }}
              >
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', display: 'inline-flex', mb: 2 }}>
                  <Terminal />
                </Box>
                <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 0.5, fontSize: '1.05rem' }}>
                  SOAR Playbooks
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Autonomous host isolation, process killing, and one-click rollback in &lt;12ms.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                onClick={() => {
                  const el = document.getElementById('project-roadmap-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/about');
                }}
                className="glass-panel-enterprise"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': { transform: 'translateY(-4px)', borderColor: '#F59E0B', boxShadow: '0 8px 30px rgba(245, 158, 11, 0.25)' },
                }}
              >
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', display: 'inline-flex', mb: 2 }}>
                  <CalendarMonth />
                </Box>
                <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 0.5, fontSize: '1.05rem' }}>
                  11-Week Roadmap
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Interactive Gantt chart, 8 engineering modules, and student team credits.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. HOW IT WORKS: 3 Simple Steps */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
        <Box textAlign="center" mb={7}>
          <Chip
            label="HOW KAVACH WORKS"
            size="small"
            sx={{
              bgcolor: 'rgba(193, 18, 31, 0.12)',
              color: '#C1121F',
              border: '1px solid rgba(193, 18, 31, 0.3)',
              fontWeight: 800,
              mb: 1.5,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Outfit", "Space Grotesk", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '2.8rem' },
              color: '#FFFFFF',
              mb: 1.5,
            }}
          >
            Protection in 3 Simple Steps
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.05rem', maxWidth: 650, mx: 'auto' }}>
            No complex setup. No security team required.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            {
              step: '1',
              title: 'Install 1-Click Agent',
              desc: 'Download and install our lightweight software agent on your laptops, cloud servers, or factory computers in under 5 minutes.',
              icon: <Laptop sx={{ fontSize: 32, color: '#3B82F6' }} />,
              color: '#3B82F6',
            },
            {
              step: '2',
              title: 'AI Monitors 24/7',
              desc: 'KAVACH continuously watches for suspicious hacker logins, ransomware file encryption, and fake AI voice phone calls.',
              icon: <NotificationsActive sx={{ fontSize: 32, color: '#F59E0B' }} />,
              color: '#F59E0B',
            },
            {
              step: '3',
              title: 'Attacks Blocked in 12ms',
              desc: 'When an attack occurs, KAVACH isolates the machine and stops the threat automatically, saving a full report to your dashboard.',
              icon: <AssignmentTurnedIn sx={{ fontSize: 32, color: '#10B981' }} />,
              color: '#10B981',
            },
          ].map((s) => (
            <Grid item xs={12} md={4} key={s.step}>
              <Paper
                elevation={0}
                className="glass-panel-enterprise"
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${s.color}15`, border: `1px solid ${s.color}40` }}>
                      {s.icon}
                    </Box>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 900, fontSize: '2rem', color: s.color, opacity: 0.8 }}>
                      0{s.step}
                    </Typography>
                  </Box>

                  <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                    {s.title}
                  </Typography>

                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '0.95rem', lineHeight: 1.65 }}>
                    {s.desc}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 3. INTERACTIVE 30-SECOND THREAT SIMULATOR */}
      <Box
        id="interactive-demo"
        sx={{
          bgcolor: isDark ? '#05060D' : '#F1F5F9',
          py: { xs: 8, md: 14 },
          borderTop: '1px solid rgba(193, 18, 31, 0.25)',
          borderBottom: '1px solid rgba(193, 18, 31, 0.25)',
        }}
      >
        <Container maxWidth="xl">
          <Box textAlign="center" mb={6}>
            <Chip
              label="INTERACTIVE 30-SECOND DEMO"
              size="small"
              sx={{
                bgcolor: 'rgba(193, 18, 31, 0.12)',
                color: '#C1121F',
                border: '1px solid rgba(193, 18, 31, 0.3)',
                fontWeight: 800,
                mb: 1.5,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Outfit", "Space Grotesk", sans-serif',
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                color: '#FFFFFF',
                mb: 1.5,
              }}
            >
              See How KAVACH Stops Real Attacks
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '1.05rem', maxWidth: 650, mx: 'auto' }}>
              Select a cyberattack below, then click <strong>"Trigger Attack Simulation"</strong> to watch how KAVACH responds automatically.
            </Typography>
          </Box>

          {/* Scenario Tabs */}
          <Box display="flex" flexWrap="wrap" gap={1.5} justifyContent="center" mb={4}>
            {ATTACK_SCENARIOS.map((scenario) => {
              const isSelected = selectedScenario.id === scenario.id;
              return (
                <Button
                  key={scenario.id}
                  variant={isSelected ? 'contained' : 'outlined'}
                  onClick={() => {
                    setSelectedScenario(scenario);
                    setSimState('idle');
                    setSimProgressStep(0);
                  }}
                  sx={{
                    borderRadius: '8px',
                    px: 2.5,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    bgcolor: isSelected ? '#C1121F' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isSelected ? '#C1121F' : 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    '&:hover': {
                      bgcolor: isSelected ? '#E63946' : 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {scenario.name}
                </Button>
              );
            })}
          </Box>

          {/* Simulation View */}
          <Grid container spacing={4} alignItems="stretch">
            {/* Left: What is happening */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                className="glass-panel-enterprise"
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Chip
                    label={selectedScenario.category}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(193, 18, 31, 0.18)',
                      color: '#F87171',
                      fontWeight: 800,
                      mb: 2,
                    }}
                  />

                  <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                    {selectedScenario.name}
                  </Typography>

                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', lineHeight: 1.6, mb: 3 }}>
                    {selectedScenario.plainSummary}
                  </Typography>

                  <Box p={2} borderRadius={2} bgcolor="rgba(255, 255, 255, 0.03)" border="1px solid rgba(255, 255, 255, 0.08)">
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)', fontWeight: 700 }}>
                      TARGETED SYSTEM:
                    </Typography>
                    <Typography sx={{ color: '#93C5FD', fontWeight: 700, fontSize: '0.9rem', mt: 0.3 }}>
                      {selectedScenario.target}
                    </Typography>
                  </Box>
                </Box>

                <Box mt={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={runSimulation}
                    disabled={simState === 'running'}
                    sx={{
                      background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                      color: '#FFFFFF',
                      fontWeight: 900,
                      fontSize: '1rem',
                      py: 1.6,
                      borderRadius: '8px',
                      boxShadow: '0 8px 25px rgba(193, 18, 31, 0.5)',
                      '&:hover': { background: 'linear-gradient(135deg, #E63946 0%, #C1121F 100%)' },
                    }}
                  >
                    {simState === 'running' ? 'Stopping Attack...' : 'Trigger Attack Simulation'}
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Right: Step-by-Step Response in Plain English */}
            <Grid item xs={12} lg={8}>
              <Paper
                elevation={0}
                className="terminal-window"
                sx={{
                  p: { xs: 2.5, md: 4 },
                  borderRadius: 3,
                  height: '100%',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} pb={2} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <Shield sx={{ color: '#C1121F' }} />
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', fontSize: '1.1rem' }}>
                      Automated Defense Steps (Sub-12ms Response)
                    </Typography>
                  </Box>

                  <Chip
                    label={simState === 'idle' ? 'READY TO TEST' : simState === 'running' ? 'RESPONDING IN 12ms...' : 'THREAT STOPPED'}
                    size="small"
                    sx={{
                      bgcolor: simState === 'idle' ? 'rgba(255,255,255,0.08)' : simState === 'running' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: simState === 'idle' ? '#FFFFFF' : simState === 'running' ? '#F59E0B' : '#10B981',
                      fontWeight: 800,
                    }}
                  />
                </Box>

                {simState === 'running' && <LinearProgress color="error" sx={{ mb: 3, borderRadius: 1 }} />}

                <Stack spacing={2}>
                  {selectedScenario.steps.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isActive = simProgressStep >= stepNum;

                    return (
                      <Box
                        key={step.title}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: isActive ? 'rgba(193, 18, 31, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: isActive ? '1px solid rgba(193, 18, 31, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                          <Typography
                            sx={{
                              fontFamily: '"Outfit", sans-serif',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                            }}
                          >
                            {step.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.78rem',
                              color: isActive ? '#10B981' : 'rgba(255, 255, 255, 0.4)',
                              fontWeight: 800,
                            }}
                          >
                            {isActive ? step.time : '--'}
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontSize: '0.88rem',
                            color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                            mb: 0.5,
                          }}
                        >
                          {isActive ? step.plainExplanation : 'Click "Trigger Attack Simulation" to test.'}
                        </Typography>

                        {isActive && (
                          <Typography
                            sx={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.75rem',
                              color: '#93C5FD',
                              opacity: 0.85,
                            }}
                          >
                            {step.log}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. CORE PROTECTION AREAS */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 14 } }}>
        <Box textAlign="center" mb={7}>
          <Chip
            label="WHAT KAVACH PROTECTS"
            size="small"
            sx={{
              bgcolor: 'rgba(193, 18, 31, 0.12)',
              color: '#C1121F',
              border: '1px solid rgba(193, 18, 31, 0.3)',
              fontWeight: 800,
              mb: 1.5,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Outfit", "Space Grotesk", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '2.8rem' },
              color: '#FFFFFF',
              mb: 1.5,
            }}
          >
            Complete Enterprise Defense
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '1.05rem', maxWidth: 650, mx: 'auto' }}>
            One single platform protecting your computers, servers, factory machines, and executive channels.
          </Typography>
        </Box>

        <Grid container spacing={3.5}>
          {[
            {
              title: 'Ransomware Defense',
              desc: 'Detects unauthorized file encryption attempts immediately and stops them before a single file is damaged.',
              icon: <Shield sx={{ fontSize: 28, color: '#EF4444' }} />,
              color: '#EF4444',
            },
            {
              title: 'Automated 12ms Response',
              desc: 'Automatically quarantines infected devices, resets compromised passwords, and blocks hacker IPs in milliseconds.',
              icon: <Speed sx={{ fontSize: 28, color: '#F59E0B' }} />,
              color: '#F59E0B',
            },
            {
              title: 'AI Voice Scam Shield',
              desc: 'Inspects phone and teleconference audio to catch AI voice clones impersonating company executives.',
              icon: <Security sx={{ fontSize: 28, color: '#EC4899' }} />,
              color: '#EC4899',
            },
            {
              title: 'Factory & SCADA Protection',
              desc: 'Engineered with Swastik Chemical to safeguard chemical plant machinery, valves, and industrial sensors.',
              icon: <PrecisionManufacturing sx={{ fontSize: 28, color: '#10B981' }} />,
              color: '#10B981',
            },
            {
              title: 'Hacker Technique Tracking',
              desc: 'Maps attacker movements in real time using the global MITRE cybersecurity standard.',
              icon: <Hub sx={{ fontSize: 28, color: '#8B5CF6' }} />,
              color: '#8B5CF6',
            },
            {
              title: 'Tamper-Proof Audit Logs',
              desc: 'Every security event is permanently sealed with cryptographic integrity for compliance audits.',
              icon: <Storage sx={{ fontSize: 28, color: '#3B82F6' }} />,
              color: '#3B82F6',
            },
          ].map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item.title}>
              <Paper
                elevation={0}
                className="glass-panel-enterprise"
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: `${item.color}15`,
                    border: `1px solid ${item.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {item.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 5. TIME SAVINGS & ROI CALCULATOR */}
      <Box sx={{ bgcolor: isDark ? '#05060D' : '#F8FAFC', py: { xs: 8, md: 12 }, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Container maxWidth="xl">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} lg={5}>
              <Chip
                label="TIME & COST SAVINGS"
                size="small"
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.12)',
                  color: '#60A5FA',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontWeight: 800,
                  mb: 1.5,
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontFamily: '"Outfit", "Space Grotesk", sans-serif',
                  fontWeight: 900,
                  fontSize: { xs: '1.85rem', md: '2.6rem' },
                  color: '#FFFFFF',
                  mb: 2,
                }}
              >
                How Much Time Will KAVACH Save Your Team?
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '1rem', lineHeight: 1.6, mb: 4 }}>
                Move the slider to match your number of company laptops, servers, or factory machines to estimate your monthly time savings.
              </Typography>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography sx={{ fontWeight: 700, color: '#FFFFFF' }}>Company Devices / Computers:</Typography>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, color: '#C1121F', fontSize: '1.1rem' }}>
                    {deviceCount.toLocaleString()} devices
                  </Typography>
                </Box>
                <Slider
                  value={deviceCount}
                  min={50}
                  max={10000}
                  step={50}
                  onChange={(_, val) => setDeviceCount(val as number)}
                  sx={{ color: '#C1121F' }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} lg={7}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} className="glass-panel-enterprise" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: 700 }}>
                      INCIDENT CONTAINMENT SPEED
                    </Typography>
                    <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 900, color: '#C1121F', my: 1 }}>
                      &lt; 12 ms
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                      vs 4.2 hours manual IT triage
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} className="glass-panel-enterprise" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: 700 }}>
                      IT HOURS SAVED PER MONTH
                    </Typography>
                    <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 900, color: '#F59E0B', my: 1 }}>
                      {hoursSavedPerMonth.toLocaleString()} hrs
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                      Eliminates manual false-alarm triage
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 6. SWASTIK CHEMICAL 3-PILLAR INDUSTRIAL ARCHITECTURE */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 10 } }}>
        <Box textAlign="center" mb={6}>
          <Chip
            label="SPONSORED INDUSTRIAL DEPLOYMENT"
            size="small"
            sx={{
              bgcolor: 'rgba(193, 18, 31, 0.12)',
              color: '#C1121F',
              border: '1px solid rgba(193, 18, 31, 0.3)',
              fontWeight: 800,
              mb: 1.5,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Outfit", "Space Grotesk", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '2.8rem' },
              color: '#FFFFFF',
              mb: 1.5,
            }}
          >
            Engineered with Swastik Chemical (India)
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 750, mx: 'auto', fontSize: '1rem' }}>
            Built and validated against real-world industrial threat exposure across manufacturing plants and enterprise networks.
          </Typography>
        </Box>

        <Grid container spacing={4} mb={6}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              className="glass-panel-enterprise"
              sx={{ p: 4, borderRadius: 3, height: '100%', border: '1px solid rgba(193, 18, 31, 0.25)' }}
            >
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(193, 18, 31, 0.15)', color: '#C1121F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, mb: 2.5 }}>
                01
              </Box>
              <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                Machine Telemetry Layer
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7, fontSize: '0.88rem' }}>
                Continuous monitoring of Windows Event Logs (4624, 4625, 4648), Microsoft Sysmon (1, 3, 10, 11), File Integrity Monitoring (FIM), and ransomware decoy canary files.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              className="glass-panel-enterprise"
              sx={{ p: 4, borderRadius: 3, height: '100%', border: '1px solid rgba(59, 130, 246, 0.25)' }}
            >
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, mb: 2.5 }}>
                02
              </Box>
              <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                Human-Layer Defense
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7, fontSize: '0.88rem' }}>
                Dedicated AI neural engine detecting deepfake voice/video impersonation, vishing calls, and spoofed phishing portals in real-time before executive wire fraud occurs.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              className="glass-panel-enterprise"
              sx={{ p: 4, borderRadius: 3, height: '100%', border: '1px solid rgba(16, 185, 129, 0.25)' }}
            >
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, mb: 2.5 }}>
                03
              </Box>
              <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                Automated SOAR & Rollback
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7, fontSize: '0.88rem' }}>
                Pre-built automated playbooks for zero-trust host isolation, malicious PID termination, account credential lockouts, and one-click cryptographic audit rollback.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* 7. 11-WEEK PROJECT ROADMAP & GANTT SECTION (Direct from svdgamerz/KAVACH) */}
      <Box id="project-roadmap-section" sx={{ py: { xs: 8, md: 12 }, bgcolor: isDark ? 'rgba(5, 5, 10, 0.6)' : 'rgba(241, 245, 249, 0.6)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={6}>
            <Chip
              icon={<CalendarMonth sx={{ color: '#F59E0B !important' }} />}
              label="PROJECT ROADMAP & DEVELOPMENT PHASES"
              size="small"
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontWeight: 800,
                mb: 1.5,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Outfit", "Space Grotesk", sans-serif',
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                color: '#FFFFFF',
                mb: 1.5,
              }}
            >
              11-Week Engineering Gantt Roadmap
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 750, mx: 'auto', fontSize: '1rem' }}>
              Track all 8 development modules, deliverables, and student author contributions (July 7 – September 2026).
            </Typography>
          </Box>

          <GanttProjectPlan />
        </Container>
      </Box>

      {/* 8. PLAIN ENGLISH FAQ */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 14 } }}>
        <Box textAlign="center" mb={6}>
          <Chip
            label="FREQUENTLY ASKED QUESTIONS"
            size="small"
            sx={{
              bgcolor: 'rgba(193, 18, 31, 0.12)',
              color: '#C1121F',
              border: '1px solid rgba(193, 18, 31, 0.3)',
              fontWeight: 800,
              mb: 1.5,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Outfit", "Space Grotesk", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '1.85rem', md: '2.6rem' },
              color: '#FFFFFF',
            }}
          >
            Got Questions? We Have Answers.
          </Typography>
        </Box>

        {filteredFaqs.map((faq, i) => (
          <Accordion
            key={i}
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: '10px !important',
              bgcolor: isDark ? 'rgba(13, 14, 24, 0.8)' : '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#C1121F' }} />}>
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: '1.02rem', color: '#FFFFFF' }}>
                {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.7 }}>
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>

      {/* 7. CONVERSION CTA BANNER */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #990B16 0%, #450308 100%)',
          color: '#FFFFFF',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Outfit", "Space Grotesk", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2rem', sm: '2.8rem' },
              mb: 2,
            }}
          >
            Start Protecting Your Systems in Under 5 Minutes
          </Typography>
          <Typography
            sx={{
              fontSize: '1.1rem',
              opacity: 0.9,
              maxWidth: 600,
              mx: 'auto',
              mb: 4.5,
              lineHeight: 1.6,
            }}
          >
            Download the lightweight agent or explore the interactive platform console right now.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<Download />}
              onClick={() => navigate('/download')}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#C1121F',
                fontWeight: 900,
                fontSize: '1rem',
                px: 4,
                py: 1.6,
                borderRadius: '8px',
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              Download Free Agent
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: '#FFFFFF',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1rem',
                px: 4,
                py: 1.6,
                borderRadius: '8px',
                borderWidth: 2,
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.12)', borderWidth: 2 },
              }}
            >
              Launch Live Platform
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
