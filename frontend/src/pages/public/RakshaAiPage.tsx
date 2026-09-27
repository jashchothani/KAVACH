import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, Chip, Stack,
  Divider, Paper, TextField, IconButton
} from '@mui/material';
import {
  AutoAwesome, Shield, Psychology, Send, Security,
  Lock, CheckCircle, Warning, HelpOutlined, Code,
  ArrowForward, VisibilityOff, Loop, Layers
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { RakshaAiLiveLogo } from '../../components/common/RakshaAiLiveLogo';
import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';

export const RakshaAiPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [activeScenario, setActiveScenario] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scenarios = [
    {
      query: 'What needs my immediate attention on this machine?',
      analystRole: 'Individual / Normal User',
      thought: 'Sanitizing context... evaluating 16-engine telemetry streams... active alerts: 1 (Process anomaly)',
      explanation:
        'KAVACH detected a suspicious background command spawned by svchost.exe that attempted to connect to an untrusted IP address (185.220.101.5). KAVACH blocked the network connection and isolated the process. Your personal files and system remain secure.',
      recommendation: 'No immediate action required on your part. KAVACH has neutralized the threat and created incident #INC-1042 for verification.',
      technicalTags: ['T1059.001', 'C2 Neutralized', 'Auto-Contained'],
      sanitizedFields: ['IP Address: 185.220.101.5', 'API Keys: None in payload', 'Host: DESKTOP-49A'],
    },
    {
      query: 'Explain the MITRE technique associated with Alert #KVC-1042.',
      analystRole: 'SOC Analyst (L2)',
      thought: 'Correlating technique ID T1059.001 with Parent PID 4812... deobfuscating Base64 memory buffer...',
      explanation:
        'Alert #KVC-1042 matches MITRE ATT&CK Technique T1059.001 (Command and Scripting Interpreter: PowerShell). The script utilized Base64 encoding and bypass flags (-NoProfile -WindowStyle Hidden -Enc) to evade static signature scanners. The command attempted an in-memory IEX download cradling payload.',
      recommendation: 'Verify if svchost.exe PID 4812 was legitimately injected. Review the quarantined memory dump at /quarantine/mem_4812.dmp and revoke any related service tokens.',
      technicalTags: ['Execution: T1059.001', 'Defense Evasion: T1027', 'Memory Quarantined'],
      sanitizedFields: ['User Account: [REDACTED_USER]', 'Password Hashes: [SCRUBBED]', 'PID: 4812'],
    },
    {
      query: 'Is this URL safe to open: http://paypa1-security-verify.com/login?',
      analystRole: 'Employee / User Inquiry',
      thought: 'Invoking KAVACH URL Security Engine... running lexical analysis, Punycode check, typosquatting heuristic...',
      explanation:
        'This link is a high-risk typosquatting and homograph attempt imitating PayPal (replacing the letter "l" with number "1"). Our lexical scanner identified suspicious credential-harvesting markers and unverified DNS registration.',
      recommendation: 'DO NOT open this link or enter any credentials. KAVACH has added this domain to the local protective firewall blocklist.',
      technicalTags: ['Typosquatting Detected', 'Phishing Threat', 'Domain Blocked'],
      sanitizedFields: ['User Session: [REDACTED]', 'Target Domain: paypa1-security-verify.com'],
    },
  ];

  const current = scenarios[activeScenario];

  useEffect(() => {
    setIsTyping(true);
    setDisplayedText('');
    const fullText = current.explanation;
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < fullText.length) {
        setDisplayedText((prev) => prev + fullText.charAt(idx));
        idx++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [activeScenario]);

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
            <Box display="flex" justifyContent="center" mb={2}>
              <RakshaAiLiveLogo size="sm" isDark={isDark} showBadge />
            </Box>
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
              Meet your cybersecurity copilot inside KAVACH.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                fontSize: { xs: '1.05rem', md: '1.18rem' },
                lineHeight: 1.7,
              }}
            >
              Raksha AI is the intelligent copilot embedded directly within KAVACH. It bridges the gap between deep technical telemetry and clear human understanding — investigating anomalies, translating alerts into plain English, and recommending actionable defense.
            </Typography>
          </motion.div>
        </Box>

        {/* 3 Core Principles Cards */}
        <Grid container spacing={3.5} mb={8}>
          {[
            {
              title: 'Explains, Never Obscures',
              desc: 'Translates complex process trees, hexadecimal memory dumps, and MITRE codes into calm, intelligible language anyone can understand.',
              icon: <Psychology sx={{ fontSize: 28, color: '#3B82F6' }} />,
            },
            {
              title: 'Automated Context Sanitization',
              desc: 'Before external AI inference, KAVACH automatically redacts API keys, credentials, bearer tokens, and PII. Sensitive data never leaves your environment.',
              icon: <VisibilityOff sx={{ fontSize: 28, color: CR }} />,
            },
            {
              title: 'Resilient Multi-Tier Fallback',
              desc: 'AI failure never equals security failure. If NVIDIA NIM is unreachable, Raksha seamlessly falls back to local models or deterministic heuristic engines.',
              icon: <Loop sx={{ fontSize: 28, color: '#22C55E' }} />,
            },
          ].map((item, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Box
                sx={{
                  p: 3.5,
                  borderRadius: 3.5,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.025)' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  height: '100%',
                }}
              >
                <Box mb={2}>{item.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569', lineHeight: 1.7 }}>
                  {item.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Interactive Scenario Inquiry Terminal */}
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4.5,
            bgcolor: isDark ? '#050508' : '#0F172A',
            color: '#E2E8F0',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #1E293B',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
            mb: 8,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3} pb={2} borderBottom="1px solid rgba(255,255,255,0.1)">
            <Box display="flex" alignItems="center" gap={1.5}>
              <RakshaAiLiveLogo size="sm" isDark showBadge={false} />
              <Box>
                <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 800, letterSpacing: '0.06em', fontFamily: 'JetBrains Mono', display: 'block' }}>
                  RAKSHA AI // LIVE COPILOT PREVIEW
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
                  CONNECTED TO KAVACH EVENT BUS • CONTEXT SANITIZER ACTIVE
                </Typography>
              </Box>
            </Box>

            {/* Scenario Selector Pills */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {scenarios.map((sc, sidx) => (
                <Chip
                  key={sidx}
                  label={`Demo ${sidx + 1}`}
                  onClick={() => setActiveScenario(sidx)}
                  sx={{
                    bgcolor: activeScenario === sidx ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
                    color: activeScenario === sidx ? '#93C5FD' : '#94A3B8',
                    fontWeight: 700,
                    border: activeScenario === sidx ? '1px solid #3B82F6' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* User Inquiry Box */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              mb: 3,
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'JetBrains Mono', display: 'block', mb: 0.8 }}>
              USER INQUIRY ({current.analystRole}):
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: '#FFFFFF' }}>
              "{current.query}"
            </Typography>
          </Box>

          {/* Real-time Thought Stream & Sanitizer */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: 'rgba(0,0,0,0.5)',
              border: '1px dashed rgba(59,130,246,0.35)',
              mb: 3,
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#3B82F6', animation: 'status-blink 1s infinite' }} />
              <Typography variant="caption" sx={{ color: '#93C5FD', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>
                THOUGHT & SANITIZATION STREAM:
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: '#CBD5E1', display: 'block', mb: 1 }}>
              {current.thought}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {current.sanitizedFields.map((field, fidx) => (
                <Chip
                  key={fidx}
                  label={field}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(34,197,94,0.1)',
                    color: '#86EFAC',
                    fontSize: '0.68rem',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* AI Response Output */}
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              mb: 3,
            }}
          >
            <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 800, letterSpacing: '0.06em', fontFamily: 'JetBrains Mono', display: 'block', mb: 1 }}>
              RAKSHA AI EXPLANATION:
            </Typography>
            <Typography variant="body1" sx={{ color: '#F1F5F9', lineHeight: 1.8, fontSize: '1.02rem', mb: 2 }}>
              {displayedText}
              {isTyping && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 16,
                    bgcolor: '#3B82F6',
                    ml: 0.5,
                    verticalAlign: 'middle',
                    animation: 'status-blink 0.8s infinite',
                  }}
                />
              )}
            </Typography>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

            <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 800, letterSpacing: '0.06em', fontFamily: 'JetBrains Mono', display: 'block', mb: 0.5 }}>
              RECOMMENDED DEFENSIVE ACTION:
            </Typography>
            <Typography variant="body2" sx={{ color: '#E2E8F0', lineHeight: 1.6 }}>
              {current.recommendation}
            </Typography>
          </Box>

          {/* Tag Badges */}
          <Box display="flex" gap={1} flexWrap="wrap">
            {current.technicalTags.map((tag, tidx) => (
              <Chip
                key={tidx}
                label={tag}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  color: '#CBD5E1',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.72rem',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Bottom CTA */}
        <Box textAlign="center">
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 900, mb: 2, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
            Experience Raksha AI inside the KAVACH platform.
          </Typography>
          <Typography variant="body1" sx={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#64748B', maxWidth: 600, mx: 'auto', mb: 4 }}>
            Log in to chat directly with Raksha AI regarding your real-time endpoint status, investigate alerts, and execute controlled SOAR playbooks.
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
              py: 1.5,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Launch Raksha AI Copilot
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
export default RakshaAiPage;
