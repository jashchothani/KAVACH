import React, { useState } from 'react';
import {
  Box, Grid, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, Paper,
  Divider, useTheme
} from '@mui/material';
import { PlayArrow, RotateLeft, History } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';

const initialPlaybooks = [
  { id: 1, name: 'Host Isolation', type: 'containment', desc: 'Isolates the compromised asset from network traffic by applying null router policies.', last_executed: '3 hours ago', runs: 24, status: 'idle', approval: true },
  { id: 2, name: 'Process Termination', type: 'remediation', desc: 'Terminates parent/child execution chains matching malicious signatures.', last_executed: '12 mins ago', runs: 104, status: 'idle', approval: false },
  { id: 3, name: 'Account Lockdown', type: 'containment', desc: 'Locks active AD profiles, resets credentials and suspends VPN tokens.', last_executed: '1 day ago', runs: 12, status: 'idle', approval: true },
  { id: 4, name: 'File Quarantine', type: 'remediation', desc: 'Safely transfers suspicious local binaries to sandbox quarantine stores.', last_executed: '2 hours ago', runs: 45, status: 'idle', approval: false },
  { id: 5, name: 'Phishing Response', type: 'investigation', desc: 'Extracts message links, parses reputation metrics, and purges mailboxes.', last_executed: '5 hours ago', runs: 32, status: 'idle', approval: true },
  { id: 6, name: 'Deepfake Response', type: 'investigation', desc: 'Initiates AI models to process media channels, flags manipulation confidence.', last_executed: '4 hours ago', runs: 8, status: 'idle', approval: true },
  { id: 7, name: 'Vishing Response', type: 'investigation', desc: 'Evaluates call metadata, flags synthetic voice patterns, and blocks numbers.', last_executed: 'Yesterday', runs: 5, status: 'idle', approval: true },
];

export const SoarCenter: React.FC = () => {
  const [playbooks, setPlaybooks] = useState(initialPlaybooks);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const theme = useTheme();

  const handleExecute = (id: number) => {
    setExecutingId(id);
    setExecutionLog(['Initializing playbook triggers...', 'Verifying endpoint agent status...']);
    
    // Simulate orchestration step-by-step
    setTimeout(() => {
      setExecutionLog(prev => [...prev, 'Running heuristic process scanning...']);
    }, 1000);
    
    setTimeout(() => {
      setExecutionLog(prev => [...prev, 'Executing SOAR remediation actions...']);
    }, 2000);

    setTimeout(() => {
      setExecutionLog(prev => [...prev, 'Orchestration playbook completed. Remediation logs saved to Audit Store.']);
      // Update runs counter
      setPlaybooks(prev => prev.map(p => p.id === id ? { ...p, runs: p.runs + 1, last_executed: 'Just now' } : p));
    }, 3500);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            SOAR Orchestration Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Execute automated playbooks, trigger isolation procedures, or roll back remediations
          </Typography>
        </Box>
        <Button startIcon={<History />} variant="outlined" sx={{ fontWeight: 'bold' }}>
          Execution History
        </Button>
      </Box>

      {/* Grid of Playbooks */}
      <Grid container spacing={3}>
        {playbooks.map((playbook) => (
          <Grid item xs={12} md={6} lg={4} key={playbook.id}>
            <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
              <Box p={3} sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
                    {playbook.name}
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold',
                      textTransform: 'uppercase', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }}
                  >
                    {playbook.type}
                  </Paper>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {playbook.desc}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  Last Executed: {playbook.last_executed}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Total Runs: {playbook.runs}
                </Typography>
              </Box>

              <Box p={2} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handleExecute(playbook.id)}
                  sx={{ flex: 1, fontWeight: 'bold' }}
                >
                  Execute
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<RotateLeft />}
                  onClick={() => alert(`Initiating Rollback for: ${playbook.name}`)}
                  sx={{ fontWeight: 'bold' }}
                >
                  Rollback
                </Button>
              </Box>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* Execution Progress Modal */}
      <Dialog
        open={executingId !== null}
        onClose={() => {
          if (executionLog.length >= 5) setExecutingId(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 'bold', fontFamily: 'Outfit' }}>
          SOAR Orchestration Progress
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
          <Box 
            sx={{ 
              fontFamily: 'monospace', 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)', 
              p: 2, 
              borderRadius: 2, 
              border: `1px solid ${theme.palette.divider}`,
              minHeight: 180,
              fontSize: '0.85rem'
            }}
          >
            {executionLog.map((log, index) => (
              <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', color: index === executionLog.length - 1 ? 'primary.main' : 'text.primary', mb: 0.5 }}>
                &gt; {log}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            disabled={executionLog.length < 5} 
            variant="contained" 
            onClick={() => setExecutingId(null)}
            sx={{ fontWeight: 'bold' }}
          >
            Close Logs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
