import React, { useState } from 'react';
import {
  Box, Typography, Chip, Button, Grid, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Stack, LinearProgress
} from '@mui/material';
import {
  Laptop, PhoneAndroid, Computer, CheckCircle, Warning, MoreVert,
  Memory, Router, Storage, Shield, Update, CleaningServices, Close, Build
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export interface DeviceData {
  id: string;
  name: string;
  type: 'laptop' | 'phone' | 'desktop';
  score: number;
  status: 'protected' | 'attention';
  online: boolean;
  lastSeen: string;
  os: string;
  ip: string;
  user: string;
  threatCount: number;
  hardware: {
    cpu: string;
    ram: string;
    storage: string;
    hostname: string;
  };
  security: {
    defender: string;
    firewall: string;
    updates: string;
    antivirus: string;
  };
}

const DEVICES: DeviceData[] = [
  {
    id: 'dev-1',
    name: 'Jash Laptop',
    type: 'laptop',
    score: 94,
    status: 'protected',
    online: true,
    lastSeen: 'Just now',
    os: 'Windows 11 Enterprise (23H2)',
    ip: '192.168.1.104',
    user: 'Jash Chothani',
    threatCount: 0,
    hardware: {
      cpu: 'Intel Core i7-13700H @ 2.40GHz',
      ram: '32 GB DDR5',
      storage: '1 TB NVMe SSD (420 GB free)',
      hostname: 'SWSTK-LPT-0492',
    },
    security: {
      defender: 'Active & Cloud-delivered',
      firewall: 'Active (Hardened WFP rules)',
      updates: '1 Pending Patch (Chrome)',
      antivirus: 'KAVACH Sovereign Real-Time Engine',
    },
  },
  {
    id: 'dev-2',
    name: 'Primary Phone',
    type: 'phone',
    score: 91,
    status: 'protected',
    online: true,
    lastSeen: '5m ago',
    os: 'Android 14 (Security Patch Sep 2026)',
    ip: '192.168.1.230',
    user: 'Jash Chothani',
    threatCount: 0,
    hardware: {
      cpu: 'Snapdragon 8 Gen 3',
      ram: '12 GB LPDDR5X',
      storage: '256 GB UFS 4.0 (140 GB free)',
      hostname: 'KAVACH-MOB-01',
    },
    security: {
      defender: 'Play Protect & KAVACH Shield',
      firewall: 'Always-on VPN Tunnel Active',
      updates: 'Up to Date',
      antivirus: 'App Sandbox Verified',
    },
  },
  {
    id: 'dev-3',
    name: 'Lab SCADA Desktop',
    type: 'desktop',
    score: 72,
    status: 'attention',
    online: false,
    lastSeen: '2 hours ago',
    os: 'Windows 10 Pro x64 (22H2)',
    ip: '192.168.1.112',
    user: 'Operator Swastik',
    threatCount: 2,
    hardware: {
      cpu: 'AMD Ryzen 5 5600G',
      ram: '16 GB DDR4',
      storage: '512 GB SSD (80 GB free)',
      hostname: 'DESKTOP-CHEM-02',
    },
    security: {
      defender: 'Needs Signature Update',
      firewall: 'Active',
      updates: '2 Critical Patches Pending',
      antivirus: 'KAVACH Kernel Hook Degraded',
    },
  },
];

const CLEANUP_ITEMS = [
  { id: 'cl-1', title: 'Outdated Application: Chrome v127', desc: 'Google Chrome requires update to resolve CVE-2026-7911', impact: '+3 pts score recovery', type: 'update' },
  { id: 'cl-2', title: 'Unused Startup Program: QuickPrintHelper', desc: 'Runs on Windows boot but has not been invoked in 45 days', impact: 'Reduces boot latency by 1.8s', type: 'startup' },
  { id: 'cl-3', title: 'Weak Security Config: LLMNR Resolution', desc: 'Link-Local Multicast Name Resolution enabled on subnet', impact: 'Prevents rogue relay attacks', type: 'config' },
  { id: 'cl-4', title: 'Unusual Scheduled Task: CleanTempDaily', desc: 'Triggers unverified batch script in C:\\Windows\\Temp', impact: 'Removes unauthorized persistence', type: 'task' },
];

export const MyDevicesView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [cleanupList, setCleanupList] = useState(CLEANUP_ITEMS);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const handleFixCleanup = (id: string) => {
    setCleanupList(prev => prev.filter(item => item.id !== id));
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'phone': return <PhoneAndroid sx={{ fontSize: 28 }} />;
      case 'desktop': return <Computer sx={{ fontSize: 28 }} />;
      default: return <Laptop sx={{ fontSize: 28 }} />;
    }
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
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SAFE,
            }}
          >
            <Laptop sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              My Devices
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Device Health, Telemetry Status & Hardware Profiles
            </Typography>
          </Box>
        </Box>

        <Chip
          label="3 Devices Enrolled"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${border}`,
          }}
        />
      </Box>

      {/* Devices Cards Grid */}
      <Grid container spacing={2.5} mb={4}>
        {DEVICES.map((dev) => {
          const isSafe = dev.status === 'protected';
          return (
            <Grid item xs={12} md={4} key={dev.id}>
              <Box
                onClick={() => setSelectedDevice(dev)}
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  bgcolor: isDark ? '#12141F' : '#F8FAFC',
                  border: `1px solid ${border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: isSafe ? SAFE : WARN,
                    boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.5)' : '0 8px 24px rgba(15,23,42,0.08)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      border: `1px solid ${border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSafe ? SAFE : WARN,
                    }}
                  >
                    {getDeviceIcon(dev.type)}
                  </Box>
                  <Box textAlign="right">
                    <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.4rem', color: isSafe ? SAFE : WARN, lineHeight: 1 }}>
                      {dev.score}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700 }}>
                      / 100
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary', mb: 0.5 }}>
                  {dev.name}
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mb: 2 }}>
                  {dev.os}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.5} borderTop={`1px solid ${border}`}>
                  <Box display="flex" alignItems="center" gap={0.8}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dev.online ? SAFE : 'text.disabled' }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: dev.online ? SAFE : 'text.disabled' }}>
                      {dev.online ? 'Online' : 'Offline'}
                    </Typography>
                  </Box>

                  <Chip
                    label={dev.status === 'protected' ? 'PROTECTED' : 'ATTENTION'}
                    size="small"
                    sx={{
                      fontSize: '0.62rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 800,
                      bgcolor: dev.status === 'protected' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: dev.status === 'protected' ? SAFE : WARN,
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Feature 12: Device Cleanup Recommendations */}
      <Box
        sx={{
          p: 3,
          borderRadius: 3.5,
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FDFCFB',
          border: `1px solid ${border}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <CleaningServices sx={{ color: '#EAB308', fontSize: 22 }} />
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.98rem' }}>
              Device Cleanup & Hardening Recommendations
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              KAVACH found {cleanupList.length} items that may require attention. (Never auto-deletes without consent).
            </Typography>
          </Box>
        </Box>

        {cleanupList.length === 0 ? (
          <Box display="flex" alignItems="center" gap={1} p={2} bgcolor="rgba(34, 197, 94, 0.08)" borderRadius={2}>
            <CheckCircle sx={{ color: SAFE, fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: SAFE }}>
              All device cleanup recommendations have been resolved!
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {cleanupList.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 1.8,
                  px: 2.2,
                  borderRadius: 2.5,
                  bgcolor: cardBg,
                  border: `1px solid ${border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.primary' }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.2 }}>
                    {item.desc} &nbsp;•&nbsp; <Box component="span" sx={{ color: SAFE, fontWeight: 700 }}>{item.impact}</Box>
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleFixCleanup(item.id)}
                  startIcon={<Build sx={{ fontSize: 14 }} />}
                  sx={{
                    bgcolor: CR,
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#B91C1C' },
                  }}
                >
                  Fix
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Feature 11: Device Details Modal */}
      <Dialog
        open={Boolean(selectedDevice)}
        onClose={() => setSelectedDevice(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDark ? '#0A0B10' : '#FFFFFF',
            border: `1px solid ${border}`,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            {selectedDevice && getDeviceIcon(selectedDevice.type)}
            <Box>
              <Typography sx={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.15rem' }}>
                {selectedDevice?.name} Details
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Hostname: {selectedDevice?.hardware.hostname} • IP: {selectedDevice?.ip}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedDevice(null)} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              mb: 3,
              borderBottom: `1px solid ${border}`,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.85rem' },
            }}
          >
            <Tab label="Hardware Overview" />
            <Tab label="Security Defenses" />
            <Tab label="Active Collectors" />
          </Tabs>

          {activeTab === 0 && selectedDevice && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}` }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800 }}>PROCESSOR</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, mt: 0.4 }}>{selectedDevice.hardware.cpu}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}` }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800 }}>MEMORY</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, mt: 0.4 }}>{selectedDevice.hardware.ram}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}` }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800 }}>PRIMARY STORAGE</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, mt: 0.4 }}>{selectedDevice.hardware.storage}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}` }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800 }}>OPERATING SYSTEM</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, mt: 0.4 }}>{selectedDevice.os}</Typography>
              </Box>
            </Box>
          )}

          {activeTab === 1 && selectedDevice && (
            <Stack spacing={1.5}>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Windows Defender Shield</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{selectedDevice.security.defender}</Typography>
                </Box>
                <Chip label="ACTIVE" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: SAFE, fontWeight: 800, fontSize: '0.65rem' }} />
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>WFP Firewall Subsystem</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{selectedDevice.security.firewall}</Typography>
                </Box>
                <Chip label="HARDENED" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: SAFE, fontWeight: 800, fontSize: '0.65rem' }} />
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>System Updates</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{selectedDevice.security.updates}</Typography>
                </Box>
                <Chip label="REVIEW" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: WARN, fontWeight: 800, fontSize: '0.65rem' }} />
              </Box>
            </Stack>
          )}

          {activeTab === 2 && (
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${border}` }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 1.5 }}>
                16 Passive telemetry engines observing ring-0 and network events:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {['Sysmon', 'Process Watcher', 'WFP Network Filter', 'FIM Integrity', 'USB Watchdog', 'DNS Crypt', 'PowerShell Block', 'Kernel Hooks'].map((c, i) => (
                  <Chip key={i} label={`✓ ${c}`} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(34, 197, 94, 0.08)', color: SAFE }} />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setSelectedDevice(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
