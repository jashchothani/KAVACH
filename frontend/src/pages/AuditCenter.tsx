import React, { useState } from 'react';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, MenuItem, Button,
  LinearProgress, useTheme, Grid
} from '@mui/material';
import { GlassCard } from '../components/common/GlassCard';
import { Search, Refresh, Download } from '@mui/icons-material';

const initialLogs = [
  { id: 1, user: 'Kavach Admin', action: 'Execute Playbook', resource: 'Host Isolation', ip: '192.168.1.120', status: 'success', timestamp: '2024-07-24 09:15:30' },
  { id: 2, user: 'SOC Analyst', action: 'Update Notes', resource: 'INC-002 Database Access Investigation', ip: '192.168.1.125', status: 'success', timestamp: '2024-07-24 09:08:12' },
  { id: 3, user: 'Kavach Admin', action: 'User Authenticated', resource: 'Admin Session Login', ip: '192.168.1.120', status: 'success', timestamp: '2024-07-24 08:30:00' },
  { id: 4, user: 'Incident Responder', action: 'Rollback Actions', resource: 'File Quarantine DEV-APP-03', ip: '192.168.1.130', status: 'success', timestamp: '2024-07-24 07:45:22' },
  { id: 5, user: 'Security Manager', action: 'Approve Playbook Run', resource: 'Account Lockdown (finance_service)', ip: '192.168.2.10', status: 'success', timestamp: '2024-07-24 06:12:00' },
  { id: 6, user: 'Unknown User', action: 'User Auth Failed', resource: 'Failed login limit warning', ip: '185.220.101.5', status: 'failed', timestamp: '2024-07-24 05:05:12' }
];

export const AuditCenter: React.FC = () => {
  const [logs, _setLogs] = useState(initialLogs);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) || 
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.resource.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            Audit Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable system logs tracking analyst actions, playbook execution approvals, and login metrics
          </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button startIcon={<Refresh />} variant="outlined" onClick={handleRefresh} sx={{ fontWeight: 'bold' }}>
            Refresh
          </Button>
          <Button startIcon={<Download />} variant="contained" onClick={() => alert('Downloading audit logs in CSV format...')} sx={{ fontWeight: 'bold', boxShadow: '0 4px 15px rgba(193, 18, 31, 0.3)' }}>
            Export Audit
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <GlassCard sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <TextField
              placeholder="Search logs by user, action, resource..."
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              select
              label="Execution Status"
              fullWidth
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Logs</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </GlassCard>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Logs Table */}
      <TableContainer component={GlassCard}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Operator</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Target Resource</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>IP Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>{log.timestamp}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{log.user}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{log.resource}</TableCell>
                <TableCell>{log.ip}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Button 
                    size="small" 
                    variant="text" 
                    color={log.status === 'success' ? 'success' : 'error'}
                    sx={{ fontWeight: 'bold', pointerEvents: 'none' }}
                  >
                    {log.status}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
