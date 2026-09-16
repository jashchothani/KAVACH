import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Grid,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Alert,
  Stack,
  InputAdornment,
} from '@mui/material';
import {
  Computer,
  Memory,
  Router,
  AccessTime,
  CheckCircle,
  Warning,
  Refresh,
  PlayArrow,
  Stop,
  RestartAlt,
  Search,
} from '@mui/icons-material';
import { api, type ProcessItem, type NetworkConnectionItem, type CollectorStatus } from '../api/client';

interface MonitoringViewProps {
  initialTab?: number;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ initialTab = 0 }) => {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab 0: Devices
  const [devices, setDevices] = useState<any[]>([]);
  // Tab 1: Processes
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  // Tab 2: Network Connections
  const [network, setNetwork] = useState<NetworkConnectionItem[]>([]);
  // Tab 3: 16 Collectors
  const [collectors, setCollectors] = useState<CollectorStatus[]>([]);

  // Search filter
  const [filterText, setFilterText] = useState('');
  const [collectorActionMsg, setCollectorActionMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      if (tab === 0) {
        const d = await api.devices.getDevices(50);
        setDevices(d);
      } else if (tab === 1) {
        const p = await api.monitoring.getProcesses(50);
        setProcesses(p);
      } else if (tab === 2) {
        const n = await api.monitoring.getNetwork(50);
        setNetwork(n);
      } else if (tab === 3) {
        const c = await api.monitoring.getCollectorsStatus();
        setCollectors(c);
      }
    } catch {
      // Graceful error handling
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [tab]);

  const handleToggleCollector = async (name: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setCollectorActionMsg(`Sending ${action.toUpperCase()} command to collector: ${name}...`);
      await api.monitoring.toggleCollector(name, action);
      setTimeout(async () => {
        const updated = await api.monitoring.getCollectorsStatus();
        setCollectors(updated);
        setCollectorActionMsg(`Collector ${name} is now ${action === 'stop' ? 'stopped' : 'running'}.`);
        setTimeout(() => setCollectorActionMsg(null), 4000);
      }, 1000);
    } catch (err: any) {
      setCollectorActionMsg(`Error modifying collector: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: 'Outfit' }}>
            <Computer sx={{ color: '#38bdf8', fontSize: 32 }} />
            System Monitoring & Telemetry Inventory
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Real-time live telemetry stream from all 16 Windows sensors, processes, sockets, and endpoints.
          </Typography>
        </Box>
        <Button
          startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
          variant="outlined"
          size="small"
          onClick={fetchData}
          disabled={refreshing}
          sx={{ fontWeight: 700 }}
        >
          Refresh Feed
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setFilterText(''); }}>
          <Tab icon={<Computer sx={{ fontSize: 18 }} />} iconPosition="start" label="Endpoints / Devices" />
          <Tab icon={<Memory sx={{ fontSize: 18 }} />} iconPosition="start" label="Process Telemetry" />
          <Tab icon={<Router sx={{ fontSize: 18 }} />} iconPosition="start" label="Network Sockets" />
          <Tab icon={<AccessTime sx={{ fontSize: 18 }} />} iconPosition="start" label="16 Windows Collectors" />
        </Tabs>
      </Paper>

      {/* Search & Feedback */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          placeholder={`Search ${tab === 0 ? 'devices' : tab === 1 ? 'processes' : tab === 2 ? 'sockets' : 'collectors'}...`}
          size="small"
          fullWidth
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ mr: 1, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {collectorActionMsg && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {collectorActionMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 ? (
        /* TAB 0: DEVICES */
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>HOSTNAME</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>IP ADDRESS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>RISK SCORE</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>LAST SEEN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No devices registered yet. Windows telemetry collectors will automatically discover endpoints.
                  </TableCell>
                </TableRow>
              ) : (
                devices
                  .filter((d) => d.hostname?.toLowerCase().includes(filterText.toLowerCase()) || d.ip_address?.includes(filterText))
                  .map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{d.hostname}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{d.ip_address || '127.0.0.1'}</TableCell>
                      <TableCell>
                        <Chip
                          label={(d.status || 'online').toUpperCase()}
                          color={d.status === 'isolated' ? 'error' : 'success'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: (d.risk_score || 0) > 50 ? 'error.main' : 'text.primary' }}>
                          {Math.round(d.risk_score || 0)}/100
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {d.last_seen ? new Date(d.last_seen).toLocaleString() : 'Just now'}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : tab === 1 ? (
        /* TAB 1: PROCESS TELEMETRY */
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>PID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PROCESS NAME</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CPU %</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>MEMORY (MB)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>USER</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No process telemetry available.
                  </TableCell>
                </TableRow>
              ) : (
                processes
                  .filter((p) => p.name?.toLowerCase().includes(filterText.toLowerCase()) || String(p.pid).includes(filterText))
                  .map((p) => (
                    <TableRow key={p.pid} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.pid}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                      <TableCell>{(p.cpu_percent || 0).toFixed(1)}%</TableCell>
                      <TableCell>{(p.memory_mb || 0).toFixed(1)} MB</TableCell>
                      <TableCell>
                        <Chip label={p.status || 'running'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{p.username || 'SYSTEM'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : tab === 2 ? (
        /* TAB 2: NETWORK SOCKETS */
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>LOCAL ADDRESS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>REMOTE ADDRESS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SOCKET STATE</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PROCESS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {network.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No active network sockets captured.
                  </TableCell>
                </TableRow>
              ) : (
                network
                  .filter(
                    (n) =>
                      n.local_address?.includes(filterText) ||
                      n.remote_address?.includes(filterText) ||
                      n.process_name?.toLowerCase().includes(filterText.toLowerCase())
                  )
                  .map((n, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{n.local_address}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{n.remote_address || '*:*'}</TableCell>
                      <TableCell>
                        <Chip
                          label={n.status || 'ESTABLISHED'}
                          size="small"
                          color={n.status === 'ESTABLISHED' ? 'success' : 'default'}
                          sx={{ fontSize: 11, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{n.pid || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{n.process_name || 'System'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* TAB 3: 16 WINDOWS COLLECTORS */
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>COLLECTOR SENSOR</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>UPTIME</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>EVENTS LOGGED</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">LIFECYCLE CONTROLS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collectors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Collectors are loading or operating in standalone mode.
                  </TableCell>
                </TableRow>
              ) : (
                collectors
                  .filter((c) => c.name?.toLowerCase().includes(filterText.toLowerCase()) || c.category?.toLowerCase().includes(filterText.toLowerCase()))
                  .map((c) => (
                    <TableRow key={c.name} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                        {c.name.replace(/_/g, ' ').toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Chip label={c.category?.toUpperCase() || 'CORE'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.status.toUpperCase()}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: 10,
                            bgcolor:
                              c.status === 'running'
                                ? 'rgba(34,197,94,0.15)'
                                : c.status === 'degraded'
                                ? 'rgba(245,158,11,0.15)'
                                : 'rgba(239,68,68,0.15)',
                            color:
                              c.status === 'running'
                                ? '#22c55e'
                                : c.status === 'degraded'
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {c.uptime_seconds ? `${Math.floor(c.uptime_seconds / 60)}m ${c.uptime_seconds % 60}s` : '0s'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        {(c.event_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Start Collector">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={c.status === 'running'}
                                onClick={() => handleToggleCollector(c.name, 'start')}
                              >
                                <PlayArrow fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Stop Collector">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={c.status === 'stopped'}
                                onClick={() => handleToggleCollector(c.name, 'stop')}
                              >
                                <Stop fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Restart Collector">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleToggleCollector(c.name, 'restart')}
                            >
                              <RestartAlt fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
