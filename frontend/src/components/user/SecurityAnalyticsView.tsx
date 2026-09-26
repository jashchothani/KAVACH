import React, { useState } from 'react';
import { Box, Typography, Chip, Button, Grid, Stack, LinearProgress } from '@mui/material';
import {
  TrendingUp, Security, Shield, CheckCircle, Warning, Whatshot,
  WorkspacePremium, Star, FilterList, DoneAll, Build
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export const SecurityAnalyticsView: React.FC<{ isDark: boolean; onFixRecommendation?: (rec: string) => void }> = ({
  isDark,
  onFixRecommendation,
}) => {
  const [todoList, setTodoList] = useState([
    { id: 't-1', priority: 'urgent', title: 'Update Google Chrome to v128', desc: 'Addresses 1 high-severity sandbox escape vulnerability', points: '+3 pts' },
    { id: 't-2', priority: 'recommended', title: 'Review persistent microphone permissions', desc: 'Restrict background applications from recording audio', points: '+18 pts' },
    { id: 't-3', priority: 'optional', title: 'Execute full host memory telemetry scan', desc: 'Comprehensive deep inspection of loaded DLL modules', points: '+2 pts' },
  ]);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const scoreTrend = [
    { day: 'Mon', score: 88 },
    { day: 'Tue', score: 89 },
    { day: 'Wed', score: 92 },
    { day: 'Thu', score: 94 },
    { day: 'Fri', score: 97 },
    { day: 'Sat', score: 97 },
    { day: 'Sun', score: 94 },
  ];

  const threatTrend = [
    { name: 'Week 1', blocked: 4, investigated: 1 },
    { name: 'Week 2', blocked: 6, investigated: 2 },
    { name: 'Week 3', blocked: 3, investigated: 0 },
    { name: 'Week 4', blocked: 5, investigated: 1 },
  ];

  const badges = [
    { name: 'First Shield', desc: 'Installed & Armed', unlocked: true },
    { name: '7-Day Protector', desc: 'Continuous Defense', unlocked: true },
    { name: 'Security Ready', desc: '18 Checkpoints Passed', unlocked: true },
    { name: 'Threat Hunter', desc: 'First C2 Intercepted', unlocked: true },
    { name: 'Privacy Guardian', desc: 'Hardened Sensor Audit', unlocked: false },
  ];

  const handleCompleteTodo = (id: string) => {
    setTodoList(prev => prev.filter(item => item.id !== id));
  };

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        bgcolor: cardBg,
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(15,23,42,0.06)',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              bgcolor: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: CR,
            }}
          >
            <TrendingUp sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              Security Analytics & Protection Streak
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Posture Trends, Protection Statistics & Gamified Defense Streaks
            </Typography>
          </Box>
        </Box>

        {/* Feature 22: 14-Day Streak Pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.8,
            borderRadius: 999,
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <Whatshot sx={{ color: WARN, fontSize: 18 }} />
          <Typography sx={{ color: WARN, fontWeight: 800, fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
            🔥 14 DAY PROTECTION STREAK
          </Typography>
        </Box>
      </Box>

      {/* Feature 21: Score History + Streak Badges Bento Row */}
      <Grid container spacing={2.5} mb={3.5}>
        {/* Score Trend 7d */}
        <Grid item xs={12} md={7}>
          <Box sx={{ p: 2.5, borderRadius: 3.5, bgcolor: isDark ? '#12141F' : '#F8FAFC', border: `1px solid ${border}`, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.92rem' }}>
                Security Score (Last 7 Days)
              </Typography>
              <Chip
                label="▲ +6 pts this week"
                size="small"
                sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: SAFE, fontWeight: 800, fontSize: '0.68rem' }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mb: 2 }}>
              Your security posture continuously improved following automated WFP rule hardening.
            </Typography>

            <Box sx={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SAFE} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={SAFE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <XAxis dataKey="day" stroke={isDark ? 'rgba(255,255,255,0.4)' : '#64748B'} fontSize={11} tickLine={false} />
                  <YAxis domain={[75, 100]} stroke={isDark ? 'rgba(255,255,255,0.4)' : '#64748B'} fontSize={11} tickLine={false} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0A0B10' : '#FFFFFF',
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke={SAFE} strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Grid>

        {/* Feature 22: Badges */}
        <Grid item xs={12} md={5}>
          <Box sx={{ p: 2.5, borderRadius: 3.5, bgcolor: isDark ? '#12141F' : '#F8FAFC', border: `1px solid ${border}`, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <WorkspacePremium sx={{ color: '#EAB308', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '0.92rem' }}>
                Protection Badges
              </Typography>
            </Box>

            <Stack spacing={1.2}>
              {badges.map((b, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.2,
                    px: 1.8,
                    borderRadius: 2,
                    bgcolor: b.unlocked ? (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF') : (isDark ? 'rgba(255,255,255,0.01)' : '#F1F5F9'),
                    border: `1px solid ${b.unlocked ? border : 'transparent'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: b.unlocked ? 1 : 0.5,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <Star sx={{ color: b.unlocked ? '#EAB308' : 'text.disabled', fontSize: 18 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
                        {b.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {b.desc}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={b.unlocked ? 'UNLOCKED' : 'LOCKED'}
                    size="small"
                    sx={{
                      fontSize: '0.6rem',
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 800,
                      bgcolor: b.unlocked ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                      color: b.unlocked ? SAFE : 'text.disabled',
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Feature 23: Security Recommendations (To-Do List) */}
      <Box mb={3.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
            Your Security To-Do List ({todoList.length})
          </Typography>
          <Chip label="SORTED BY RISK" size="small" sx={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono' }} />
        </Box>

        {todoList.length === 0 ? (
          <Box display="flex" alignItems="center" gap={1} p={2} bgcolor="rgba(34, 197, 94, 0.08)" borderRadius={2}>
            <CheckCircle sx={{ color: SAFE, fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: SAFE }}>
              All security recommendations are completed! Your device is fully hardened.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {todoList.map((item) => {
              const isUrgent = item.priority === 'urgent';
              const isRecommended = item.priority === 'recommended';

              return (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    px: 2.5,
                    borderRadius: 2.5,
                    bgcolor: isUrgent
                      ? (isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.04)')
                      : cardBg,
                    border: `1px solid ${isUrgent ? 'rgba(220, 38, 38, 0.3)' : border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={item.priority.toUpperCase()}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.62rem',
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 800,
                          bgcolor: isUrgent ? 'rgba(220, 38, 38, 0.15)' : isRecommended ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: isUrgent ? CR : isRecommended ? WARN : '#3B82F6',
                        }}
                      />
                      <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: 'text.primary' }}>
                        {item.title}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.4 }}>
                      {item.desc} • <Box component="span" sx={{ color: SAFE, fontWeight: 700 }}>{item.points}</Box>
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleCompleteTodo(item.id)}
                    startIcon={<Build sx={{ fontSize: 14 }} />}
                    sx={{
                      bgcolor: isUrgent ? CR : '#0B0B0F',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: isUrgent ? '#B91C1C' : '#1E293B' },
                    }}
                  >
                    {isUrgent ? 'Fix Now' : 'Review & Apply'}
                  </Button>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Feature 26: Protection History Monthly Summary */}
      <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? '#12141F' : '#F8FAFC', border: `1px solid ${border}` }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em', mb: 1.5 }}>
          PROTECTION HISTORY // SEPTEMBER 2026
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5, textAlign: 'center' }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }}>
            <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.4rem' }}>18</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 700 }}>THREATS DETECTED</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(34,197,94,0.06)' : '#FFFFFF' }}>
            <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.4rem', color: SAFE }}>14</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: SAFE, fontWeight: 700 }}>AUTONOMOUSLY BLOCKED</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(59,130,246,0.06)' : '#FFFFFF' }}>
            <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.4rem', color: '#3B82F6' }}>4</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#3B82F6', fontWeight: 700 }}>INVESTIGATED</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(34,197,94,0.06)' : '#FFFFFF' }}>
            <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.4rem', color: SAFE }}>0</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: SAFE, fontWeight: 700 }}>ACTIVE BREACHES</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
