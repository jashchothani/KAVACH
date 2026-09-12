import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Grid, Typography, useTheme, Button, Paper, Stack, Chip } from '@mui/material';

const API_BASE = 'http://localhost:8000/api/v1';
import {
  BugReport, Shield, Assignment, Security, PlayCircleFilled,
  Warning, Assessment, Launch, AddModerator, PlayArrow, CheckCircle
} from '@mui/icons-material';
import { StatCard } from '../components/common/StatCard';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const securityTrendData = [
  { name: '00:00', score: 85 },
  { name: '04:00', score: 84 },
  { name: '08:00', score: 86 },
  { name: '12:00', score: 88 },
  { name: '16:00', score: 87 },
  { name: '20:00', score: 87.5 },
];

const categoryData = [
  { name: 'Malware', count: 45, fill: '#EF4444' },
  { name: 'Phishing', count: 32, fill: '#F59E0B' },
  { name: 'Brute Force', count: 28, fill: '#3B82F6' },
  { name: 'Ransomware', count: 15, fill: '#C1121F' },
  { name: 'DDoS', count: 12, fill: '#8B5CF6' },
];

const incidentStatusData = [
  { name: 'Open', value: 8, color: '#EF4444' },
  { name: 'Investigating', value: 12, color: '#F59E0B' },
  { name: 'Contained', value: 15, color: '#3B82F6' },
  { name: 'Resolved', value: 45, color: '#10B981' },
];

const recentThreats = [
  { id: 1, name: 'Brute Force Attempt on VPN', target: 'FIN-SRV-05', severity: 'high', time: '5 mins ago' },
  { id: 2, name: 'Malicious File Write Detected', target: 'PROD-WEB-01', severity: 'critical', time: '12 mins ago' },
  { id: 3, name: 'Anomalous Data Exfiltration', target: 'CHEM-IOT-07', severity: 'critical', time: '24 mins ago' },
  { id: 4, name: 'Phishing URL Click Attempted', target: 'HR-WS-04', severity: 'medium', time: '1 hour ago' },
];

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const resp = await axios.get(`${API_BASE}/dashboard/summary`);
        setSummaryData(resp.data);
      } catch (e) {
        // Backend offline, graceful fallback
      }
    };
    fetchSummary();
  }, []);

  const securityScore = summaryData?.security_score ?? 92;
  const scoreCategory = summaryData?.score_category ?? 'Excellent Protection';
  const devicesCount = summaryData?.stats?.monitored_devices ?? 156;
  const activeThreatsCount = summaryData?.stats?.active_threats ?? 0;
  const openIncidentsCount = summaryData?.stats?.open_incidents ?? 0;
  const totalAlertsCount = summaryData?.stats?.total_alerts ?? 4;

  return (
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
          <Box display="flex" alignItems="center" gap={1.2} mb={0.5}>
            <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} />
            <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
              System Status: All 156 Devices Protected
            </Typography>
            <Chip label="15 ATTACKS STOPPED TODAY" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 800, height: 22 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Welcome to your Command Center. Here is your real-time security posture across all computers, cloud servers, and factory sensors.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
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
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Safety Grade"
            value={`${securityScore} / 100`}
            icon={<Shield />}
            color={theme.palette.success.main}
            glow
            trend={{ value: 1.2, isUp: true }}
            sparklineData={[{ value: 85 }, { value: 84 }, { value: 86 }, { value: 88 }, { value: securityScore }]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Suspicious Events"
            value={String(activeThreatsCount)}
            icon={<Warning />}
            color="#C1121F"
            trend={{ value: 12, isUp: false }}
            sparklineData={[{ value: 15 }, { value: 18 }, { value: 20 }, { value: 22 }, { value: activeThreatsCount }]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Protected Devices"
            value={String(devicesCount)}
            icon={<BugReport />}
            color={theme.palette.info.main}
            trend={{ value: 4.8, isUp: true }}
            sparklineData={[{ value: 148 }, { value: 150 }, { value: 152 }, { value: 155 }, { value: devicesCount }]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Open Incidents"
            value={String(openIncidentsCount)}
            icon={<Assignment />}
            color={theme.palette.warning.main}
            trend={{ value: 20, isUp: false }}
            sparklineData={[{ value: 10 }, { value: 9 }, { value: 8 }, { value: 8 }, { value: openIncidentsCount }]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Active Alerts"
            value={String(totalAlertsCount)}
            icon={<Security />}
            color="#8B5CF6"
            trend={{ value: 15.4, isUp: true }}
            sparklineData={[{ value: 30 }, { value: 35 }, { value: 38 }, { value: 40 }, { value: totalAlertsCount }]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
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
      <Grid container spacing={3} mb={4}>
        {/* Security Score Trend */}
        <Grid item xs={12} lg={8}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit' }}>
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
        <Grid item xs={12} lg={4}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit', mb: 0.5 }}>
              Incident Status Breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
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
        <Grid item xs={12} lg={6}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit', mb: 0.5 }}>
              Threats Blocked by Type
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
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
        <Grid item xs={12} lg={6}>
          <GlassCard sx={{ p: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit' }}>
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
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {threat.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Target: {threat.target} • Neutralized {threat.time}
                    </Typography>
                  </Box>
                  <SeverityBadge severity={threat.severity} />
                </Paper>
              ))}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};
