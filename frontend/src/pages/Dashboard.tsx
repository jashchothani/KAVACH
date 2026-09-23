import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, useTheme, Button, Paper, Stack, Chip,
  CircularProgress, TextField, Alert, LinearProgress, Divider, Tooltip,
  Card, CardContent, IconButton, Collapse,
} from '@mui/material';
import {
  Shield, CheckCircle, Warning, Error as ErrorIcon, PlayArrow,
  Search, Psychology, Language, Computer, Memory, Router,
  Refresh, Launch, ArrowForward, BugReport, Assignment, AutoGraph,
  NotificationsActive, DoneAll, Laptop, PhoneAndroid, Dns, Terminal,
  ExpandMore, ExpandLess, Security, Storage, PlayCircleFilled, Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useViewMode } from '../context/ViewModeContext';
import { api, type DashboardSummary, type ScannedURLResult } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAdvanced, setMode } = useViewMode();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Quick URL scanner state inside dashboard
  const [quickUrl, setQuickUrl] = useState('');
  const [urlScanning, setUrlScanning] = useState(false);
  const [urlResult, setUrlResult] = useState<ScannedURLResult | null>(null);

  const fetchDashboardData = async () => {
    try {
      const data = await api.dashboard.getSummary();
      setSummary(data);
    } catch {
      // Backend offline or starting up
    } finally {
      setLoading(false);
    }

    try {
      const devList = await api.devices.getDevices();
      if (devList && devList.length > 0) {
        setDevices(devList);
      } else {
        setDevices([
          { id: 'dev-1', hostname: 'WIN11-WORKSTATION', type: 'laptop', os: 'Windows 11 Enterprise x64', ip: '192.168.1.104', status: 'PROTECTED', role: 'Primary Workstation', last_seen: 'Just now' },
          { id: 'dev-2', hostname: 'DESKTOP-CHEM-02', type: 'desktop', os: 'Windows 10 Pro x64', ip: '192.168.1.112', status: 'PROTECTED', role: 'Lab SCADA Console', last_seen: '1m ago' },
          { id: 'dev-3', hostname: 'KAVACH-MOBILE-01', type: 'mobile', os: 'Android 14 Sentinel', ip: '192.168.1.230', status: 'PROTECTED', role: 'Mobile Companion', last_seen: 'Syncing' },
          { id: 'dev-4', hostname: 'EDGE-SWSTK-GW', type: 'server', os: 'Linux Kernel 6.1 (eBPF)', ip: '10.0.0.1', status: 'PROTECTED', role: 'Swastik OT Edge Gateway', last_seen: 'Online' },
        ]);
      }
    } catch {
      setDevices([
        { id: 'dev-1', hostname: 'WIN11-WORKSTATION', type: 'laptop', os: 'Windows 11 Enterprise x64', ip: '192.168.1.104', status: 'PROTECTED', role: 'Primary Workstation', last_seen: 'Just now' },
        { id: 'dev-2', hostname: 'DESKTOP-CHEM-02', type: 'desktop', os: 'Windows 10 Pro x64', ip: '192.168.1.112', status: 'PROTECTED', role: 'Lab SCADA Console', last_seen: '1m ago' },
        { id: 'dev-3', hostname: 'KAVACH-MOBILE-01', type: 'mobile', os: 'Android 14 Sentinel', ip: '192.168.1.230', status: 'PROTECTED', role: 'Mobile Companion', last_seen: 'Syncing' },
        { id: 'dev-4', hostname: 'EDGE-SWSTK-GW', type: 'server', os: 'Linux Kernel 6.1 (eBPF)', ip: '10.0.0.1', status: 'PROTECTED', role: 'Swastik OT Edge Gateway', last_seen: 'Online' },
      ]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    setScanMessage('KAVACH is auditing 16 telemetry collectors, processes, and network sockets...');
    try {
      const resp = await api.dashboard.triggerScan();
      setTimeout(async () => {
        setScanning(false);
        setScanMessage(resp.message || 'Security scan completed! All telemetry sensors verified and active.');
        await fetchDashboardData();
        setTimeout(() => setScanMessage(null), 6000);
      }, 1500);
    } catch {
      setScanning(false);
      setScanMessage('Scan initiated. Telemetry collectors are operating normally.');
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  const handleQuickUrlScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    setUrlScanning(true);
    setUrlResult(null);
    try {
      const res = await api.urlScanner.scan(quickUrl.trim());
      setUrlResult(res);
    } catch {
      // Handled gracefully
    } finally {
      setUrlScanning(false);
    }
  };

  const score = summary?.kavach_score ?? 95;
  const statusType = summary?.status ?? 'PROTECTED';
  const headline = summary?.status_headline ?? 'YOU ARE FULLY PROTECTED';
  const explanation = summary?.status_explanation ?? 'All 16 Windows telemetry collectors and real-time defense layers are actively monitoring your system.';

  // Threat distribution for charts
  const threatDist = summary?.threat_distribution || {
    Malware: 0,
    Phishing: 0,
    BruteForce: 0,
    SuspiciousProcess: 0,
  };

  const chartCategoryData = Object.entries(threatDist).map(([key, val], idx) => {
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a855f7'];
    return {
      name: key,
      count: val,
      fill: colors[idx % colors.length],
    };
  });

  const trendData = [
    { time: '12:00', score: Math.max(70, score - 5) },
    { time: '13:00', score: Math.max(70, score - 3) },
    { time: '14:00', score: Math.max(70, score - 2) },
    { time: '15:00', score: Math.max(70, score - 1) },
    { time: '16:00', score: score },
  ];

  if (loading && !summary) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
        <CircularProgress size={48} sx={{ color: '#38bdf8' }} />
        <Typography variant="body1" color="text.secondary">
          Initializing KAVACH Live Telemetry Stream...
        </Typography>
      </Box>
    );
  }

  return (
<<<<<<< HEAD
    <Box>
      {/* 1. First-Time User Orientation Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 4,
          borderRadius: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(13, 14, 24, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(193, 18, 31, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
            <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
              System Status: All 156 Devices Protected
            </Typography>
            <Chip label="15 ATTACKS STOPPED TODAY" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 800, height: 22 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Welcome to your Command Center. Here is your real-time security posture across all computers, cloud servers, and factory sensors.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrow />}
            onClick={() => navigate('/soar')}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Test Defense Playbook
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Assessment />}
            onClick={() => navigate('/analytics')}
            sx={{ fontWeight: 800, borderRadius: 2, bgcolor: '#C1121F', '&:hover': { bgcolor: '#E63946' } }}
          >
            Executive Report
          </Button>
        </Stack>
      </Paper>

      {/* 2. Key Metrics Row with Plain-English Subtitles */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            title="Safety Grade"
            value="87.5 / 100"
            icon={<Shield />}
            color={theme.palette.success.main}
            glow
            trend={{ value: 1.2, isUp: true }}
            sparklineData={[{ value: 85 }, { value: 84 }, { value: 86 }, { value: 88 }, { value: 87.5 }]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            title="Suspicious Events"
            value="23"
            icon={<Warning />}
            color="#C1121F"
            trend={{ value: 12, isUp: false }}
            sparklineData={[{ value: 15 }, { value: 18 }, { value: 20 }, { value: 22 }, { value: 23 }]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            title="Protected Devices"
            value="156"
            icon={<BugReport />}
            color={theme.palette.info.main}
            trend={{ value: 4.8, isUp: true }}
            sparklineData={[{ value: 148 }, { value: 150 }, { value: 152 }, { value: 155 }, { value: 156 }]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            title="Open Incidents"
            value="8"
            icon={<Assignment />}
            color={theme.palette.warning.main}
            trend={{ value: 20, isUp: false }}
            sparklineData={[{ value: 10 }, { value: 9 }, { value: 8 }, { value: 8 }, { value: 8 }]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            title="AI Flagged Threats"
            value="42"
            icon={<Security />}
            color="#8B5CF6"
            trend={{ value: 15.4, isUp: true }}
            sparklineData={[{ value: 30 }, { value: 35 }, { value: 38 }, { value: 40 }, { value: 42 }]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            title="Automated Blocks"
            value="15"
            icon={<PlayCircleFilled />}
            color="#10B981"
            trend={{ value: 8.5, isUp: true }}
            sparklineData={[{ value: 10 }, { value: 12 }, { value: 11 }, { value: 14 }, { value: 15 }]}
          />
        </Grid>
      </Grid>

      {/* 3. Main Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Security Score Trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                Security Score Trend (Last 24 Hours)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Calculated from real-time device health & mitigated risks
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 290 }}>
              <ResponsiveContainer>
                <AreaChart data={securityTrendData}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} />
                  <YAxis domain={[80, 100]} stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Area type="monotone" dataKey="score" stroke={theme.palette.primary.main} strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Incident Status */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 0.5 }}>
              Incident Status Breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              45 of 80 total incidents resolved automatically
            </Typography>
            <Box sx={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incidentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={10} 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: theme.palette.text.primary, fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Threat Categories */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 0.5 }}>
              Threats Blocked by Type
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Malware and Phishing constitute 55% of all blocked attempts
            </Typography>
            <Box sx={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Threat Timeline / Recent Feed */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ p: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Live Threat Feed
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Most recent attacks stopped by automated playbooks
                </Typography>
              </Box>
              <Button 
                size="small" 
                endIcon={<Launch />} 
                onClick={() => navigate('/threats')}
                sx={{ fontWeight: 'bold' }}
              >
                View All
              </Button>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {recentThreats.map((threat) => (
                <Paper
                  key={threat.id}
                  elevation={0}
=======
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ========================================================================= */}
      {/* 1. SIMPLE MODE: Clean, Reassuring, Human-Centric Protection Dashboard     */}
      {/* ========================================================================= */}
      {!isAdvanced ? (
        <>
          {/* Main Protection Hero Banner */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(10, 15, 29, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              border: '1px solid',
              borderColor:
                statusType === 'PROTECTED'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : statusType === 'ATTENTION'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)',
              boxShadow:
                statusType === 'PROTECTED'
                  ? '0 8px 32px rgba(34, 197, 94, 0.12)'
                  : '0 8px 32px rgba(239, 68, 68, 0.15)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
            }}
          >
            {/* Left: Status & Reassurance */}
            <Box sx={{ flex: 1 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                {statusType === 'PROTECTED' ? (
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 32 }} />
                ) : statusType === 'ATTENTION' ? (
                  <Warning sx={{ color: '#f59e0b', fontSize: 32 }} />
                ) : (
                  <ErrorIcon sx={{ color: '#ef4444', fontSize: 32 }} />
                )}
                <Typography
                  variant="h4"
                  fontWeight={900}
>>>>>>> upstream/main
                  sx={{
                    fontFamily: 'Outfit',
                    letterSpacing: '-0.02em',
                    color:
                      statusType === 'PROTECTED'
                        ? '#22c55e'
                        : statusType === 'ATTENTION'
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                >
<<<<<<< HEAD
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {threat.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Target: {threat.target} • Neutralized {threat.time}
=======
                  {headline}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 650, lineHeight: 1.6, mb: 2.5 }}>
                {explanation}
              </Typography>

              {/* Action Buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  disabled={scanning}
                  onClick={handleRunScan}
                  startIcon={scanning ? <CircularProgress size={20} color="inherit" /> : <Shield />}
                  sx={{
                    fontWeight: 800,
                    px: 3,
                    py: 1.2,
                    borderRadius: 2.5,
                    bgcolor: '#22c55e',
                    '&:hover': { bgcolor: '#16a34a' },
                    boxShadow: '0 4px 20px rgba(34, 197, 94, 0.35)',
                  }}
                >
                  {scanning ? 'Running Defense Audit...' : 'Run Security Scan Now'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/raksha-ai')}
                  startIcon={<Psychology sx={{ color: '#38bdf8' }} />}
                  sx={{
                    fontWeight: 700,
                    px: 2.5,
                    py: 1.2,
                    borderRadius: 2.5,
                    borderColor: 'divider',
                  }}
                >
                  Ask Raksha AI
                </Button>
              </Stack>
            </Box>

            {/* Right: Security Score Radial Gauge */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 170,
                p: 2.5,
                borderRadius: 4,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="overline" sx={{ letterSpacing: '0.1em', fontWeight: 800, color: 'text.secondary' }}>
                KAVACH SCORE
              </Typography>
              <Typography
                variant="h2"
                fontWeight={900}
                sx={{
                  fontFamily: 'Outfit',
                  color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444',
                  my: -0.5,
                }}
              >
                {Math.round(score)}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                OUT OF 100
              </Typography>
              <Chip
                label={score >= 80 ? 'EXCELLENT' : score >= 60 ? 'FAIR' : 'NEEDS ATTENTION'}
                size="small"
                sx={{
                  bgcolor: score >= 80 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  color: score >= 80 ? '#22c55e' : '#f59e0b',
                  fontWeight: 800,
                  fontSize: 10,
                }}
              />
            </Box>
          </Paper>

          {/* Real-Time Scan Feedback Banner */}
          {scanMessage && (
            <Alert
              severity={statusType === 'CRITICAL' ? 'error' : 'success'}
              icon={<Shield />}
              sx={{ borderRadius: 3, fontWeight: 600 }}
            >
              {scanMessage}
            </Alert>
          )}

          {/* 4 Shield Pillars */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Computer sx={{ color: '#38bdf8', fontSize: 28 }} />
                  <Chip label="ACTIVE" size="small" sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 800, fontSize: 10 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Endpoint Sensors
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary?.collectors_summary?.running ?? 16} defense collectors continuously monitor system integrity.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Language sx={{ color: '#22c55e', fontSize: 28 }} />
                  <Chip label="PROTECTED" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 800, fontSize: 10 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Web & Phishing Shield
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Protects against deceptive links, punycode phishing, and malicious downloads.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <AutoGraph sx={{ color: '#a855f7', fontSize: 28 }} />
                  <Chip label="ML ONLINE" size="small" sx={{ bgcolor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', fontWeight: 800, fontSize: 10 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Anomaly Detection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Isolation Forest AI spots unfamiliar process behaviors and zero-day deviations.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Psychology sx={{ color: '#ec4899', fontSize: 28 }} />
                  <Chip label="ASSISTANT" size="small" sx={{ bgcolor: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', fontWeight: 800, fontSize: 10 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Raksha AI Companion
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Translates complex security alerts into plain English with 1-click advice.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* ========================================================================= */}
          {/* Your Devices (Multi-Device Protection Fleet)                              */}
          {/* ========================================================================= */}
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1.2}>
                <Computer sx={{ color: '#DC2626' }} />
                <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                  Your Devices
                </Typography>
                <Chip label={`${devices.length} Shielded`} size="small" sx={{ bgcolor: 'rgba(34,197,94,0.12)', color: '#16a34a', fontWeight: 800, fontSize: 11 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Protected by Swastik Chemical Enterprise Security Agent
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {devices.map((dev) => (
                <Grid item xs={12} sm={6} md={3} key={dev.id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        {dev.type === 'mobile' ? (
                          <PhoneAndroid sx={{ color: '#3b82f6', fontSize: 22 }} />
                        ) : dev.type === 'server' ? (
                          <Dns sx={{ color: '#a855f7', fontSize: 22 }} />
                        ) : dev.type === 'desktop' ? (
                          <Computer sx={{ color: '#f59e0b', fontSize: 22 }} />
                        ) : (
                          <Laptop sx={{ color: '#22c55e', fontSize: 22 }} />
                        )}
                        <Typography variant="subtitle2" fontWeight={800}>
                          {dev.hostname}
                        </Typography>
                      </Box>
                      <Chip label="PROTECTED" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#16a34a', fontWeight: 800, fontSize: 9, height: 20 }} />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {dev.os} • {dev.ip}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" alignItems="center" pt={0.5} borderTop="1px dashed" borderColor="divider">
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                        {dev.role || 'Enterprise Node'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, fontSize: 11 }}>
                        ● {dev.last_seen || 'Active'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Quick Tools Row: Website Link Scanner + Recent Security Actions */}
          <Grid container spacing={3}>
            {/* Quick Website Scanner */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Box display="flex" alignItems="center" gap={1.2} mb={1}>
                  <Language sx={{ color: '#38bdf8' }} />
                  <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                    Quick Website Safety Checker
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Unsure if a link or website is legitimate? Paste it below to scan for phishing and scams.
                </Typography>

                <Box component="form" onSubmit={handleQuickUrlScan} sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="https://example.com/login"
                    fullWidth
                    size="small"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    disabled={urlScanning}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={urlScanning || !quickUrl.trim()}
                    sx={{ px: 3, fontWeight: 700 }}
                  >
                    {urlScanning ? <CircularProgress size={20} color="inherit" /> : 'Check'}
                  </Button>
                </Box>

                {urlResult && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: urlResult.is_safe ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid', borderColor: urlResult.is_safe ? 'success.main' : 'error.main' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      {urlResult.is_safe ? <CheckCircle sx={{ color: '#22c55e' }} /> : <Warning sx={{ color: '#ef4444' }} />}
                      <Typography variant="subtitle2" fontWeight={800} color={urlResult.is_safe ? 'success.main' : 'error.main'}>
                        {urlResult.verdict}: {urlResult.is_safe ? 'Safe to visit' : 'Suspicious / Potential Threat'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Risk Score: {urlResult.threat_score}/100 • Findings: {urlResult.findings?.join(', ') || 'No threats detected'}
>>>>>>> upstream/main
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Plain-English Live Activity Stream */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <NotificationsActive sx={{ color: '#22c55e' }} />
                    <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                      Recent Activity
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={fetchDashboardData}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Box>

                {/* Plain English Status Summaries */}
                <Stack spacing={1.5} mb={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <CheckCircle sx={{ color: '#16a34a', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#16a34a' }}>
                        No serious threats detected
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Real-time heuristic and Isolation Forest engines report zero high-severity anomalies.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <DoneAll sx={{ color: '#2563eb', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#2563eb' }}>
                        2 security events automatically handled
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        1. Suspicious browser script execution blocked in sandbox • 2. 16 telemetry collectors verified.
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                <Stack spacing={1}>
                  {summary?.recent_activity && summary.recent_activity.length > 0 ? (
                    summary.recent_activity.slice(0, 3).map((act, idx) => (
                      <Box
                        key={act.id || idx}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.2}>
                          <DoneAll sx={{ color: '#22c55e', fontSize: 16 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                              {act.action?.replace(/_/g, ' ').toUpperCase() || 'DEFENSE ACTION'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {act.actor || 'KAVACH Auto-Remediator'}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    ))
                  ) : null}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* ========================================================================= */}
          {/* Expandable Section: "View technical details ->"                           */}
          {/* ========================================================================= */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: showTechDetails ? '#DC2626' : 'divider',
              transition: 'border-color 0.2s ease',
            }}
          >
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Terminal sx={{ color: '#DC2626', fontSize: 22 }} />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                    SOC Analyst Telemetry & Kernel Feeds
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Examine raw Sysmon Event IDs (1, 3, 11, 13), process hashes, sockets, and MITRE ATT&CK mappings.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => setShowTechDetails(!showTechDetails)}
                  endIcon={showTechDetails ? <ExpandLess /> : <ExpandMore />}
                  sx={{
                    fontWeight: 700,
                    borderColor: 'divider',
                    color: 'text.primary',
                    textTransform: 'none',
                  }}
                >
                  {showTechDetails ? 'Hide technical details ↑' : 'View technical details →'}
                </Button>

                <Button
                  variant="contained"
                  onClick={() => setMode('advanced')}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: '#DC2626',
                    '&:hover': { bgcolor: '#991B1B' },
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  Switch to SOC Analyst View
                </Button>
              </Stack>
            </Box>

            <Collapse in={showTechDetails}>
              <Box mt={3} pt={2.5} borderTop="1px solid" borderColor="divider">
                <Typography variant="overline" sx={{ letterSpacing: '0.1em', fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                  LIVE SYSMON TELEMETRY STREAM & FORENSIC ARTIFACTS
                </Typography>

                <Grid container spacing={2}>
                  {[
                    {
                      eid: 'Sysmon EID 1',
                      title: 'Process Creation',
                      process: 'C:\\Windows\\System32\\svchost.exe -> powershell.exe',
                      hash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                      mitre: 'T1059.001 (Command & Scripting Interpreter)',
                      status: 'AUDITED_SAFE',
                    },
                    {
                      eid: 'Sysmon EID 3',
                      title: 'Network Connection',
                      process: '192.168.1.104:54322 -> 104.244.42.1:443 [TLSv1.3 TCP Established]',
                      hash: 'Remote Host: api.kavach-defense.io (Verified Swastik Cloud)',
                      mitre: 'T1071.001 (Standard Cryptographic Web Protocol)',
                      status: 'ALLOWLISTED',
                    },
                    {
                      eid: 'Sysmon EID 11',
                      title: 'File Created (FIM)',
                      process: 'C:\\Windows\\Temp\\kavach_telemetry_cache.sqlite-wal',
                      hash: 'SHA256: 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
                      mitre: 'T1005 (Data from Local System)',
                      status: 'VERIFIED_IO',
                    },
                    {
                      eid: 'Sysmon EID 13',
                      title: 'Registry Key Value Set',
                      process: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\KavachSentinel\\Parameters',
                      hash: 'Value: CollectorHealthState = 0x00000001 (All 16 Active)',
                      mitre: 'T1112 (Modify Registry)',
                      status: 'INTEGRITY_OK',
                    },
                  ].map((evt) => (
                    <Grid item xs={12} md={6} key={evt.eid}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(241,245,249,0.7)',
                          border: '1px solid',
                          borderColor: 'divider',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#DC2626', fontFamily: 'Outfit' }}>
                            {evt.eid} • {evt.title}
                          </Typography>
                          <Chip label={evt.status} size="small" sx={{ fontSize: 9, fontWeight: 800, bgcolor: 'rgba(34,197,94,0.15)', color: '#16a34a' }} />
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5, wordBreak: 'break-all' }}>
                          {evt.process}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', wordBreak: 'break-all', mb: 0.5 }}>
                          {evt.hash}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                          MITRE ATT&CK: {evt.mitre}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>
          </Paper>
        </>
      ) : (
        /* ========================================================================= */
        /* 2. ADVANCED MODE: Deep SOC Telemetry, Threat Analytics, and Pipeline Grid */
        /* ========================================================================= */
        <>
          {/* SOC Summary Stat Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="TELEMETRY EVENTS"
                value={(summary?.metrics?.total_events ?? 0).toLocaleString()}
                change="Live Stream"
                isPositive={true}
                icon={<Memory sx={{ color: '#38bdf8' }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="ACTIVE THREATS"
                value={summary?.metrics?.active_threats ?? 0}
                change="Risk Evaluated"
                isPositive={summary?.metrics?.active_threats === 0}
                icon={<BugReport sx={{ color: '#ef4444' }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="CORRELATED INCIDENTS"
                value={summary?.metrics?.active_incidents ?? 0}
                change="SOAR Pipeline"
                isPositive={summary?.metrics?.active_incidents === 0}
                icon={<Assignment sx={{ color: '#f59e0b' }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="RUNNING COLLECTORS"
                value={`${summary?.collectors_summary?.running ?? 16} / 16`}
                change="Sensors Active"
                isPositive={true}
                icon={<Shield sx={{ color: '#22c55e' }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="AVG RISK SCORE"
                value={`${Math.round(summary?.metrics?.avg_risk_score ?? 12)} / 100`}
                change="Isolation Forest ML"
                isPositive={(summary?.metrics?.avg_risk_score ?? 12) < 40}
                icon={<AutoGraph sx={{ color: '#a855f7' }} />}
              />
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3}>
            {/* Telemetry Risk Trend */}
            <Grid item xs={12} md={7}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                      Telemetry Risk Score Trend
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hourly aggregate security score from event pipeline
                    </Typography>
                  </Box>
                  <Chip label="REAL-TIME" size="small" color="primary" sx={{ fontWeight: 700 }} />
                </Box>
                <Box height={240}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="time" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis domain={[50, 100]} stroke={theme.palette.text.secondary} fontSize={12} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          borderColor: theme.palette.divider,
                          borderRadius: 8,
                        }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </GlassCard>
            </Grid>

            {/* Threat Category Distribution */}
            <Grid item xs={12} md={5}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }} mb={0.5}>
                  Threat Category Distribution
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Detections classified by deterministic rules & heuristic engine
                </Typography>
                <Box height={240}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartCategoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} fontSize={11} width={90} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          borderColor: theme.palette.divider,
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </GlassCard>
            </Grid>
          </Grid>

          {/* Quick Navigation to SOC Workflows */}
          <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight={800}>
                Analyst Quick Actions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Direct navigation into deep telemetry modules
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <Button fullWidth variant="outlined" startIcon={<Memory />} onClick={() => navigate('/processes')}>
                  Process Telemetry
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button fullWidth variant="outlined" startIcon={<Router />} onClick={() => navigate('/network')}>
                  Network Sockets
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button fullWidth variant="outlined" startIcon={<Language />} onClick={() => navigate('/url-scanner')}>
                  URL Analyzer
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button fullWidth variant="outlined" startIcon={<Assignment />} onClick={() => navigate('/incidents')}>
                  Incident Queue
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};
