import React, { useState } from 'react';
import {
  Box, Grid, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, MenuItem,
  TextField, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, ListItem, ListItemText, List, useTheme
} from '@mui/material';
import { Add, Launch, Save, Escalator } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';

const initialIncidents = [
  { id: 1, title: 'Ransomware outbreak on production servers', severity: 'critical', status: 'open', assigned_to: 'Kavach Admin', escalation: 2, timeline: ['Incident created by AI correlation', 'Assigned to Kavach Admin', 'Isolation playbook executed'], evidence: ['file_hash:d2e4f58c7...', 'traffic_dump.pcap'], notes: 'Host isolated. Checking backup snapshots for restore eligibility.' },
  { id: 2, title: 'Unauthorized access to financial database', severity: 'high', status: 'investigating', assigned_to: 'SOC Analyst', escalation: 1, timeline: ['Alert flagged by network analyzer', 'Assigned to SOC Analyst'], evidence: ['db_audit_log_2024.csv'], notes: 'Identified compromise of service account. Resetting credentials.' },
  { id: 3, title: 'Phishing campaign targeting executive team', severity: 'medium', status: 'contained', assigned_to: 'Incident Responder', escalation: 0, timeline: ['Reported by executive assistant', 'Domain blocked on mail gateway'], evidence: ['phishing_mail_headers.txt'], notes: 'Identified 3 clicks. Run endpoint scans on target workstations.' },
  { id: 4, title: 'Suspicious lateral movement in DMZ', severity: 'high', status: 'resolved', assigned_to: 'Kavach Admin', escalation: 0, timeline: ['Rule matched on firewall logs', 'Host quarantined', 'Incident closed'], evidence: ['netflow_dmz_record.json'], notes: 'Legitimate DevOps testing session. Excluded pattern from rules.' }
];

export const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [selectedIncident, setSelectedIncident] = useState<typeof initialIncidents[0] | null>(null);
  const [_newNote, _setNewNote] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentSev, setNewIncidentSev] = useState('medium');
  const theme = useTheme();

  const handleEscalate = (id: number) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, escalation: i.escalation + 1, timeline: [...i.timeline, `Incident escalated to Level ${i.escalation + 1}`] } : i));
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(prev => prev ? { ...prev, escalation: prev.escalation + 1, timeline: [...prev.timeline, `Incident escalated to Level ${prev.escalation + 1}`] } : null);
    }
  };

  const handleSaveNotes = () => {
    if (!selectedIncident) return;
    setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? { ...i, notes: selectedIncident.notes } : i));
    alert('Investigation notes updated successfully.');
  };

  const handleCreateIncident = () => {
    const newInc = {
      id: incidents.length + 1,
      title: newIncidentTitle,
      severity: newIncidentSev,
      status: 'open',
      assigned_to: 'Kavach Admin',
      escalation: 0,
      timeline: ['Incident created manually'],
      evidence: [],
      notes: ''
    };
    setIncidents(prev => [newInc, ...prev]);
    setOpenCreate(false);
    setNewIncidentTitle('');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            Incident Response Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage active investigations, escalations, timelines, and audit trails
          </Typography>
        </Box>
        <Button 
          startIcon={<Add />} 
          variant="contained" 
          onClick={() => setOpenCreate(true)}
          sx={{ fontWeight: 'bold', boxShadow: '0 4px 15px rgba(193, 18, 31, 0.3)' }}
        >
          Create Incident
        </Button>
      </Box>

      {/* Incident List */}
      <TableContainer component={GlassCard} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Incident Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Assignee</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Escalation</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Investigate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id} hover>
                <TableCell>INC-{incident.id.toString().padStart(3, '0')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{incident.title}</TableCell>
                <TableCell><SeverityBadge severity={incident.severity} /></TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Chip 
                    label={incident.status} 
                    size="small" 
                    color={incident.status === 'open' ? 'error' : incident.status === 'resolved' ? 'success' : 'default'} 
                    sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.6rem' }} 
                  />
                </TableCell>
                <TableCell>{incident.assigned_to}</TableCell>
                <TableCell>Lvl {incident.escalation}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => setSelectedIncident(incident)}>
                    <Launch fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Incident details dialog */}
      <Dialog
        open={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        {selectedIncident && (
          <>
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
                  INC-{selectedIncident.id.toString().padStart(3, '0')}: {selectedIncident.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assigned to: {selectedIncident.assigned_to}
                </Typography>
              </Box>
              <SeverityBadge severity={selectedIncident.severity} />
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Notes & details */}
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Investigation Notes</Typography>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={selectedIncident.notes}
                    onChange={(e) => setSelectedIncident({ ...selectedIncident, notes: e.target.value })}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    startIcon={<Save />} 
                    onClick={handleSaveNotes}
                    sx={{ mr: 2, fontWeight: 'bold' }}
                  >
                    Save Notes
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<Escalator />} 
                    onClick={() => handleEscalate(selectedIncident.id)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Escalate Priority
                  </Button>
                </Grid>

                {/* Timeline & Evidence */}
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Investigation Timeline</Typography>
                  <List dense sx={{ mb: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)', borderRadius: 2, p: 1 }}>
                    {selectedIncident.timeline.map((step, idx) => (
                      <ListItem key={idx}>
                        <ListItemText 
                          primary={step} 
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Evidence Files</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedIncident.evidence.length > 0 ? (
                      selectedIncident.evidence.map((file, idx) => (
                        <Chip key={idx} label={file} variant="outlined" size="small" sx={{ fontFamily: 'monospace' }} />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">No files attached</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button onClick={() => setSelectedIncident(null)} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Incident Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Create New Incident Ticket</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Incident Title"
            fullWidth
            value={newIncidentTitle}
            onChange={(e) => setNewIncidentTitle(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            select
            label="Severity"
            fullWidth
            value={newIncidentSev}
            onChange={(e) => setNewIncidentSev(e.target.value)}
          >
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateIncident} variant="contained" disabled={!newIncidentTitle}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
