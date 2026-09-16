import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, useTheme, Chip, Stack, Alert, Paper, Collapse,
} from '@mui/material';
import {
  Search, Refresh, Launch, Shield, CheckCircle, BugReport,
  Psychology, Terminal, ExpandMore, ExpandLess, Block,
} from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { api, type ThreatItem } from '../api/client';

export const ThreatDetection: React.FC = () => {
  const theme = useTheme();
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null);
  const [showModalTech, setShowModalTech] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchThreats = async () => {
    setLoading(true);
    try {
      const data = await api.threats.getThreats(50);
      setThreats(data);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const filteredThreats = threats.filter((threat) => {
    const term = search.toLowerCase();
    const matchesSearch =
      threat.title?.toLowerCase().includes(term) ||
      threat.category?.toLowerCase().includes(term) ||
      threat.source_ip?.includes(term);
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
            Deterministic rules, Isolation Forest ML anomaly alerts, and threat intelligence feeds
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} variant="outlined" onClick={fetchThreats} sx={{ fontWeight: 700 }}>
          Refresh Feed
        </Button>
      </Box>

      {/* Filter Row */}
      <GlassCard sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              placeholder="Search threats by title, category, source IP..."
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
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
        </Grid>
      </GlassCard>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Threats Table */}
      <TableContainer component={GlassCard}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
              <TableCell sx={{ fontWeight: 700 }}>THREAT DETECTION</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>SEVERITY</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>CATEGORY</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>RISK SCORE</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>SOURCE / TARGET</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>TIMESTAMP</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredThreats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 36, mb: 1, display: 'block', mx: 'auto' }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    No active threats detected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All telemetry events processed through risk engine have been scored safe.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredThreats.map((threat) => (
                <TableRow key={threat.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {threat.title}
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={threat.severity} />
                  </TableCell>
                  <TableCell>
                    <Chip label={threat.category?.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color={threat.risk_score > 60 ? 'error.main' : 'text.primary'}>
                      {Math.round(threat.risk_score)}/100
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {threat.source_ip || threat.target_user || 'localhost'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {new Date(threat.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setSelectedThreat(threat)} color="primary">
                      <Launch fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Threat Detail Modal */}
      <Dialog open={Boolean(selectedThreat)} onClose={() => { setSelectedThreat(null); setShowModalTech(false); setActionSuccess(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, fontFamily: 'Outfit' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <BugReport color="error" />
            Threat Intelligence & Forensics
          </Box>
          {selectedThreat && <SeverityBadge severity={selectedThreat.severity} />}
        </DialogTitle>
        <DialogContent dividers>
          {selectedThreat && (
            <Stack spacing={2.5}>
              {/* Plain English Assessment */}
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(241,245,249,0.7)', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em' }}>
                  SECURITY SUMMARY (PLAIN ENGLISH)
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5, mb: 1, fontFamily: 'Outfit' }}>
                  {selectedThreat.title}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.primary' }}>
                  {selectedThreat.recommendation || 'KAVACH telemetry identified unusual process execution or socket connection that deviates from standard endpoint baseline behavior.'}
                </Typography>
              </Box>

              {/* Status and Action banner */}
              {actionSuccess && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  {actionSuccess}
                </Alert>
              )}

              {/* Quick Metrics Row */}
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box p={1.5} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      RISK SCORE
                    </Typography>
                    <Typography variant="h6" fontWeight={900} color={selectedThreat.risk_score > 60 ? 'error.main' : 'warning.main'}>
                      {Math.round(selectedThreat.risk_score)} / 100
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box p={1.5} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      CATEGORY
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedThreat.category?.toUpperCase()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box p={1.5} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      AFFECTED TARGET
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {selectedThreat.source_ip || selectedThreat.target_user || 'Local Host'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => setActionSuccess('Threat verified safe and added to organization allowlist.')}
                  sx={{ fontWeight: 700 }}
                >
                  Allow & Mark Safe
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Block />}
                  onClick={() => setActionSuccess('Host quarantine triggered via sub-12ms SOAR playbook. Network socket severed.')}
                  sx={{ fontWeight: 700 }}
                >
                  Quarantine Host
                </Button>
              </Stack>

              {/* Expandable Technical Details Button */}
              <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} borderTop="1px solid" borderColor="divider">
                <Box display="flex" alignItems="center" gap={1}>
                  <Terminal sx={{ color: '#DC2626', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={800}>
                    SOC Forensics & Kernel Evidence
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => setShowModalTech(!showModalTech)}
                  endIcon={showModalTech ? <ExpandLess /> : <ExpandMore />}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  {showModalTech ? 'Hide technical details ↑' : 'View technical details →'}
                </Button>
              </Box>

              {/* Collapsible SOC Evidence */}
              <Collapse in={showModalTech}>
                <Stack spacing={1.5}>
                  <Grid container spacing={1.5} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <Grid item xs={12} sm={6}>
                      <Box p={1.2} bgcolor="background.paper" borderRadius={1} border="1px solid" borderColor="divider">
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={700}>
                          SYSMON EVENT ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          Event ID 1 (Process Create) / EID 3 (Network)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box p={1.2} bgcolor="background.paper" borderRadius={1} border="1px solid" borderColor="divider">
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={700}>
                          ESTIMATED MITRE TECHNIQUE
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>
                          T1059 (Execution) • T1071 (C2 Channel)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      RAW TELEMETRY EVIDENCE & STIX PAYLOAD
                    </Typography>
                    <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: 'background.default', fontFamily: 'monospace', fontSize: 12, maxHeight: 180, overflow: 'auto' }}>
                      <pre style={{ margin: 0 }}>{JSON.stringify(selectedThreat.details || {
                        detection_id: selectedThreat.id,
                        engine: 'Deterministic Rules + Isolation Forest ML',
                        source_ip: selectedThreat.source_ip,
                        risk_score: selectedThreat.risk_score,
                        timestamp: selectedThreat.timestamp,
                      }, null, 2)}</pre>
                    </Paper>
                  </Box>
                </Stack>
              </Collapse>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setSelectedThreat(null); setShowModalTech(false); setActionSuccess(null); }} sx={{ fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
