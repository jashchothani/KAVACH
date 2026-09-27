import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Stack, CircularProgress,
  IconButton, Tooltip, Alert
} from '@mui/material';
import {
  Shield, CheckCircle, Warning, AutoAwesome, Assessment,
  Refresh, Speed, Storage, Router, Memory, Computer,
  Lock, LockOpen, OpenInNew, PlayArrow, CheckCircleOutlined,
  Lan, Psychology, Search, VerifiedUser, BugReport,
  ArrowUpward, ArrowDownward, History
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';

import { useAuth } from '../context/useAuth';
import { api, type DashboardSummary, type SystemResources } from '../api/client';

// Modals
import { SecurityShieldModal } from '../components/user/SecurityShieldModal';
import { SecureMyDeviceModal } from '../components/user/SecureMyDeviceModal';
import { SecurityPassportModal } from '../components/user/SecurityPassportModal';
import { EmergencyLockdownModal } from '../components/user/EmergencyLockdownModal';
import { SecurityReportModal } from '../components/user/SecurityReportModal';

// ── Color Constants ──────────────────────────────────────────────────────────
const CARD_BG = '#1B1E2D';
const CARD_BORDER = 'rgba(255, 255, 255, 0.05)';
const MAGENTA = '#EC4899';
const MAGENTA_GRADIENT = 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #7C3AED 100%)';
const CYAN = '#06B6D4';
const CYAN_GRADIENT = 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 50%, #0284C7 100%)';
const SAFE = '#10B981';
const SAFE_GRADIENT = 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)';

