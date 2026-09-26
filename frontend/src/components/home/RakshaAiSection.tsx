import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowForward, SmartToy, Shield, Bolt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';

const CR = '#DC2626';

const ChatBubble: React.FC<{ isUser?: boolean; isDark: boolean; children: React.ReactNode }> = ({ isUser, isDark, children }) => (
  <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: isUser ? 'row-reverse' : 'row' }}>
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: 2,
        flexShrink: 0,
        bgcolor: isUser ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'rgba(220,38,38,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isUser
          ? (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)')
          : '1px solid rgba(220,38,38,0.3)',
      }}
    >
      {isUser ? (
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>U</Typography>
      ) : (
        <SmartToy sx={{ fontSize: 18, color: CR }} />
      )}
    </Box>
    <Box sx={{ flexGrow: 1, pt: 0.5, pr: isUser ? 0 : 4, pl: isUser ? 4 : 0 }}>
      {children}
    </Box>
  </Box>
);

const ThreatFinding: React.FC<{ title: string; desc: string; isDark: boolean; isHighRisk?: boolean }> = ({ title, desc, isDark, isHighRisk }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: isDark ? '#11131A' : '#FFFFFF',
      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
      boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
      mb: 2,
      display: 'flex',
      gap: 2,
    }}
  >
    <Box sx={{ pt: 0.5 }}>
      {isHighRisk ? <Bolt sx={{ color: CR, fontSize: 18 }} /> : <Shield sx={{ color: '#3B82F6', fontSize: 18 }} />}
    </Box>
    <Box>
      <Typography sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F', fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', fontSize: '0.8rem', lineHeight: 1.4 }}>
        {desc}
      </Typography>
    </Box>
  </Box>
);

export const RakshaAiSection: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Box sx={{ position: 'relative', py: { xs: 12, md: 20 }, bgcolor: 'transparent', overflow: 'hidden' }}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'center', gap: { xs: 8, lg: 6 } }}>
          
          {/* LEFT: Text */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '0 0 40%' } }}>
            <Typography sx={{ color: CR, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', mb: 2, fontFamily: 'JetBrains Mono, monospace' }}>
              MEET RAKSHA AI COPILOT
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: isDark ? '#FFFFFF' : '#0B0B0F',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                mb: 3,
              }}
            >
              Your cybersecurity<br />
              copilot, always ready.
            </Typography>
            <Typography
              sx={{
                color: isDark ? 'rgba(255,255,255,0.65)' : '#475569',
                fontSize: '1.2rem',
                lineHeight: 1.6,
                mb: 5,
                maxWidth: 480,
              }}
            >
              Raksha AI correlates millions of events and explains complex security incidents in plain English. Ask questions, investigate anomalies, and execute playbooks instantly.
            </Typography>
            
            <Button
              onClick={() => { navigate('/raksha-ai'); window.scrollTo(0, 0); }}
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              sx={{
                color: isDark ? '#FFFFFF' : '#0B0B0F',
                fontWeight: 800,
                fontSize: '1rem',
                fontFamily: 'Outfit, sans-serif',
                px: 0,
                py: 1,
                textTransform: 'none',
                borderBottom: `2px solid ${CR}`,
                borderRadius: 0,
                '&:hover': { background: 'transparent', color: CR },
                transition: 'all 0.2s',
              }}
            >
              Explore Raksha AI
            </Button>
          </Box>

          {/* RIGHT: Product Mockup */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '0 0 60%' }, width: '100%' }}>
            <Box
              sx={{
                borderRadius: 4,
                bgcolor: isDark ? '#0A0B0F' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: isDark
                  ? '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 24px 60px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: isDark ? '#11131A' : '#F8FAFC',
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SmartToy sx={{ color: CR, fontSize: 20 }} />
                  <Typography
                    sx={{
                      color: isDark ? '#FFFFFF' : '#0B0B0F',
                      fontWeight: 800,
                      fontFamily: 'Outfit, sans-serif',
                      letterSpacing: '0.05em',
                      fontSize: '0.9rem',
                    }}
                  >
                    RAKSHA AI // LIVE SESSION
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E' }} />
                  <Typography sx={{ color: '#22C55E', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 800 }}>
                    ACTIVE
                  </Typography>
                </Box>
              </Box>

              {/* Chat Area */}
              <Box sx={{ p: { xs: 3, md: 5 }, bgcolor: isDark ? '#08080C' : '#F1F5F9' }}>
                <ChatBubble isUser isDark={isDark}>
                  <Typography
                    sx={{
                      color: isDark ? '#FFFFFF' : '#0B0B0F',
                      fontSize: '0.95rem',
                      bgcolor: isDark ? '#11131A' : '#FFFFFF',
                      p: 2,
                      borderRadius: 2,
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                      boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'inline-block',
                    }}
                  >
                    What happened today?
                  </Typography>
                </ChatBubble>

                <ChatBubble isDark={isDark}>
                  <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.85)' : '#334155', fontSize: '0.95rem', mb: 3, lineHeight: 1.6 }}>
                    I found several security events that require your attention. I have automatically correlated them into an incident based on anomalous behavioral patterns.
                  </Typography>
                  
                  <ThreatFinding 
                    isHighRisk
                    isDark={isDark}
                    title="Suspicious PowerShell execution"
                    desc="Encoded command spawned from winword.exe on endpoint DESKTOP-X94B."
                  />
                  <ThreatFinding 
                    isDark={isDark}
                    title="Network anomaly"
                    desc="Outbound connection to untrusted ASN directly following the script execution."
                  />

                  <Button
                    sx={{
                      mt: 2,
                      bgcolor: 'rgba(220,38,38,0.1)',
                      color: CR,
                      fontWeight: 800,
                      px: 3,
                      py: 1,
                      border: `1px solid rgba(220,38,38,0.3)`,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontFamily: 'Outfit, sans-serif',
                      '&:hover': { bgcolor: 'rgba(220,38,38,0.2)' },
                    }}
                  >
                    Investigate Incident
                  </Button>
                </ChatBubble>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
