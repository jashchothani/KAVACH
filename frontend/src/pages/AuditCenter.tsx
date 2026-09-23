import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, MenuItem, Button,
  LinearProgress, useTheme, Grid, Chip, Tabs, Tab, Paper,
  IconButton, Tooltip, Stack,
} from '@mui/material';
import { GlassCard } from '../components/common/GlassCard';
import { Search, Refresh, Download, FiberManualRecord, FilterList } from '@mui/icons-material';
import { api, type SystemLogEntry } from '../api/client';

export const AuditCenter: React.FC = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0); // 0: Live Multi-Stream Logs, 1: DB Audit Trail
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (tab === 0) {
        const streamParam = streamFilter === 'all' ? undefined : streamFilter;
        const levelParam = levelFilter === 'all' ? undefined : levelFilter;
        const data = await api.logs.getLogs(streamParam, 100, levelParam);
        setLogs(data);
      } else {
        const auditData = await api.logs.getAuditLogs(100);
        setAuditLogs(auditData);
      }
    } catch {
      // Graceful error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tab, streamFilter, levelFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, tab, streamFilter, levelFilter]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const streamParam = streamFilter === 'all' ? undefined : streamFilter;
      const blob = await api.logs.exportLogs(format, streamParam);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kavach_logs_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export logs.');
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.message?.toLowerCase().includes(term) ||
      log.component?.toLowerCase().includes(term) ||
      log.stream?.toLowerCase().includes(term)
    );
  });

  const filteredAudit = auditLogs.filter((al) => {
    const term = search.toLowerCase();
    return (
      al.action?.toLowerCase().includes(term) ||
      al.actor?.toLowerCase().includes(term) ||
      al.target_type?.toLowerCase().includes(term)
    );
  });

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            Multi-Stream Logging & Audit Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable live event telemetry and cryptographically verifiable system audit trails
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
            label={autoRefresh ? 'AUTO-STREAM (5s)' : 'PAUSED'}
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{
              cursor: 'pointer',
              fontWeight: 700,
              bgcolor: autoRefresh ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: autoRefresh ? '#22c55e' : '#ef4444',
            }}
          />
          <Button startIcon={<Refresh />} variant="outlined" size="small" onClick={fetchLogs} sx={{ fontWeight: 700 }}>
            Refresh
          </Button>
          <Button
            startIcon={<Download />}
            variant="contained"
            size="small"
            onClick={() => handleExport('csv')}
            sx={{ fontWeight: 700, bgcolor: '#38bdf8', '&:hover': { bgcolor: '#0284c7' } }}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }}>
          <Tab label="Live System Log Streams" />
          <Tab label="Database Audit Trail" />
        </Tabs>
      </Paper>

      {/* Filters */}
      <GlassCard sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={tab === 0 ? 6 : 12}>
            <TextField
              placeholder={tab === 0 ? "Search live logs by message or component..." : "Search audit logs by actor, action..."}
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          {tab === 0 && (
            <>
              <Grid item xs={6} md={3}>
                <TextField
                  select
                  label="Stream"
                  fullWidth
                  size="small"
                  value={streamFilter}
                  onChange={(e) => setStreamFilter(e.target.value)}
                >
                  <MenuItem value="all">All Streams</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="detection">Detection</MenuItem>
                  <MenuItem value="audit">Audit</MenuItem>
                  <MenuItem value="auth">Authentication</MenuItem>
                  <MenuItem value="collector">Collectors</MenuItem>
                  <MenuItem value="application">Application</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  select
                  label="Severity Level"
                  fullWidth
                  size="small"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="DEBUG">DEBUG</MenuItem>
                  <MenuItem value="INFO">INFO</MenuItem>
                  <MenuItem value="WARNING">WARNING</MenuItem>
                  <MenuItem value="ERROR">ERROR</MenuItem>
                  <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                </TextField>
              </Grid>
            </>
          )}
        </Grid>
      </GlassCard>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Content Table */}
      {tab === 0 ? (
        /* LIVE SYSTEM LOGS */
        <TableContainer component={GlassCard}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell sx={{ fontWeight: 700, width: 180 }}>TIMESTAMP</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 110 }}>STREAM</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>LEVEL</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 160 }}>COMPONENT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>MESSAGE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No system log entries found for current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((l, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
                      {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{new Date(l.timestamp).getMilliseconds()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={l.stream?.toUpperCase()}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 10, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={l.level}
                        size="small"
                        sx={{
                          fontSize: 10,
                          fontWeight: 800,
                          bgcolor:
                            l.level === 'CRITICAL' || l.level === 'ERROR'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : l.level === 'WARNING'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(56, 189, 248, 0.15)',
                          color:
                            l.level === 'CRITICAL' || l.level === 'ERROR'
                              ? '#ef4444'
                              : l.level === 'WARNING'
                              ? '#f59e0b'
                              : '#38bdf8',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                      {l.component}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {l.message}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* DATABASE AUDIT TRAIL */
        <TableContainer component={GlassCard}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell sx={{ fontWeight: 700, width: 180 }}>TIMESTAMP</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 160 }}>ACTOR</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 180 }}>ACTION</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 140 }}>TARGET</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>DETAILS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAudit.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No audit trail records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAudit.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
                      {new Date(a.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {a.actor} ({a.actor_role || 'user'})
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.action?.replace(/_/g, ' ').toUpperCase()}
                        size="small"
                        sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 700, fontSize: 10 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {a.target_type || 'system'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                      {typeof a.details === 'object' ? JSON.stringify(a.details) : a.details || '-'}
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
