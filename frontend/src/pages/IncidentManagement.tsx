import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, MenuItem,
  TextField, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, ListItem, ListItemText, List, useTheme, LinearProgress,
  Stack, Alert,
} from '@mui/material';
import { Launch, Refresh, Assignment, CheckCircle } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { api } from '../api/client';

export const IncidentManagement: React.FC = () => {
  const theme = useTheme();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.threats.getIncidents(50);
      setIncidents(data);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedIncident || !statusUpdate) return;
    try {
      await api.threats.updateIncident(selectedIncident.id, { status: statusUpdate });
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === selectedIncident.id ? { ...i, status: statusUpdate } : i
        )
      );
      setSelectedIncident({ ...selectedIncident, status: statusUpdate });
      setFeedback('Incident status updated successfully.');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to update status.');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            Incident Management & SOAR Response
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cross-correlated multi-stage security incidents, forensic timelines, and root cause analysis
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} variant="outlined" onClick={fetchIncidents} sx={{ fontWeight: 700 }}>
          Refresh Queue
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <TableContainer component={GlassCard}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
              <TableCell sx={{ fontWeight: 700 }}>INCIDENT TITLE</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>SEVERITY</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ASSIGNED TO</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>CREATED AT</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">INVESTIGATE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 40, mb: 1, display: 'block', mx: 'auto' }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    No Open Security Incidents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All telemetry events and alerts have been addressed or contained.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              incidents.map((inc) => (
                <TableRow key={inc.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {inc.title}
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={inc.severity || 'high'} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inc.status?.toUpperCase() || 'OPEN'}
                      size="small"
                      color={
                        inc.status === 'open'
                          ? 'error'
                          : inc.status === 'investigating'
                          ? 'warning'
                          : 'success'
                      }
                      sx={{ fontWeight: 700, fontSize: 10 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {inc.assigned_to || 'SOC Team'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {inc.created_at ? new Date(inc.created_at).toLocaleString() : 'Just now'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedIncident(inc);
                        setStatusUpdate(inc.status || 'open');
                      }}
                    >
                      <Launch fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Incident Detail Modal */}
      <Dialog open={Boolean(selectedIncident)} onClose={() => setSelectedIncident(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment color="primary" />
          Incident Details & SOAR Timeline
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncident && (
            <Stack spacing={2.5}>
              {feedback && <Alert severity="info">{feedback}</Alert>}

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  INCIDENT TITLE
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {selectedIncident.title}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    SEVERITY
                  </Typography>
                  <Box mt={0.5}>
                    <SeverityBadge severity={selectedIncident.severity || 'high'} />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    ASSIGNED TO
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600} mt={0.5}>
                    {selectedIncident.assigned_to || 'SOC Analyst'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    STATUS
                  </Typography>
                  <Box mt={0.5}>
                    <TextField
                      select
                      size="small"
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      sx={{ minWidth: 140 }}
                    >
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="investigating">Investigating</MenuItem>
                      <MenuItem value="contained">Contained</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                    </TextField>
                  </Box>
                </Grid>
              </Grid>

              {selectedIncident.root_cause && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    ROOT CAUSE ANALYSIS
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedIncident.root_cause}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary" sx={{ fontWeight: 700 }}>
            Save Status
          </Button>
          <Button onClick={() => setSelectedIncident(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
