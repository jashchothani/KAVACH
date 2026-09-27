import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, Stack, Paper, IconButton,
  Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Divider, MenuItem, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  VisibilityOff, Shield, Warning, CheckCircle, Add,
  PlayArrow, Refresh, Computer, InsertDriveFile, Language,
  AppRegistration, VpnKey, Bolt, Memory, Speed, Close,
  FileDownload, DeleteOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  api, type DecoyItem, type TripwireEvent, type DeceptionOverview
} from '../api/client';
import { useThemeMode } from '../context/ThemeContext';

const CR = '#DC2626';
const WARN = '#F59E0B';
const SAFE = '#22C55E';
const CYAN = '#06B6D4';
const PURPLE = '#8B5CF6';

const getDecoyIcon = (type: DecoyItem['decoy_type']) => {
  switch (type) {
    case 'honey_file': return <InsertDriveFile sx={{ fontSize: 18 }} />;
    case 'honey_credential': return <VpnKey sx={{ fontSize: 18 }} />;
    case 'ghost_socket': return <Language sx={{ fontSize: 18 }} />;
    case 'registry_trap': return <AppRegistration sx={{ fontSize: 18 }} />;
  }
};

const getDecoyTypeColor = (type: DecoyItem['decoy_type']) => {
  switch (type) {
    case 'honey_file': return WARN;
    case 'honey_credential': return PURPLE;
    case 'ghost_socket': return CYAN;
    case 'registry_trap': return CR;
  }
};

