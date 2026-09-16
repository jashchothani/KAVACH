import React, { useState } from 'react';
import {
  Box, Typography, Paper, Chip, Stack, Button, useTheme, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, LinearProgress,
} from '@mui/material';
import {
  Shield, CheckCircle, Warning, Error as ErrorIcon, Computer,
  PhoneIphone, Laptop, Security, Memory, Notifications, Settings,
  Check, Refresh, PlayArrow, Storage, CloudDownload, Terminal,
  Speed, BugReport, DoneAll, Lock, Assignment, AutoGraph,
} from '@mui/icons-material';

export const ProductShowcaseSection: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState<'normal' | 'soc' | 'desktop' | 'collector' | 'mobile'>('normal');

  return (
    <Box id="features" sx={{ py: { xs: 8, md: 12 }, position: 'relative' }}>
      {/* Section Header */}
      <Box textAlign="center" maxWidth={750} mx="auto" mb={{ xs: 4, md: 6 }}>
        <Chip
          label="COMPLETE ECOSYSTEM"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.75rem',
            bgcolor: 'rgba(220, 38, 38, 0.08)',
            color: '#DC2626',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            mb: 1.5,
          }}
        />
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            fontFamily: 'Outfit',
            letterSpacing: '-0.02em',
            fontSize: { xs: '2rem', md: '2.8rem' },
            color: 'text.primary',
            mb: 1.5,
          }}
        >
          One Security Platform.{' '}
          <Box component="span" sx={{ color: '#DC2626' }}>
            Everywhere You Need It.
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '1.05rem' }}>
          Explore real KAVACH interfaces tailored for everyday employees, security analysts, native Windows desktop environments, and mobile fleets.
        </Typography>
      </Box>

      {/* Interactive Tabs Row */}
      <Box display="flex" justifyContent="center" mb={4} px={2}>
        <Paper
          elevation={0}
          sx={{
            p: 0.8,
            borderRadius: 3.5,
            bgcolor: isDark ? '#111827' : '#F1F5F9',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226, 232, 240, 0.9)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.8,
            maxWidth: '100%',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'normal', label: '1. Normal User Dashboard' },
            { id: 'soc', label: '2. SOC Analyst Dashboard' },
            { id: 'desktop', label: '3. Desktop Application' },
            { id: 'collector', label: '4. Windows Collector' },
            { id: 'mobile', label: '5. Mobile Application' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                sx={{
                  px: { xs: 1.5, sm: 2.5 },
                  py: 1,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', sm: '0.88rem' },
                  textTransform: 'none',
                  bgcolor: isSelected ? (isDark ? '#DC2626' : '#FFFFFF') : 'transparent',
                  color: isSelected
                    ? (isDark ? '#FFFFFF' : '#DC2626')
                    : 'text.secondary',
                  boxShadow: isSelected && !isDark ? '0 2px 10px rgba(15, 23, 42, 0.08)' : 'none',
                  border: isSelected && !isDark ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: isSelected ? (isDark ? '#B91C1C' : '#FFFFFF') : 'rgba(15, 23, 42, 0.04)',
                  },
                  transition: 'all 0.18s ease',
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Paper>
      </Box>

      {/* ========================================================================= */}
      {/* 1. NORMAL USER DASHBOARD PREVIEW                                          */}
      {/* ========================================================================= */}
      {activeTab === 'normal' && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: 480,
            bgcolor: '#FFFFFF',
          }}
        >
          {/* Normal Mode Mock Sidebar */}
          <Box
            sx={{
              width: { xs: '100%', md: 220 },
              bgcolor: isDark ? '#0A0F1D' : '#F8FAFC',
              p: 2.5,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Shield sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
                KAVACH
              </Typography>
            </Box>

            {[
              { label: 'Dashboard', active: true },
              { label: 'My Devices', active: false },
              { label: 'Security Events', active: false },
              { label: 'Alerts', active: false },
              { label: 'Settings', active: false },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  px: 1.8,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: item.active ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                  color: item.active ? '#DC2626' : 'text.secondary',
                  fontWeight: item.active ? 800 : 500,
                  fontSize: '0.85rem',
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>

          {/* Normal Mode Main Workspace */}
          <Box sx={{ flex: 1, p: { xs: 2.5, sm: 3.5 }, bgcolor: isDark ? '#0F172A' : '#FFFFFF' }}>
            {/* Status Card */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                mb: 3,
              }}
            >
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CheckCircle sx={{ fontSize: 36 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: '#16a34a', fontFamily: 'Outfit' }}>
                  Your Device is Protected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No critical threats detected. All 16 defense collectors are active and protecting your system.
                </Typography>
              </Box>
            </Paper>

            {/* Metric Pills */}
            <Grid container spacing={2} mb={3}>
              {[
                { label: 'Protected Devices', val: '2 Devices', color: '#0284c7' },
                { label: 'Security Events Audited', val: '12 Events', color: '#64748b' },
                { label: 'Critical Alerts', val: '0 Alerts', color: '#16a34a' },
                { label: 'Protection Status', val: '100% Secure', color: '#16a34a' },
              ].map((m) => (
                <Grid item xs={6} sm={3} key={m.label}>
                  <Box p={2} borderRadius={2.5} border="1px solid" borderColor="divider" bgcolor={isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {m.label}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: m.color, mt: 0.2 }}>
                      {m.val}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Plain English Activity Feed */}
            <Typography variant="subtitle2" fontWeight={800} mb={1.5}>
              Recent Activity
            </Typography>
            <Stack spacing={1}>
              {[
                { icon: <Check sx={{ color: '#16a34a', fontSize: 18 }} />, title: 'System scan completed', desc: '16 background collectors reported zero anomalies' },
                { icon: <Check sx={{ color: '#16a34a', fontSize: 18 }} />, title: 'Device connected', desc: 'WIN11-WORKSTATION enrolled with active agent' },
                { icon: <Warning sx={{ color: '#f59e0b', fontSize: 18 }} />, title: 'Suspicious application blocked', desc: 'Untrusted PowerShell execution quarantined in sandbox' },
                { icon: <Check sx={{ color: '#16a34a', fontSize: 18 }} />, title: 'Software updated', desc: 'KAVACH telemetry rules updated to build 2026.4' },
              ].map((act, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1.5} p={1.5} borderRadius={2} bgcolor={isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'} border="1px solid" borderColor="divider">
                  {act.icon}
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {act.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {act.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* 2. SOC ANALYST DASHBOARD PREVIEW                                          */}
      {/* ========================================================================= */}
      {activeTab === 'soc' && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: 480,
            bgcolor: '#FFFFFF',
          }}
        >
          {/* Navy Professional SOC Sidebar */}
          <Box
            sx={{
              width: { xs: '100%', md: 240 },
              bgcolor: '#0F172A',
              color: '#FFFFFF',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Terminal sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={900} sx={{ fontFamily: 'Outfit', color: '#FFFFFF' }}>
                SOC Command
              </Typography>
            </Box>

            {[
              { label: 'Live Telemetry', active: true },
              { label: 'MITRE ATT&CK Matrix', active: false },
              { label: 'Process Hierarchy', active: false },
              { label: 'SOAR Playbooks', active: false },
              { label: 'Merkle Audit Vault', active: false },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  px: 1.8,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: item.active ? 'rgba(220, 38, 38, 0.25)' : 'transparent',
                  color: item.active ? '#FCA5A5' : 'rgba(255,255,255,0.7)',
                  fontWeight: item.active ? 800 : 500,
                  fontSize: '0.85rem',
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>

          {/* Clean Light SOC Main Workspace */}
          <Box sx={{ flex: 1, p: { xs: 2.5, sm: 3.5 }, bgcolor: isDark ? '#0A0F1D' : '#FFFFFF' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                  Security Operations Center (SOC)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time kernel telemetry, Isolation Forest anomaly alerts, and DAG playbooks
                </Typography>
              </Box>
              <Chip label="DAG Engine: <12ms" size="small" sx={{ bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontWeight: 800 }} />
            </Box>

            {/* SOC Metric Stat Grid */}
            <Grid container spacing={1.5} mb={2.5}>
              {[
                { title: 'TOTAL EVENTS', val: '1,428,910', color: '#0284c7' },
                { title: 'ACTIVE ALERTS', val: '3 Open', color: '#f59e0b' },
                { title: 'CRITICAL EVENTS', val: '0 Critical', color: '#16a34a' },
                { title: 'HIGH SEVERITY', val: '2 Blocked', color: '#DC2626' },
              ].map((s) => (
                <Grid item xs={6} sm={3} key={s.title}>
                  <Box p={1.5} borderRadius={2} border="1px solid" borderColor="divider" bgcolor={isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {s.title}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: s.color }}>
                      {s.val}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Recent Security Events Table */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
              RECENT SECURITY EVENTS
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>TIME</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>SEVERITY</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>DEVICE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>EVENT TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>DESCRIPTION</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { time: '14:22:01', sev: 'HIGH', dev: 'WIN11-WKSTN', type: 'Sysmon EID 1', desc: 'powershell.exe -Enc Execution', status: 'QUARANTINED' },
                    { time: '14:21:45', sev: 'MEDIUM', dev: 'DESKTOP-CHEM', type: 'Sysmon EID 3', desc: 'Outbound TCP 8443 beacon', status: 'NULL-ROUTED' },
                    { time: '14:19:12', sev: 'LOW', dev: 'EDGE-GW', type: 'Sysmon EID 11', desc: 'Audit log written to Merkle', status: 'VERIFIED' },
                  ].map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{row.time}</TableCell>
                      <TableCell>
                        <Chip label={row.sev} size="small" sx={{ fontSize: 9, fontWeight: 800, height: 18, bgcolor: row.sev === 'HIGH' ? 'rgba(220,38,38,0.12)' : 'rgba(245,158,11,0.12)', color: row.sev === 'HIGH' ? '#DC2626' : '#d97706' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{row.dev}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{row.type}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.desc}</TableCell>
                      <TableCell>
                        <Chip label={row.status} size="small" sx={{ fontSize: 9, fontWeight: 800, height: 18, bgcolor: 'rgba(34,197,94,0.12)', color: '#16a34a' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* 3. DESKTOP APPLICATION PREVIEW                                            */}
      {/* ========================================================================= */}
      {activeTab === 'desktop' && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#CBD5E1',
            boxShadow: '0 25px 50px -15px rgba(15, 23, 42, 0.12)',
            bgcolor: '#FFFFFF',
            maxWidth: 750,
            mx: 'auto',
          }}
        >
          {/* Windows-Style Title Bar */}
          <Box
            sx={{
              bgcolor: isDark ? '#1E293B' : '#F1F5F9',
              px: 2,
              py: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Shield sx={{ color: '#DC2626', fontSize: 18 }} />
              <Typography variant="caption" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                KAVACH Endpoint Sentinel (64-bit Windows Agent)
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#94a3b8' }} />
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#94a3b8' }} />
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
            </Stack>
          </Box>

          {/* Desktop App Body */}
          <Box p={3} bgcolor={isDark ? '#0F172A' : '#FFFFFF'}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
                  PROTECTED
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Native Windows Kernel Driver • Swastik Chemical Enterprise Fleet
                </Typography>
              </Box>
              <Chip label="Agent Online" color="success" size="small" sx={{ fontWeight: 800 }} />
            </Box>

            <Grid container spacing={2} mb={2.5}>
              {[
                { label: 'Collector Engine', val: 'Running (16 Sensors Active)' },
                { label: 'Connection Status', val: 'Online (WebSocket Push)' },
                { label: 'Last Cloud Sync', val: '2 min ago' },
                { label: 'Defense Layer', val: 'Active Boundary Shield' },
              ].map((info) => (
                <Grid item xs={6} key={info.label}>
                  <Box p={1.5} borderRadius={2} bgcolor={isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'} border="1px solid" borderColor="divider">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {info.label}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                      {info.val}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Device Health Progress */}
            <Box p={2} borderRadius={2} border="1px solid" borderColor="divider" mb={2.5}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" fontWeight={700}>Sensor Resource Footprint</Typography>
                <Typography variant="caption" fontWeight={700} color="success.main">CPU 0.4% • RAM 38 MB</Typography>
              </Box>
              <LinearProgress variant="determinate" value={18} sx={{ height: 6, borderRadius: 1 }} />
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" size="small" sx={{ bgcolor: '#DC2626', fontWeight: 700, '&:hover': { bgcolor: '#B91C1C' } }}>
                Run Local Audit
              </Button>
              <Button variant="outlined" size="small" sx={{ fontWeight: 700 }}>
                Quarantine Vault (0 Files)
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* 4. WINDOWS COLLECTOR INSTALLER PREVIEW                                    */}
      {/* ========================================================================= */}
      {activeTab === 'collector' && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#CBD5E1',
            boxShadow: '0 25px 50px -15px rgba(15, 23, 42, 0.12)',
            bgcolor: '#FFFFFF',
            maxWidth: 580,
            mx: 'auto',
          }}
        >
          {/* UAC-Style Header */}
          <Box sx={{ bgcolor: '#0F172A', color: '#fff', p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Shield sx={{ color: '#DC2626', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit', color: '#FFFFFF' }}>
                KAVACH Collector Setup
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Protect your Windows device with enterprise telemetry
              </Typography>
            </Box>
          </Box>

          <Box p={3.5} bgcolor={isDark ? '#0F172A' : '#FFFFFF'}>
            <Typography variant="subtitle2" fontWeight={800} mb={2}>
              Deployment Pipeline Steps:
            </Typography>

            <Stack spacing={1.5} mb={3}>
              {[
                { step: '1. Install Collector', desc: 'Registers Windows Event Log & Sysmon background service' },
                { step: '2. Connect Device', desc: 'Authenticates with Swastik Chemical tenant token' },
                { step: '3. Enable Protection', desc: 'Activates real-time socket and eBPF kernel hooks' },
                { step: '4. Start Monitoring', desc: 'Streams sub-12ms event logs to central console' },
              ].map((s, idx) => (
                <Box key={idx} display="flex" alignItems="center" gap={1.5} p={1.5} borderRadius={2} bgcolor={isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'} border="1px solid" borderColor="divider">
                  <CheckCircle sx={{ color: '#16a34a', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{s.step}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Shield />}
              sx={{
                bgcolor: '#DC2626',
                py: 1.4,
                fontWeight: 800,
                borderRadius: 2.5,
                '&:hover': { bgcolor: '#B91C1C' },
              }}
            >
              Install — Requires Administrator (UAC)
            </Button>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* 5. MOBILE APP PREVIEW                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'mobile' && (
        <Grid container spacing={3} justifyContent="center">
          {/* Mobile Screen 1: Status */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 5,
                overflow: 'hidden',
                border: '8px solid #0F172A',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15)',
                bgcolor: '#FFFFFF',
                maxWidth: 280,
                mx: 'auto',
              }}
            >
              <Box p={2.5} textAlign="center" bgcolor="#F8FAFC">
                <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', mx: 'auto', mb: 1 }}>
                  <Shield sx={{ fontSize: 34 }} />
                </Box>
                <Typography variant="h6" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
                  You're Protected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  No critical threats detected.
                </Typography>
              </Box>
              <Box p={2} display="flex" flexDirection="column" gap={1.2}>
                <Box p={1.2} borderRadius={2} border="1px solid" borderColor="divider">
                  <Typography variant="caption" fontWeight={700} color="text.secondary">DEVICES</Typography>
                  <Typography variant="body2" fontWeight={800}>2 Devices Monitored</Typography>
                </Box>
                <Box p={1.2} borderRadius={2} border="1px solid" borderColor="divider">
                  <Typography variant="caption" fontWeight={700} color="text.secondary">ALERTS</Typography>
                  <Typography variant="body2" fontWeight={800} color="success.main">0 Active Threats</Typography>
                </Box>
                <Box p={1.2} borderRadius={2} border="1px solid" borderColor="divider">
                  <Typography variant="caption" fontWeight={700} color="text.secondary">RECENT ACTIVITY</Typography>
                  <Typography variant="caption" display="block">WiFi Audit: WPA3 Secure</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Mobile Screen 2: Push Alert Notification */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 5,
                overflow: 'hidden',
                border: '8px solid #0F172A',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15)',
                bgcolor: '#FFFFFF',
                maxWidth: 280,
                mx: 'auto',
              }}
            >
              <Box p={2.5} bgcolor="#0F172A" color="#fff">
                <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 800 }}>KAVACH NOTIFICATIONS</Typography>
                <Typography variant="subtitle1" fontWeight={800}>Security Alert</Typography>
              </Box>
              <Box p={2} display="flex" flexDirection="column" gap={1.5}>
                <Box p={1.5} borderRadius={2} bgcolor="rgba(220, 38, 38, 0.06)" border="1px solid rgba(220,38,38,0.25)">
                  <Typography variant="caption" color="error.main" fontWeight={800}>SUSPICIOUS LOGIN ATTEMPT</Typography>
                  <Typography variant="body2" fontWeight={700} mt={0.5}>Office IP: 45.33.32.156</Typography>
                  <Typography variant="caption" color="text.secondary">Blocked via 1-click push defense.</Typography>
                </Box>
                <Button fullWidth variant="contained" size="small" sx={{ bgcolor: '#DC2626', fontWeight: 700 }}>
                  Acknowledge & Shield
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