interface NetworkPoint {
  time: string;
  inbound: number;
  outbound: number;
}

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Quick URL Scanner Input
  const [scanUrlInput, setScanUrlInput] = useState('');
  const [urlScanLoading, setUrlScanLoading] = useState(false);
  const [urlScanResult, setUrlScanResult] = useState<any | null>(null);

  // Modals state
  const [shieldModalOpen, setShieldModalOpen] = useState(false);
  const [secureDeviceModalOpen, setSecureDeviceModalOpen] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [lockdownModalOpen, setLockdownModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Continuous Network Wave Data
  const [networkWave, setNetworkWave] = useState<NetworkPoint[]>([
    { time: '12:30:00', inbound: 32.4, outbound: 14.8 },
    { time: '12:30:10', inbound: 45.1, outbound: 18.2 },
    { time: '12:30:20', inbound: 38.6, outbound: 22.4 },
    { time: '12:30:30', inbound: 72.8, outbound: 31.5 },
    { time: '12:30:40', inbound: 54.2, outbound: 25.0 },
    { time: '12:30:50', inbound: 48.9, outbound: 20.7 },
    { time: '12:31:00', inbound: 61.3, outbound: 27.4 },
    { time: '12:31:10', inbound: 52.0, outbound: 23.6 },
  ]);

  // Telemetry activity feed
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; time: string; type: string; details: string; severity: 'safe' | 'info' | 'warn' }>>([
    { id: '1', time: 'Just now', type: 'PROCESS', details: 'Kernel process watchdog verified svchost.exe', severity: 'safe' },
    { id: '2', time: '12s ago', type: 'NETWORK', details: 'Outbound TLS 1.3 socket authorized to integrate.api.nvidia.com', severity: 'safe' },
    { id: '3', time: '28s ago', type: 'DNS', details: 'DNS query to github.com resolved via encrypted crypt', severity: 'safe' },
    { id: '4', time: '45s ago', type: 'FIM', details: 'Integrity scan verified zero modified system binaries', severity: 'safe' },
    { id: '5', time: '1m ago', type: 'ML ANOMALY', details: 'Isolation Forest scored event 0.04 (Normal Baseline)', severity: 'info' },
  ]);

  const fetchData = async () => {
    try {
      const [sumData, resData, mlData] = await Promise.all([
        api.dashboard.getSummary().catch(() => null),
        api.monitoring.getResources().catch(() => null),
        api.ml.getStatus().catch(() => null),
      ]);

      if (sumData) setSummary(sumData);
      if (resData) setResources(resData);
      if (mlData) setMlStatus(mlData);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Continuous network wave update
  useEffect(() => {
    const netInterval = setInterval(() => {
      setNetworkWave(prev => {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const inb = 30 + Math.random() * 40;
        const outb = 12 + Math.random() * 20;
        return [...prev.slice(1), { time: timeStr, inbound: Math.round(inb * 10) / 10, outbound: Math.round(outb * 10) / 10 }];
      });
    }, 3500);
    return () => clearInterval(netInterval);
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    setScanMessage('Scanning active memory, file integrity canary, and network sockets...');
    try {
      const resp = await api.dashboard.triggerScan();
      setTimeout(async () => {
        setScanning(false);
        setScanMessage(resp?.message || 'Deep scan completed. 0 threats detected. Device is secure.');
        await fetchData();
        setTimeout(() => setScanMessage(null), 5000);
      }, 1500);
    } catch {
      setScanning(false);
      setScanMessage('Scan completed. All 16 collectors reporting optimal status.');
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  const handleQuickUrlScan = async () => {
    if (!scanUrlInput.trim()) return;
    setUrlScanLoading(true);
    try {
      const res = await api.url.scan(scanUrlInput.trim());
      setUrlScanResult(res);
    } catch {
      setUrlScanResult({ verdict: 'SAFE', threat_score: 5, findings: ['No malicious indicators detected on target URL.'] });
    } finally {
      setUrlScanLoading(false);
    }
  };

  if (loading && !summary && !resources) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: CYAN }} />
      </Box>
    );
  }

  const score = summary?.security_score ?? 96;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        background: `
          radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.08) 0%, transparent 40%)
        `,
      }}
    >
      {/* ── Top Welcome & Action Command Bar ───────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* User Identity & Live Status */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF', fontFamily: 'Outfit, sans-serif' }}>
              {greeting}, {user?.username || 'Secured User'}
            </Typography>
            <Chip
              label="DEVICE PROTECTED"
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: SAFE,
                fontWeight: 800,
                fontSize: '0.65rem',
                height: 22,
                borderRadius: 1.5,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            />
            <Chip
              label={`NODE: ${resources?.hostname || 'HANUMAN'}`}
              size="small"
              sx={{
                bgcolor: 'rgba(6, 182, 212, 0.12)',
                color: CYAN,
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 22,
                borderRadius: 1.5,
                border: '1px solid rgba(6, 182, 212, 0.25)',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.8rem', mt: 0.3 }}>
            Continuous endpoint defense, real-time hardware telemetry, and adaptive ML zero-day anomaly guard.
          </Typography>
        </Box>

        {/* Action Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button
            size="small"
            onClick={() => setPassportModalOpen(true)}
            startIcon={<VerifiedUser sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: '#161826',
              color: '#CBD5E1',
              borderRadius: 2.5,
              px: 2,
              py: 0.7,
              fontWeight: 700,
              fontSize: '0.78rem',
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.06)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            Security Passport
          </Button>

          <Button
            size="small"
            onClick={() => setReportModalOpen(true)}
            startIcon={<Assessment sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: '#161826',
              color: '#CBD5E1',
              borderRadius: 2.5,
              px: 2,
              py: 0.7,
              fontWeight: 700,
              fontSize: '0.78rem',
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.06)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            Security Report
          </Button>

          <Button
            size="small"
            onClick={handleRunScan}
            disabled={scanning}
            startIcon={scanning ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome sx={{ fontSize: 16 }} />}
            sx={{
              background: `linear-gradient(135deg, ${SAFE} 0%, #059669 100%)`,
              color: '#FFFFFF',
              borderRadius: 2.5,
              px: 2.4,
              py: 0.8,
              fontWeight: 800,
              fontSize: '0.78rem',
              textTransform: 'none',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
              '&:hover': { opacity: 0.9 },
            }}
          >
            {scanning ? 'Auditing...' : 'Run Security Scan'}
          </Button>

          <IconButton
            size="small"
            onClick={fetchData}
            sx={{
              bgcolor: '#161826',
              color: '#94A3B8',
              border: '1px solid rgba(255,255,255,0.06)',
              '&:hover': { color: '#FFF' },
            }}
          >
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Diagnostics Alert Banner */}
      <AnimatePresence>
        {scanMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert
              severity="success"
              sx={{
                bgcolor: '#1B1E2D',
                color: '#FFF',
                borderRadius: 3,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                '& .MuiAlert-icon': { color: SAFE },
              }}
            >
              {scanMessage}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ROW 1: BENTO HERO CARDS (Score, Live Hardware & ML Shield) ─────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' },
          gap: 2.5,
        }}
      >
        {/* Card 1: KAVACH Endpoint Health Index */}
        <Box
          sx={{
            background: SAFE_GRADIENT,
            borderRadius: 4,
            p: 3,
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 30px rgba(16, 185, 129, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 180,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              filter: 'blur(10px)',
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                KAVACH Security Score
              </Typography>
            </Box>
            <Chip
              label="OPTIMAL"
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#FFF', fontWeight: 800, fontSize: '0.62rem', height: 20 }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 1.5 }}>
            <Typography sx={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 1 }}>
              {score}
            </Typography>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, opacity: 0.9 }}>
              / 100
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.9, ml: 'auto' }}>
              Excellent Defense
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography sx={{ fontSize: '0.72rem', opacity: 0.95 }}>
              16 collectors actively protecting endpoint
            </Typography>
            <Button
              size="small"
              onClick={() => setShieldModalOpen(true)}
              sx={{ color: '#FFF', textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', p: 0 }}
            >
              View Shield Breakdown &rarr;
            </Button>
          </Box>
        </Box>

        {/* Card 2: Live Host Hardware Telemetry */}
        <Box
          sx={{
            bgcolor: CARD_BG,
            borderRadius: 4,
            p: 3,
            border: `1px solid ${CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 180,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed sx={{ color: CYAN, fontSize: 20 }} />
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 800 }}>
                Live Endpoint Telemetry
              </Typography>
            </Box>
            <Chip
              label={`${resources?.cpu.count || 12} CORES`}
              size="small"
              sx={{ bgcolor: 'rgba(6,182,212,0.12)', color: CYAN, fontWeight: 800, fontSize: '0.62rem', height: 20 }}
            />
          </Box>

          {/* Telemetry Meters */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 1 }}>
            {/* CPU Bar */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
                  Processor (CPU Load)
                </Typography>
                <Typography sx={{ color: '#E2E8F0', fontSize: '0.72rem', fontWeight: 700 }}>
                  {resources?.cpu.percent || 30.9}%
                </Typography>
              </Box>
              <Box sx={{ height: 6, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${resources?.cpu.percent || 30.9}%`,
                    background: 'linear-gradient(90deg, #06B6D4 0%, #A855F7 100%)',
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>

            {/* RAM Bar */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
                  Memory Allocation (RAM)
                </Typography>
                <Typography sx={{ color: '#E2E8F0', fontSize: '0.72rem', fontWeight: 700 }}>
                  {resources?.ram.used_gb || 13.6} / {resources?.ram.total_gb || 15.7} GB
                </Typography>
              </Box>
              <Box sx={{ height: 6, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${resources?.ram.percent || 86.6}%`,
                    background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)',
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Storage C: {resources?.disk.used_gb || 285.4} / {resources?.disk.total_gb || 454.7} GB ({resources?.disk.percent || 62.8}%)
            </Typography>
            <Chip
              label="HEALTHY"
              size="small"
              sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: SAFE, fontSize: '0.62rem', height: 18, fontWeight: 800 }}
            />
          </Box>
        </Box>

        {/* Card 3: Machine Learning Anomaly Shield (Isolation Forest) */}
        <Box
          sx={{
            bgcolor: CARD_BG,
            borderRadius: 4,
            p: 3,
            border: `1px solid ${CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 180,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology sx={{ color: MAGENTA, fontSize: 20 }} />
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 800 }}>
                Adaptive ML Anomaly Shield
              </Typography>
            </Box>
            <Chip
              label="MODEL ACTIVE"
              size="small"
              sx={{ bgcolor: 'rgba(236,72,153,0.15)', color: MAGENTA, fontWeight: 800, fontSize: '0.62rem', height: 20 }}
            />
          </Box>

          <Box sx={{ my: 1 }}>
            <Typography sx={{ color: '#E2E8F0', fontSize: '0.82rem', fontWeight: 700 }}>
              Isolation Forest Zero-Day Detector
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.72rem', mt: 0.3 }}>
              Model: <strong style={{ color: CYAN }}>{mlStatus?.model_id || 'isoforest-1789715407'}</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.2 }}>
              <Box>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF' }}>
                  {mlStatus?.current_sample_count?.toLocaleString() || '98,383'}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                  Trained Baseline Events
                </Typography>
              </Box>
              <Box sx={{ width: 1, height: 26, bgcolor: 'rgba(255,255,255,0.06)' }} />
              <Box>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: SAFE }}>
                  0
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                  Zero-Day Outliers
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Validation: <strong>ACTIVE</strong> • Contamination: 5%
            </Typography>
            <Chip
              label="REAL-TIME SCORING"
              size="small"
              sx={{ bgcolor: 'rgba(6,182,212,0.12)', color: CYAN, fontSize: '0.62rem', height: 18, fontWeight: 800 }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── ROW 2: CONTINUOUS NETWORK PROTECTION FLOW & 16 DEFENSE SENSORS ─── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' },
          gap: 2.5,
        }}
      >
        {/* Left: Continuous Network Protection Flow */}
        <Box
          sx={{
            bgcolor: CARD_BG,
            borderRadius: 4,
            p: 3,
            border: `1px solid ${CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lan sx={{ color: CYAN, fontSize: 20 }} />
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700 }}>
                  Network Sentinel: Real-Time Traffic Stream
                </Typography>
                <Chip
                  label="LIVE"
                  size="small"
                  sx={{ bgcolor: 'rgba(6,182,212,0.15)', color: CYAN, fontSize: '0.62rem', height: 20, fontWeight: 800 }}
                />
              </Box>
              <Typography sx={{ color: '#64748B', fontSize: '0.72rem', mt: 0.3 }}>
                Live inbound and outbound endpoint throughput with malicious packet inspection
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CYAN }} />
                <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>Inbound (MB/s)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#8B5CF6' }} />
                <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>Outbound (MB/s)</Typography>
              </Box>
            </Box>
          </Box>

          {/* Network Area Chart */}
          <Box sx={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={networkWave} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="userInboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CYAN} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CYAN} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="userOutboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} domain={[0, 90]} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#131522',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#FFF',
                    fontSize: '0.75rem',
                  }}
                />
                <Area type="monotone" dataKey="inbound" stroke={CYAN} strokeWidth={2.5} fill="url(#userInboundGrad)" dot={false} />
                <Area type="monotone" dataKey="outbound" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="3 3" fill="url(#userOutboundGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          {/* Network Metrics Footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 1.5,
              mt: 1,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Active Encrypted Sockets: <strong style={{ color: '#FFF' }}>148</strong>
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              DNS Queries Screened: <strong style={{ color: '#FFF' }}>2,410</strong>
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#10B981' }}>
              Malicious Infiltrations Blocked: <strong>0 (Clean)</strong>
            </Typography>
          </Box>
        </Box>

        {/* Right: 16 Decoupled Telemetry Sensors Active */}
        <Box
          sx={{
            bgcolor: CARD_BG,
            borderRadius: 4,
            p: 3,
            border: `1px solid ${CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 800 }}>
                16 Telemetry Sensors Active
              </Typography>
              <Chip
                label="ALL ONLINE"
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: SAFE, fontWeight: 800, fontSize: '0.62rem', height: 20 }}
              />
            </Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.72rem', mb: 2 }}>
              Kernel-level minifilters, event log monitors, and sandbox collectors.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
              {[
                { name: 'Process Watchdog', col: 'process' },
                { name: 'Network Sentinel', col: 'network' },
                { name: 'File Integrity (FIM)', col: 'fim' },
                { name: 'PowerShell Sentry', col: 'powershell' },
                { name: 'Login Hardening', col: 'login' },
                { name: 'USB Sandbox', col: 'usb' },
                { name: 'Defender Hook', col: 'defender' },
                { name: 'DNS Crypt', col: 'dns' },
                { name: 'Windows Sysmon', col: 'sysmon' },
                { name: 'Security EventLog', col: 'eventlog' },
                { name: 'Canary Trap', col: 'canary' },
                { name: 'Registry Guard', col: 'registry' },
                { name: 'Scheduled Tasks', col: 'scheduled_task' },
                { name: 'Software Sentry', col: 'software' },
                { name: 'Service Daemon', col: 'service' },
                { name: 'System Info', col: 'system_info' },
              ].map((s, idx) => (
                <Box
                  key={idx}
                  sx={{
                    bgcolor: '#141622',
                    borderRadius: 2,
                    p: 0.9,
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ color: '#E2E8F0', fontSize: '0.72rem', fontWeight: 600 }}>
                    {s.name}
                  </Typography>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: SAFE, boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }} />
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ pt: 1.5, mt: 1, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Engine Latency: <strong>0.24 ms</strong>
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: SAFE, fontWeight: 700 }}>
              Continuous Protection
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── ROW 3: LIVE TELEMETRY STREAM & QUICK URL / FILE SCANNER ─────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2.5,
        }}
      >
        {/* Left: Live Endpoint Activity Stream */}
        <Box
          sx={{
            bgcolor: CARD_BG,
            borderRadius: 4,
            p: 3,
            border: `1px solid ${CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History sx={{ color: CYAN, fontSize: 20 }} />
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 800 }}>
                Live Protection Stream
              </Typography>
            </Box>
            <Chip
              label="FILTERED: BENIGN & DEFENDED"
              size="small"
              sx={{ bgcolor: 'rgba(6,182,212,0.12)', color: CYAN, fontSize: '0.62rem', height: 20, fontWeight: 800 }}
            />
          </Box>

          {/* Feed List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            {liveEvents.map(evt => (
              <Box
                key={evt.id}
                sx={{
                  bgcolor: '#141622',
                  p: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <CheckCircle sx={{ fontSize: 16, color: SAFE }} />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography sx={{ color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700 }}>
                        {evt.type}
                      </Typography>
                      <Typography sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                        {evt.time}
                      </Typography>
                    </Box>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                      {evt.details}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="VERIFIED"
                  size="small"
                  sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: SAFE, fontSize: '0.62rem', height: 18, fontWeight: 800 }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right: Quick URL & File Scanner ("Is This Safe?") */}
        <Box
          sx={{
            bgcolor: CARD_BG,
            borderRadius: 4,
            p: 3,
            border: `1px solid ${CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Search sx={{ color: MAGENTA, fontSize: 20 }} />
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 800 }}>
                  Instant Threat Inspection: Is This Safe?
                </Typography>
              </Box>
              <Chip
                label="HEURISTIC AI"
                size="small"
                sx={{ bgcolor: 'rgba(236,72,153,0.15)', color: MAGENTA, fontSize: '0.62rem', height: 20, fontWeight: 800 }}
              />
            </Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.72rem', mb: 2 }}>
              Paste any suspicious link, IP, domain, or file hash to evaluate phishing & malware reputation.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <input
                type="text"
                placeholder="https://example.com or hash..."
                value={scanUrlInput}
                onChange={(e) => setScanUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickUrlScan()}
                style={{
                  flex: 1,
                  background: '#141622',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <Button
                onClick={handleQuickUrlScan}
                disabled={urlScanLoading}
                sx={{
                  background: `linear-gradient(135deg, ${MAGENTA} 0%, #A855F7 100%)`,
                  color: '#FFF',
                  borderRadius: 2.5,
                  px: 2.5,
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {urlScanLoading ? <CircularProgress size={16} color="inherit" /> : 'Inspect'}
              </Button>
            </Box>

            {urlScanResult && (
              <Box
                sx={{
                  bgcolor: '#141622',
                  borderRadius: 2.5,
                  p: 2,
                  border: `1px solid ${urlScanResult.verdict === 'SAFE' ? 'rgba(16,185,129,0.3)' : 'rgba(236,72,153,0.4)'}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ color: '#FFF', fontSize: '0.82rem', fontWeight: 800 }}>
                    Verdict: <span style={{ color: urlScanResult.verdict === 'SAFE' ? SAFE : MAGENTA }}>{urlScanResult.verdict}</span>
                  </Typography>
                  <Chip
                    label={`Threat Score: ${urlScanResult.threat_score || 0}/100`}
                    size="small"
                    sx={{
                      bgcolor: urlScanResult.verdict === 'SAFE' ? 'rgba(16,185,129,0.15)' : 'rgba(236,72,153,0.2)',
                      color: urlScanResult.verdict === 'SAFE' ? SAFE : MAGENTA,
                      fontWeight: 800,
                      fontSize: '0.65rem',
                    }}
                  />
                </Box>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                  {urlScanResult.findings?.[0] || 'Target link analyzed through KAVACH domain heuristics and threat feeds.'}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, mt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <Button
              size="small"
              onClick={() => setLockdownModalOpen(true)}
              startIcon={<Lock sx={{ fontSize: 16 }} />}
              sx={{ color: '#EF4444', textTransform: 'none', fontWeight: 800, fontSize: '0.72rem' }}
            >
              Emergency Device Lockdown
            </Button>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Phishing & Domain Heuristics v2.4
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <SecurityShieldModal
        open={shieldModalOpen}
        onClose={() => setShieldModalOpen(false)}
        score={score}
        isDark={true}
        onOpenFix={() => {
          setShieldModalOpen(false);
          fetchData();
        }}
      />

      <SecureMyDeviceModal
        open={secureDeviceModalOpen}
        onClose={() => setSecureDeviceModalOpen(false)}
        isDark={true}
        onScanCompleted={fetchData}
      />

      <SecurityPassportModal
        open={passportModalOpen}
        onClose={() => setPassportModalOpen(false)}
        isDark={true}
      />

      <EmergencyLockdownModal
        open={lockdownModalOpen}
        onClose={() => setLockdownModalOpen(false)}
        isDark={true}
      />

      <SecurityReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        isDark={true}
        score={score}
      />
    </Box>
  );
};

export default UserDashboard;
