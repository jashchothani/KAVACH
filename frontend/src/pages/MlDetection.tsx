import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  AutoGraph,
  ModelTraining,
  CheckCircle,
  Warning,
  InfoOutlined,
  Refresh,
  Speed,
  Psychology,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export const MlDetection: React.FC = () => {
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/ml/status`);
      setMlStatus(resp.data);
    } catch (e) {
      // Backend offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRetrain = async () => {
    setTraining(true);
    setTrainMessage(null);
    try {
      const resp = await axios.post(`${API_BASE}/ml/train`);
      setTrainMessage({
        type: 'success',
        text: `Model successfully trained! New version: ${resp.data.version} on ${resp.data.samples_trained} samples.`,
      });
      fetchStatus();
    } catch (err: any) {
      setTrainMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Retraining failed: Insufficient clean telemetry events in database.',
      });
    } finally {
      setTraining(false);
    }
  };

  if (loading && !mlStatus) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isFitted = mlStatus?.is_fitted;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AutoGraph sx={{ color: '#a855f7', fontSize: 32 }} />
            KAVACH Adaptive Isolation Forest Engine
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Unsupervised machine learning for profiling zero-day process and network deviations without synthetic hallucinations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={training ? <CircularProgress size={18} color="inherit" /> : <ModelTraining />}
          onClick={handleRetrain}
          disabled={training}
          sx={{ px: 3, bgcolor: '#9333ea', '&:hover': { bgcolor: '#7e22ce' } }}
        >
          {training ? 'Training Model...' : 'Train Model'}
        </Button>
      </Box>

      {trainMessage && (
        <Alert severity={trainMessage.type} onClose={() => setTrainMessage(null)}>
          {trainMessage.text}
        </Alert>
      )}

      {/* Model Diagnostic KPI Cards */}
      <Grid container spacing={3}>
        {/* Status */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                MODEL STATUS
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {isFitted ? (
                  <Chip icon={<CheckCircle />} label="ACTIVE & INFERRING" color="success" size="small" />
                ) : (
                  <Chip icon={<Warning />} label="INSUFFICIENT DATA" color="warning" size="small" />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                {isFitted
                  ? 'Model active in telemetry pipeline'
                  : `Requires >= ${mlStatus?.min_samples_required || 50} telemetry events to train`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Model Version */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                MODEL VERSION
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1, color: 'text.primary', fontFamily: 'monospace' }}>
                {mlStatus?.version || 'None'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ID: {mlStatus?.model_id || 'uninitialized'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sample Count */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TRAINED SAMPLES
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1, color: '#38bdf8' }}>
                {mlStatus?.current_sample_count || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Target Contamination: {((mlStatus?.contamination || 0.05) * 100).toFixed(0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Algorithm */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                ALGORITHM
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1, color: '#a855f7' }}>
                Isolation Forest
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                scikit-learn (100 estimators)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feature Engineering Schema */}
      <Paper sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Speed sx={{ color: '#38bdf8' }} />
          Mathematical Feature Engineering Layer (10 Dimensions)
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Raw strings are never blindly fed to Isolation Forest. Every telemetry event is mathematically normalized into a 10-dimensional vector:
        </Typography>

        <Grid container spacing={1.5}>
          {(mlStatus?.feature_schema || []).map((feat: string, i: number) => (
            <Grid item xs={12} sm={6} md={4} key={feat}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Chip label={`D${i + 1}`} size="small" sx={{ bgcolor: '#a855f720', color: '#c084fc', fontWeight: 700 }} />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                  {feat}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Educational & Architectural Guarantees Card */}
      <Paper
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, rgba(15, 23, 42, 0.6) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Psychology sx={{ color: '#a855f7', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700}>
            KAVACH Anti-Hallucination & Calibration Guarantee
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          Unlike generic tools that label heuristic rules as &quot;AI&quot;, KAVACH strictly separates:
          <br />• <strong>Raw Anomaly Score:</strong> The raw continuous decision function output of Isolation Forest (negative implies deviation).
          <br />• <strong>Anomaly Percentile:</strong> Normalized statistical distance from the cluster centroid.
          <br />• <strong>Evidence Coverage:</strong> The proportion of observable dimensions active in the telemetry vector.
          <br />• <strong>Insufficient Data State:</strong> If baseline events are below the required threshold, KAVACH reports <em>&quot;Insufficient Data&quot;</em> instead of fabricating synthetic confidence scores.
        </Typography>
      </Paper>
    </Box>
  );
};
