import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, Paper,
  Divider, useTheme, CircularProgress
} from '@mui/material';
import { PlayArrow, RotateLeft, History } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../api/client';

export const SoarCenter: React.FC = () => {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const theme = useTheme();

  const fetchPlaybooks = async () => {
    try {
      const data = await api.playbooks.list();
      setPlaybooks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    setExecutionLog(['Initializing playbook triggers...', 'Connecting to KAVACH backend...']);
    
    try {
      const res = await api.playbooks.execute(id);
      setExecutionLog(prev => [
        ...prev, 
        `Playbook executed successfully.`,
        `Status: ${res.status}`,
        `Action: ${res.action_taken}`
      ]);
      await fetchPlaybooks(); // Refresh list to update any run counts if they were tracked
    } catch (e: any) {
      setExecutionLog(prev => [...prev, `Execution failed: ${e.message}`]);
    }
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
      {loading ? (
        <Box p={4} textAlign="center">
          <CircularProgress />
        </Box>
      ) : playbooks.length === 0 ? (
        <Box p={4} textAlign="center">
          <Typography color="text.secondary">No playbooks found.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {playbooks.map(pb => (
            <Grid item xs={12} md={6} lg={4} key={pb.id}>
              <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box p={3} sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
                      {pb.name}
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold',
                        textTransform: 'uppercase', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                      }}
                    >
                      {pb.type || pb.category || 'action'}
                    </Paper>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {pb.description}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Total Runs: {pb.runs || 0}
                  </Typography>
                </Box>
  
                <Box p={2} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={executingId === pb.id ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
                    onClick={() => handleExecute(pb.id)}
                    disabled={executingId === pb.id}
                    sx={{ flex: 1, fontWeight: 'bold' }}
                  >
                    {executingId === pb.id ? 'Running...' : 'Execute'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<RotateLeft />}
                    onClick={() => alert(`Initiating Rollback for: ${pb.name}`)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Rollback
                  </Button>
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      )}

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
