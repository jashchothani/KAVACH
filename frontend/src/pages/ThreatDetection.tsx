import React, { useState } from 'react';
import {
  Box, Grid, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, useTheme
} from '@mui/material';
import { Search, FilterList, Refresh, Launch, Shield, CheckCircle } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';

// Static representation of threat data matching API schemas
const initialThreats = [
  { id: 1, name: 'LockBit 3.0 Ransomware signature matched', threat_type: 'Ransomware', severity: 'critical', status: 'active', confidence: 0.98, detected_at: '2024-07-24 09:12:45', endpoint: 'PROD-DB-02', mitre: 'T1486 - Data Encrypted for Impact', ioc: 'd2e4f58c7391bcf892e850b100913801f464010372df03d7b8ac0f64c6bc9c6e', action: 'Quarantine File & Isolate Host', ai_analysis: 'AI Confidence analysis correlates this execution with known ransomware behavior patterns. Threat actor origin indicators point towards LockBit groups.' },
  { id: 2, name: 'Anomalous SSH login attempts (brute-force)', threat_type: 'Brute Force', severity: 'high', status: 'investigating', confidence: 0.89, detected_at: '2024-07-24 09:05:12', endpoint: 'DEV-APP-03', mitre: 'T1110 - Brute Force', ioc: '185.220.101.5', action: 'Block Source IP', ai_analysis: 'Neural networks flagged SSH traffic as an anomalous frequency burst. Source IP correlates with active malicious exit nodes.' },
  { id: 3, name: 'Command & scripting interpreter execution', threat_type: 'Malware', severity: 'high', status: 'contained', confidence: 0.91, detected_at: '2024-07-24 08:52:00', endpoint: 'PROD-WEB-01', mitre: 'T1059 - Command and Scripting Interpreter', ioc: 'powershell -nop -w hidden -c ...', action: 'Kill Process Tree', ai_analysis: 'Obfuscated PowerShell code detected. Correlates to dynamic API call injection methods typical in dropper malware.' },
  { id: 4, name: 'Phishing email URL harvest click', threat_type: 'Phishing', severity: 'medium', status: 'resolved', confidence: 0.76, detected_at: '2024-07-24 07:15:30', endpoint: 'HR-WS-04', mitre: 'T1566 - Phishing', ioc: 'http://secure-login-swastikchem.co/auth/login.php', action: 'Lock Account & Trigger MFA Reset', ai_analysis: 'Domain reputation analysis indicates domain registered less than 24 hours ago. Structure mimics Swastik Chem portals.' },
  { id: 5, name: 'DNS Tunneling exfiltration pattern', threat_type: 'Data Exfiltration', severity: 'critical', status: 'active', confidence: 0.95, detected_at: '2024-07-24 06:40:11', endpoint: 'CHEM-IOT-07', mitre: 'T1041 - Exfiltration Over C2 Channel', ioc: 'cx.z-domain-auth.com', action: 'Block DNS Request & Alert IR Team', ai_analysis: 'Unusual query volume patterns on non-standard subdomain queries. Highly indicative of command-and-control communication.' },
  { id: 6, name: 'Anomalous scheduled job created', threat_type: 'Persistence', severity: 'medium', status: 'active', confidence: 0.68, detected_at: '2024-07-24 05:22:15', endpoint: 'ADMIN-WS-08', mitre: 'T1053 - Scheduled Task/Job', ioc: 'Task: updater_system_cron', action: 'Inspect Task Details', ai_analysis: 'Scheduled cron execution matches naming convention of system services but resolves to user space path.' }
];

export const ThreatDetection: React.FC = () => {
  const [threats, _setThreats] = useState(initialThreats);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedThreat, setSelectedThreat] = useState<typeof initialThreats[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const filteredThreats = threats.filter((threat) => {
    const matchesSearch = threat.name.toLowerCase().includes(search.toLowerCase()) || 
                          threat.endpoint.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            Threat Detection Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Continuous threat auditing, telemetry scanning, and heuristic evaluations
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} variant="outlined" onClick={handleRefresh} sx={{ fontWeight: 'bold' }}>
          Refresh Feed
        </Button>
      </Box>

      {/* Filter Row */}
      <GlassCard sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              placeholder="Search threats by name or target host..."
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Severity"
              fullWidth
              size="small"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <MenuItem value="all">All Severities</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<FilterList />}
              sx={{ fontWeight: 'bold' }}
            >
              Advanced Filters
            </Button>
          </Grid>
        </Grid>
      </GlassCard>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Threat List Table */}
      <TableContainer component={GlassCard}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Detection Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Threat Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Endpoint</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Confidence</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Investigation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredThreats.map((threat) => (
              <TableRow key={threat.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>{threat.detected_at}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{threat.name}</TableCell>
                <TableCell>{threat.endpoint}</TableCell>
                <TableCell><SeverityBadge severity={threat.severity} /></TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{threat.status}</TableCell>
                <TableCell>{(threat.confidence * 100).toFixed(0)}%</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => setSelectedThreat(threat)}>
                    <Launch fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Threat Details Drawer/Modal */}
      <Dialog
        open={Boolean(selectedThreat)}
        onClose={() => setSelectedThreat(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        {selectedThreat && (
          <>
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
                  {selectedThreat.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Detected at: {selectedThreat.detected_at}
                </Typography>
              </Box>
              <SeverityBadge severity={selectedThreat.severity} />
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Target Endpoint</Typography>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>{selectedThreat.endpoint}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>MITRE ATT&CK Technique</Typography>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>{selectedThreat.mitre}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>Indicators of Compromise (IOC)</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', 
                      p: 1.5, 
                      borderRadius: 1.5,
                      wordBreak: 'break-all',
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    {selectedThreat.ioc}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Recommended SOAR Playbook Action</Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Shield color="primary" />
                    <Typography variant="body1" fontWeight="bold" color="primary">{selectedThreat.action}</Typography>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>AI Threat Analysis</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {selectedThreat.ai_analysis}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button onClick={() => setSelectedThreat(null)} variant="outlined">
                Dismiss
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<CheckCircle />}
                onClick={() => {
                  alert(`Executing Action: ${selectedThreat.action}`);
                  setSelectedThreat(null);
                }}
                sx={{ fontWeight: 'bold' }}
              >
                Execute Auto-Response
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
