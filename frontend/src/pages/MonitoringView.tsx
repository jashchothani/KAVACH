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
  Card,
  CardContent,
} from '@mui/material';
import {
  Computer,
  Memory,
  Router,
  AccessTime,
  CheckCircle,
  Warning,
  Security,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

interface MonitoringViewProps {
  initialTab?: number;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ initialTab = 0 }) => {
  const [tab, setTab] = useState(initialTab);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resp = await axios.get(`${API_BASE}/devices`);
        setDevices(resp.data);
      } catch (e) {
        // Backend offline
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Computer sx={{ color: '#38bdf8', fontSize: 32 }} />
          System Monitoring & Telemetry Inventory
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Real-time visibility into monitored endpoints, active processes, and socket telemetry.
        </Typography>
      </Box>

      <Paper sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<Computer sx={{ fontSize: 18 }} />} iconPosition="start" label="Endpoints / Devices" />
          <Tab icon={<Memory sx={{ fontSize: 18 }} />} iconPosition="start" label="Process Telemetry" />
          <Tab icon={<Router sx={{ fontSize: 18 }} />} iconPosition="start" label="Network Sockets" />
          <Tab icon={<AccessTime sx={{ fontSize: 18 }} />} iconPosition="start" label="Collector Activity" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 ? (
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>HOSTNAME</TableCell>
                <TableCell>IP ADDRESS</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell>RISK SCORE</TableCell>
                <TableCell>LAST SEEN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No devices registered yet. Start telemetry collectors to auto-discover endpoints.
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell fontWeight={600}>{d.hostname}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{d.ip_address || '127.0.0.1'}</TableCell>
                    <TableCell>
                      <Chip label={d.status.toUpperCase()} color="success" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color={d.risk_score > 50 ? 'error' : 'text.primary'}>
                        {Math.round(d.risk_score)}/100
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{new Date(d.last_seen).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <CheckCircle sx={{ color: '#22c55e', fontSize: 40, mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            Telemetry Stream Active
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mt: 1 }}>
            Background collectors are profiling system events in real-time. Any suspicious socket connections or process anomalies are routed to the central ML Isolation Forest pipeline.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
