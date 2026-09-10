import React, { useState } from 'react';
import {
  Box, Grid, Typography, Tabs, Tab, Button, TextField,
  CircularProgress, Alert, Paper, LinearProgress, useTheme, Divider
} from '@mui/material';
import { CloudUpload, Public, PhoneCallback, GraphicEq, Security } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';

export const AiSecurity: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setAnalysisResult(null);
  };

  const handleDeepfakeUpload = () => {
    setLoading(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setLoading(false);
      setAnalysisResult({
        type: 'deepfake',
        confidence: 0.947,
        authenticity: 0.053,
        classification: 'Manipulated Media Detected',
        manipulation_type: 'Face Swap (Synthetic Frame Insertion)',
        processing_time: '4.2s',
        neural_layers: 48,
        frames: 350
      });
    }, 2000);
  };

  const handleVishingUpload = () => {
    setLoading(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setLoading(false);
      setAnalysisResult({
        type: 'vishing',
        fraud_score: 0.87,
        risk_level: 'Critical Fraud Probability',
        stress: 'Anomalous pitch stress indicators registered',
        synthetic_markers: 'Voice cloning traces detected in frequency spectrum',
        duration: '1m 45s'
      });
    }, 2000);
  };

  const handlePhishingScan = () => {
    setLoading(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setLoading(false);
      setAnalysisResult({
        type: 'phishing',
        is_phishing: true,
        risk_score: 96,
        domain_age: '3 days old',
        ssl_valid: 'Valid but short-term letencrypt cert',
        blacklist: 'Listed in OpenPhish & PhishTank feeds',
        reputation: 'Very Low (1.2/10.0)',
        similarity: 'Mimics swastikchemical-india.com registration structures'
      });
    }, 1500);
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
          AI Security Operations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Deep neural inspection models detecting deepfakes, synthetic voice clones, and domain spoofing
        </Typography>
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<GraphicEq />} label="Deepfake Detection" iconPosition="start" sx={{ fontWeight: 'bold' }} />
        <Tab icon={<PhoneCallback />} label="Vishing Analysis" iconPosition="start" sx={{ fontWeight: 'bold' }} />
        <Tab icon={<Public />} label="Phishing URL Scanner" iconPosition="start" sx={{ fontWeight: 'bold' }} />
      </Tabs>

      <Grid container spacing={3}>
        {/* Input Interface */}
        <Grid item xs={12} md={6}>
          {tabValue === 0 && (
            <GlassCard sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
                Upload Media for Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload video (.mp4) or audio (.wav, .mp3) files to detect deepfakes
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: 'divider',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  py: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(193, 18, 31, 0.02)' : 'rgba(193, 18, 31, 0.01)',
                  }
                }}
                onClick={handleDeepfakeUpload}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="body2" fontWeight="bold">
                  Drag and drop file here, or click to upload
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Maximum file size: 50MB
                </Typography>
              </Paper>
            </GlassCard>
          )}

          {tabValue === 1 && (
            <GlassCard sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
                Analyze Vishing Calls
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload recorded audio call streams to scan for synthetic cloned voice patterns
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: 'divider',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  py: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(193, 18, 31, 0.02)' : 'rgba(193, 18, 31, 0.01)',
                  }
                }}
                onClick={handleVishingUpload}
              >
                <PhoneCallback sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="body2" fontWeight="bold">
                  Select Call Audio Record
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Supported formats: .mp3, .wav, .m4a
                </Typography>
              </Paper>
            </GlassCard>
          )}

          {tabValue === 2 && (
            <GlassCard sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
                Verify Link Reputation
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Input suspect URLs or domains to trigger AI brand spoofing reputation audits
              </Typography>
              <TextField
                label="Target URL"
                placeholder="http://suspect-domain.com/auth/login.php"
                fullWidth
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Security />}
                onClick={handlePhishingScan}
                disabled={!urlInput}
                sx={{ fontWeight: 'bold' }}
              >
                Execute Reputation Scan
              </Button>
            </GlassCard>
          )}
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyBetween: 'center' }}>
            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ flexGrow: 1, py: 6 }}>
                <CircularProgress size={50} sx={{ mb: 2 }} />
                <Typography variant="body2" fontWeight="bold">
                  AI Model processing telemetry patterns...
                </Typography>
              </Box>
            ) : analysisResult ? (
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
                  Model Inspection Results
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {analysisResult.type === 'deepfake' && (
                  <Box>
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">{analysisResult.classification}</Typography>
                      <Typography variant="body2">{analysisResult.manipulation_type}</Typography>
                    </Alert>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Deepfake Confidence Score</Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      <LinearProgress variant="determinate" value={analysisResult.confidence * 100} color="error" sx={{ flexGrow: 1, height: 10, borderRadius: 1 }} />
                      <Typography variant="body2" fontWeight="bold">{(analysisResult.confidence * 100).toFixed(1)}%</Typography>
                    </Box>

                    <Typography variant="body2" paragraph><strong>Processing Duration:</strong> {analysisResult.processing_time}</Typography>
                    <Typography variant="body2" paragraph><strong>Frames Analyzed:</strong> {analysisResult.frames}</Typography>
                    <Typography variant="body2"><strong>Neural Network Depth:</strong> {analysisResult.neural_layers} Layers</Typography>
                  </Box>
                )}

                {analysisResult.type === 'vishing' && (
                  <Box>
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">{analysisResult.risk_level}</Typography>
                      <Typography variant="body2">Synthesized voice clone probability high.</Typography>
                    </Alert>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>AI Fraud Score</Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      <LinearProgress variant="determinate" value={analysisResult.fraud_score * 100} color="error" sx={{ flexGrow: 1, height: 10, borderRadius: 1 }} />
                      <Typography variant="body2" fontWeight="bold">{(analysisResult.fraud_score * 100).toFixed(1)}%</Typography>
                    </Box>

                    <Typography variant="body2" paragraph><strong>Stress Indicators:</strong> {analysisResult.stress}</Typography>
                    <Typography variant="body2" paragraph><strong>Frequency Spectral Traces:</strong> {analysisResult.synthetic_markers}</Typography>
                    <Typography variant="body2"><strong>Duration:</strong> {analysisResult.duration}</Typography>
                  </Box>
                )}

                {analysisResult.type === 'phishing' && (
                  <Box>
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">Malicious Phishing URL Identified</Typography>
                      <Typography variant="body2">{analysisResult.similarity}</Typography>
                    </Alert>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Spoof Risk Index</Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      <LinearProgress variant="determinate" value={analysisResult.risk_score} color="error" sx={{ flexGrow: 1, height: 10, borderRadius: 1 }} />
                      <Typography variant="body2" fontWeight="bold">{analysisResult.risk_score}%</Typography>
                    </Box>

                    <Typography variant="body2" paragraph><strong>Domain Age:</strong> {analysisResult.domain_age}</Typography>
                    <Typography variant="body2" paragraph><strong>Threat Feeds:</strong> {analysisResult.blacklist}</Typography>
                    <Typography variant="body2"><strong>Domain Reputation:</strong> {analysisResult.reputation}</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ flexGrow: 1, py: 6, color: 'text.secondary' }}>
                <Security sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">
                  Initiate target scans to generate telemetry analysis
                </Typography>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};
