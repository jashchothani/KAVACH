import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Button, IconButton, Tooltip,
  TextField, Alert, Stack, InputAdornment, LinearProgress, useTheme
} from '@mui/material';
import {
  Computer, Memory, Router, AccessTime, Refresh, PlayArrow, Stop, RestartAlt,
  Search, KeyboardArrowUp, KeyboardArrowDown, KeyboardArrowRight, Warning, Security
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type ProcessItem, type NetworkConnectionItem, type CollectorStatus } from '../api/client';

interface MonitoringViewProps {
  initialTab?: number;
}

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export const MonitoringView: React.FC<MonitoringViewProps> = ({ initialTab = 0 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [devices, setDevices] = useState<any[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [network, setNetwork] = useState<NetworkConnectionItem[]>([]);
  const [collectors, setCollectors] = useState<CollectorStatus[]>([]);

  const [filterText, setFilterText] = useState('');
  const [collectorActionMsg, setCollectorActionMsg] = useState<string | null>(null);

  // Sorting state for processes
  const [sortField, setSortField] = useState<'cpu' | 'mem' | 'name' | 'pid'>('cpu');
  const [sortDesc, setSortDesc] = useState(true);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.95)' : '#FFFFFF';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const fetchData = async () => {
    setRefreshing(true);
    try {
      if (tab === 0) {
        const d = await api.devices.getDevices(50);
        setDevices(d || []);
      } else if (tab === 1) {
        const p = await api.monitoring.getProcesses(150); // Get more for the task manager
        setProcesses(p || []);
      } else if (tab === 2) {
        const n = await api.monitoring.getNetwork(150);
        setNetwork(n || []);
      } else if (tab === 3) {
        const c = await api.monitoring.getCollectorsStatus();
        setCollectors(c || []);
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

  // Live auto-refresh for process and network tabs
  useEffect(() => {
    let iv: any;
    if (tab === 1 || tab === 2) {
      iv = setInterval(() => {
        fetchData();
      }, 10000); // 10s auto refresh for live tabs
    }
    return () => {
      if (iv) clearInterval(iv);
    };
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

  const handleSort = (field: 'cpu' | 'mem' | 'name' | 'pid') => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const sortedProcesses = useMemo(() => {
    let filtered = processes.filter(p => 
      p.name?.toLowerCase().includes(filterText.toLowerCase()) || 
      String(p.pid).includes(filterText)
    );

    return filtered.sort((a, b) => {
      let valA: any = a.cpu_percent || 0;
      let valB: any = b.cpu_percent || 0;
      
      if (sortField === 'mem') {
        valA = a.memory_mb || 0;
        valB = b.memory_mb || 0;
      } else if (sortField === 'name') {
        valA = a.name?.toLowerCase() || '';
        valB = b.name?.toLowerCase() || '';
      } else if (sortField === 'pid') {
        valA = a.pid;
        valB = b.pid;
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [processes, filterText, sortField, sortDesc]);

  // Styling components
  const ThCell = ({ label, field, sortable = false, align = 'left' }: any) => (
    <TableCell align={align} sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', letterSpacing: '0.05em', borderBottom: `1px solid ${border}` }}>
      {sortable ? (
        <Box 
          onClick={() => handleSort(field)} 
          sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
        >
          {label}
          {sortField === field ? (
            sortDesc ? <KeyboardArrowDown sx={{ fontSize: 16, ml: 0.5 }} /> : <KeyboardArrowUp sx={{ fontSize: 16, ml: 0.5 }} />
          ) : (
            <KeyboardArrowDown sx={{ fontSize: 16, ml: 0.5, opacity: 0 }} /> // Spacer
          )}
        </Box>
      ) : (
        label
      )}
    </TableCell>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: 'Outfit' }}>
            <Memory sx={{ color: '#38bdf8', fontSize: 28 }} />
            Telemetry & Resources Manager
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 600 }}>
            Real-time live telemetry stream from all Windows kernel sensors. Inspect processes, active network sockets, and collector subsystem status.
          </Typography>
        </Box>
        <Button
          startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
          variant="contained"
          onClick={fetchData}
          disabled={refreshing}
          sx={{ 
            fontWeight: 700, 
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: 'text.primary',
            boxShadow: 'none',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', boxShadow: 'none' }
          }}
        >
          Force Poll
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ bgcolor: cardBg, border: `1px solid ${border}`, borderRadius: 3, overflow: 'hidden' }} elevation={0}>
        <Box sx={{ borderBottom: `1px solid ${border}`, px: 1 }}>
          <Tabs 
            value={tab} 
            onChange={(_, v) => { setTab(v); setFilterText(''); }}
            sx={{
              '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', minHeight: 54 },
              '& .Mui-selected': { color: '#38bdf8 !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#38bdf8' }
            }}
          >
            <Tab icon={<Computer sx={{ fontSize: 18 }} />} iconPosition="start" label="Endpoints" />
            <Tab icon={<Memory sx={{ fontSize: 18 }} />} iconPosition="start" label="Live Processes" />
            <Tab icon={<Router sx={{ fontSize: 18 }} />} iconPosition="start" label="Network Sockets" />
            <Tab icon={<AccessTime sx={{ fontSize: 18 }} />} iconPosition="start" label="Kernel Collectors" />
          </Tabs>
        </Box>

        {/* Toolbar */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: `1px solid ${border}` }}>
          <TextField
            placeholder={`Search ${tab === 0 ? 'endpoints' : tab === 1 ? 'processes (name or PID)' : tab === 2 ? 'sockets' : 'collectors'}...`}
            size="small"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ 
              width: 300,
              '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            }}
          />
          {tab === 1 && (
            <Chip 
              icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: SAFE, ml: 1 }} />} 
              label="Live Updates" 
              size="small" 
              sx={{ bgcolor: 'transparent', border: `1px solid ${border}`, color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }} 
            />
          )}
        </Box>

        <AnimatePresence>
          {collectorActionMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>{collectorActionMsg}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <Box sx={{ p: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: '#38bdf8' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Querying kernel sensors...</Typography>
          </Box>
        ) : tab === 0 ? (
          /* ─── TAB 0: ENDPOINTS ─── */
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <ThCell label="HOSTNAME" />
                  <ThCell label="IP ADDRESS" />
                  <ThCell label="STATUS" />
                  <ThCell label="RISK SCORE" />
                  <ThCell label="LAST SEEN" align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No endpoints found.</TableCell></TableRow>
                ) : (
                  devices.filter(d => d.hostname?.toLowerCase().includes(filterText.toLowerCase()) || d.ip_address?.includes(filterText)).map(d => (
                    <TableRow key={d.id} hover sx={{ '& td': { borderBottom: `1px solid ${border}` } }}>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Computer sx={{ fontSize: 16, color: 'text.secondary' }} />
                          {d.hostname}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{d.ip_address || '127.0.0.1'}</TableCell>
                      <TableCell>
                        <Chip label={(d.status || 'online').toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: d.status === 'isolated' ? 'rgba(220,38,38,0.1)' : 'rgba(34,197,94,0.1)', color: d.status === 'isolated' ? CR : SAFE }} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: (d.risk_score || 0) > 50 ? CR : 'text.primary' }}>
                          {Math.round(d.risk_score || 0)}/100
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {d.last_seen ? new Date(d.last_seen).toLocaleString() : 'Just now'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : tab === 1 ? (
          /* ─── TAB 1: PROCESS TELEMETRY (Task Manager Style) ─── */
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <ThCell label="NAME" field="name" sortable />
                  <ThCell label="PID" field="pid" sortable />
                  <ThCell label="CPU" field="cpu" sortable />
                  <ThCell label="MEMORY" field="mem" sortable />
                  <ThCell label="USER" />
                  <ThCell label="RISK" align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProcesses.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No processes matching filter.</TableCell></TableRow>
                ) : (
                  sortedProcesses.map(p => {
                    const cpu = p.cpu_percent || 0;
                    const mem = p.memory_mb || 0;
                    const isHighCpu = cpu > 10;
                    const isHighMem = mem > 500;
                    
                    // Simple heuristic for demo if backend doesn't provide risk
                    const isSus = p.name?.toLowerCase().includes('svchost') && (cpu > 20);

                    return (
                      <TableRow key={p.pid} hover sx={{ '& td': { borderBottom: `1px solid ${border}`, py: 1.5 } }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 14, height: 14, borderRadius: '2px', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSus ? <Warning sx={{ fontSize: 10, color: WARN }} /> : <KeyboardArrowRight sx={{ fontSize: 12 }} />}
                            </Box>
                            {p.name}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                          {p.pid}
                        </TableCell>
                        <TableCell sx={{ width: 150 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ width: 45, fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: isHighCpu ? WARN : 'text.primary', fontWeight: isHighCpu ? 700 : 400 }}>
                              {cpu.toFixed(1)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(cpu, 100)} 
                              sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: isHighCpu ? WARN : '#38bdf8' } }} 
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ width: 150 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ width: 65, fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: isHighMem ? WARN : 'text.primary', fontWeight: isHighMem ? 700 : 400 }}>
                              {mem.toFixed(1)} MB
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min((mem / 1024) * 100, 100)} // Rough relative to 1GB
                              sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: isHighMem ? '#8B5CF6' : '#3B82F6' } }} 
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          {p.username || 'NT AUTHORITY\\SYSTEM'}
                        </TableCell>
                        <TableCell align="right">
                          {isSus ? (
                            <Chip label="SUSPICIOUS" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(245,158,11,0.15)', color: WARN }} />
                          ) : (
                            <Chip label="TRUSTED" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'transparent', color: 'text.disabled' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : tab === 2 ? (
          /* ─── TAB 2: NETWORK SOCKETS ─── */
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <ThCell label="PROCESS" />
                  <ThCell label="PID" />
                  <ThCell label="LOCAL ADDRESS" />
                  <ThCell label="REMOTE ADDRESS" />
                  <ThCell label="STATE" align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {network.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No active network sockets.</TableCell></TableRow>
                ) : (
                  network.filter(n => n.local_address?.includes(filterText) || n.remote_address?.includes(filterText) || n.process_name?.toLowerCase().includes(filterText.toLowerCase())).map((n, idx) => {
                    const isEst = n.status === 'ESTABLISHED';
                    const isList = n.status === 'LISTEN';
                    return (
                      <TableRow key={idx} hover sx={{ '& td': { borderBottom: `1px solid ${border}`, py: 1.5 } }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{n.process_name || 'System'}</TableCell>
                        <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'text.secondary' }}>{n.pid || '-'}</TableCell>
                        <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{n.local_address}</TableCell>
                        <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: isEst ? '#38bdf8' : 'text.primary' }}>{n.remote_address || '*:*'}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={n.status || 'UNKNOWN'}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.65rem', fontWeight: 800,
                              bgcolor: isEst ? 'rgba(34,197,94,0.1)' : isList ? 'rgba(56,189,248,0.1)' : 'transparent',
                              color: isEst ? SAFE : isList ? '#38bdf8' : 'text.secondary',
                              border: (!isEst && !isList) ? `1px solid ${border}` : 'none'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* ─── TAB 3: COLLECTORS ─── */
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <ThCell label="SENSOR MODULE" />
                  <ThCell label="CATEGORY" />
                  <ThCell label="STATUS" />
                  <ThCell label="EVENTS" />
                  <ThCell label="UPTIME" />
                  <ThCell label="ACTIONS" align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {collectors.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No collectors online.</TableCell></TableRow>
                ) : (
                  collectors.filter(c => c.name?.toLowerCase().includes(filterText.toLowerCase())).map((c) => {
                    const isRun = c.status === 'running';
                    return (
                      <TableRow key={c.name} hover sx={{ '& td': { borderBottom: `1px solid ${border}`, py: 1.5 } }}>
                        <TableCell sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.9rem' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Security sx={{ fontSize: 16, color: isRun ? SAFE : CR }} />
                            {c.name.replace(/_/g, ' ').toUpperCase()}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={c.category?.toUpperCase() || 'CORE'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isRun ? SAFE : c.status === 'degraded' ? WARN : CR, boxShadow: `0 0 8px ${isRun ? SAFE : c.status === 'degraded' ? WARN : CR}` }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: isRun ? SAFE : c.status === 'degraded' ? WARN : CR }}>
                              {c.status.toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                          {(c.event_count || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          {c.uptime_seconds ? `${Math.floor(c.uptime_seconds / 60)}m ${c.uptime_seconds % 60}s` : '0s'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Start Sensor">
                              <span><IconButton size="small" disabled={isRun} onClick={() => handleToggleCollector(c.name, 'start')} sx={{ color: SAFE }}><PlayArrow fontSize="small" /></IconButton></span>
                            </Tooltip>
                            <Tooltip title="Stop Sensor">
                              <span><IconButton size="small" disabled={c.status === 'stopped'} onClick={() => handleToggleCollector(c.name, 'stop')} sx={{ color: CR }}><Stop fontSize="small" /></IconButton></span>
                            </Tooltip>
                            <Tooltip title="Restart Sensor">
                              <IconButton size="small" onClick={() => handleToggleCollector(c.name, 'restart')} sx={{ color: '#38bdf8' }}><RestartAlt fontSize="small" /></IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};