export const MayajaalDeceptionView: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [overview, setOverview] = useState<DeceptionOverview | null>(null);
  const [decoys, setDecoys] = useState<DecoyItem[]>([]);
  const [tripLogs, setTripLogs] = useState<TripwireEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Deploy Decoy Modal
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployType, setDeployType] = useState<DecoyItem['decoy_type']>('honey_file');
  const [deployAsset, setDeployAsset] = useState('SWSTK-LPT-0492 (Finance)');
  const [deployLocation, setDeployLocation] = useState('C:\\Users\\rohit.sharma\\Documents\\passwords.xlsx');
  const [deployDesc, setDeployDesc] = useState('');
  const [deploying, setDeploying] = useState(false);

  // Simulation State
  const [simulatingTrip, setSimulatingTrip] = useState(false);
  const [tripAlertMsg, setTripAlertMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, dec, logs] = await Promise.all([
        api.deception.getOverview(),
        api.deception.getDecoys(),
        api.deception.getTripwireLogs(),
      ]);
      setOverview(ov);
      setDecoys(dec);
      setTripLogs(logs);
    } catch (err) {
      console.error('Failed to load Mayajaal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Simulate Decoy Breach
  const handleSimulateTrip = async () => {
    setSimulatingTrip(true);
    try {
      const event = await api.deception.simulateTrip();
      setTripLogs(prev => [event, ...prev]);
      setTripAlertMsg(`DEFCON-1: Honey-Token '${event.decoy_name}' tripped by PID ${event.pid} (${event.adversary_process}). Auto-contained in ${event.containment_latency_ms}ms.`);
      await loadData();
      setTimeout(() => setTripAlertMsg(null), 6000);
    } catch (err) {
      console.error('Trip simulation failed:', err);
    } finally {
      setSimulatingTrip(false);
    }
  };

  // Deploy Decoy
  const handleDeploy = async () => {
    if (!deployName.trim()) return;
    setDeploying(true);
    try {
      const newD = await api.deception.deployDecoy({
        name: deployName.trim(),
        decoy_type: deployType,
        target_asset: deployAsset,
        location_or_port: deployLocation.trim(),
        threat_description: deployDesc.trim() || 'Active deception honey-token.',
      });
      setDecoys(prev => [...prev, newD]);
      setDeployModalOpen(false);
      setDeployName('');
      setDeployDesc('');
    } catch (err) {
      console.error('Failed to deploy decoy:', err);
    } finally {
      setDeploying(false);
    }
  };

  // Decommission Decoy
  const handleDecommission = async (decoyId: string) => {
    try {
      await api.deception.decommissionDecoy(decoyId);
      setDecoys(prev => prev.map(d => (d.id === decoyId ? { ...d, status: 'dormant' } : d)));
      setTripAlertMsg(`Decoy asset '${decoyId}' successfully decommissioned.`);
      setTimeout(() => setTripAlertMsg(null), 4000);
    } catch (err) {
      console.error('Failed to decommission decoy:', err);
    }
  };

  // Download Canary Token
  const handleDownloadCanary = (decoy: DecoyItem) => {
    const canaryUrl = api.deception.getDownloadCanaryUrl(decoy.id);
    const a = document.createElement('a');
    a.href = canaryUrl;
    a.download = `canary_aws_credentials_${decoy.id}.env`;
    a.click();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ── TOP ACTION BAR ──────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: 'rgba(220, 38, 38, 0.12)',
                color: CR,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VisibilityOff sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
                Mayajaal: Active Deception & Honey-Token Fleet
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Canary Bait Documents • In-Memory LSASS Credential Traps • Ghost Decoy Sockets • Zero False-Positive Defense
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button
            size="small"
            variant="contained"
            disabled={simulatingTrip}
            onClick={handleSimulateTrip}
            startIcon={simulatingTrip ? <CircularProgress size={16} sx={{ color: '#000' }} /> : <Bolt />}
            sx={{
              bgcolor: WARN,
              color: '#000',
              fontWeight: 800,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: '#D97706' },
            }}
          >
            {simulatingTrip ? 'Simulating Breach...' : 'Simulate Decoy Tripwire'}
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => setDeployModalOpen(true)}
            startIcon={<Add />}
            sx={{
              bgcolor: CR,
              color: '#FFF',
              fontWeight: 800,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Deploy New Decoy
          </Button>

          <Tooltip title="Refresh Deception Fleet">
            <IconButton onClick={loadData} sx={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Live Tripped Alert */}
      {tripAlertMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
          {tripAlertMsg}
        </Alert>
      )}

      {/* ── KPI METRICS CARDS ───────────────────────────────────────────── */}
      {overview && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
              ACTIVE DECOYS DEPLOYED
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
              {overview.total_active_decoys} Traps
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
              HONEY-FILE BAITS
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: WARN, mt: 0.5 }}>
              {overview.honey_files_deployed} Documents
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
              LSASS MEMORY TRAPS
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: PURPLE, mt: 0.5 }}>
              {overview.memory_credential_traps} Kerberos
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
              AVG CONTAINMENT SPEED
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 900, color: CYAN, mt: 0.5 }}>
              {overview.avg_neutralization_ms} ms
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
              FALSE POSITIVE RATE
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: SAFE, mt: 0.5 }}>
              0.00%
            </Typography>
          </Paper>
        </Box>
      )}

      {/* ── DECOY FLEET INVENTORY ────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
          bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
          mb: 4,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Active Decoys & Honey-Token Fleet
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {decoys.length} Protected Nodes Armed
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>DECOY ASSET</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>TARGET HOST</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>LOCATION / PORT</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>TRIPPED</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decoys.map((d) => {
                const catColor = getDecoyTypeColor(d.decoy_type);
                const isTripped = d.status === 'tripped';
                const isDormant = d.status === 'dormant';

                return (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.2}>
                        <Box sx={{ color: catColor }}>{getDecoyIcon(d.decoy_type)}</Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {d.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                            {d.threat_description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.decoy_type.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{ fontSize: '0.62rem', fontWeight: 800, bgcolor: `${catColor}15`, color: catColor }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                      {d.target_asset}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'text.secondary' }}>
                      {d.location_or_port}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isTripped ? 'TRIPPED & CONTAINED' : (isDormant ? 'DECOMMISSIONED' : 'ARMED & MONITORING')}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          fontSize: '0.65rem',
                          bgcolor: isTripped ? 'rgba(220,38,38,0.15)' : (isDormant ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.15)'),
                          color: isTripped ? CR : (isDormant ? 'text.secondary' : SAFE),
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: isTripped ? CR : 'text.secondary' }}>
                      {d.tripped_count}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Download Canary Bait File (.env)">
                          <IconButton size="small" onClick={() => handleDownloadCanary(d)} sx={{ color: CYAN }}>
                            <FileDownload sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Decommission Decoy Asset">
                          <IconButton size="small" onClick={() => handleDecommission(d.id)} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            <DeleteOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── LIVE FORENSIC TRIPWIRE LOGS ──────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
          bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Bolt sx={{ color: WARN }} />
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
              Forensic Tripwire Interception Log
            </Typography>
          </Box>
          <Chip label="ZERO-TOLERANCE TRIPWIRE" size="small" sx={{ fontWeight: 800, color: CR, bgcolor: 'rgba(220,38,38,0.15)' }} />
        </Box>

        <Stack spacing={1.5}>
          {tripLogs.map((log) => (
            <Box
              key={log.id}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Chip
                    label="BREACH INTERCEPTED"
                    size="small"
                    sx={{ bgcolor: 'rgba(220,38,38,0.15)', color: CR, fontWeight: 900, fontSize: '0.65rem' }}
                  />
                  <Typography sx={{ fontWeight: 800, fontSize: '0.86rem' }}>
                    {log.decoy_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>•</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary' }}>
                    Host: {log.host}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: 'text.secondary' }}>
                  Offending Process: <strong style={{ color: CR }}>{log.adversary_process}</strong> (PID: {log.pid}) • Access: {log.access_type}
                </Typography>
              </Box>

              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: SAFE }}>
                  {log.action_taken}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: CYAN, fontWeight: 800 }}>
                  Neutralization Latency: {log.containment_latency_ms} ms
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* ── DEPLOY DECOY MODAL ──────────────────────────────────────────── */}
      <Dialog
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 900 }}>
          Deploy Active Honey-Token / Decoy
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Decoy Name"
              size="small"
              fullWidth
              value={deployName}
              onChange={(e) => setDeployName(e.target.value)}
              placeholder="e.g. passwords_master.xlsx"
            />

            <Select
              size="small"
              fullWidth
              value={deployType}
              onChange={(e) => setDeployType(e.target.value as any)}
            >
              <MenuItem value="honey_file">Honey-File (Canary Bait Document)</MenuItem>
              <MenuItem value="honey_credential">Honey-Credential (LSASS In-Memory Trap)</MenuItem>
              <MenuItem value="ghost_socket">Ghost Socket (Decoy Port Listener)</MenuItem>
              <MenuItem value="registry_trap">Registry Trap (Persistence Tripwire)</MenuItem>
            </Select>

            <TextField
              label="Target Endpoint"
              size="small"
              fullWidth
              value={deployAsset}
              onChange={(e) => setDeployAsset(e.target.value)}
            />

            <TextField
              label="File Location / Listening Port"
              size="small"
              fullWidth
              value={deployLocation}
              onChange={(e) => setDeployLocation(e.target.value)}
            />

            <TextField
              label="Threat Description"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={deployDesc}
              onChange={(e) => setDeployDesc(e.target.value)}
              placeholder="e.g. Bait spreadsheet to intercept ransomware zero-days"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeployModalOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!deployName.trim() || deploying}
            onClick={handleDeploy}
            sx={{
              bgcolor: CR,
              color: '#FFF',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            {deploying ? 'Arming Decoy...' : 'Arm & Deploy Decoy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MayajaalDeceptionView;
