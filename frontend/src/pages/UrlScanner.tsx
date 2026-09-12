import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Security,
  Language,
  Warning,
  CheckCircle,
  ErrorOutline,
  Search,
  History,
  Psychology,
  Shield,
  OpenInNew,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

interface ScanResult {
  url: string;
  domain: string;
  scheme: string;
  risk_score: number;
  risk_level: string;
  indicators: string[];
  raksha_summary: string;
  structural_breakdown?: {
    is_ip?: boolean;
    has_punycode?: boolean;
    is_https?: boolean;
    tld?: string;
    url_length?: number;
  };
}

export const UrlScanner: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/url/history?limit=10`);
      setHistory(resp.data);
    } catch (e) {
      // Backend may be offline
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleScan = async (target?: string) => {
    const urlToScan = target || urlInput;
    if (!urlToScan.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const resp = await axios.post(`${API_BASE}/url/scan`, { url: urlToScan });
      setScanResult(resp.data);
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to scan URL. Ensure KAVACH backend is active on :8000.');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#ef4444';
      case 'HIGH RISK':
        return '#f97316';
      case 'SUSPICIOUS':
        return '#eab308';
      case 'SAFE':
        return '#22c55e';
      default:
        return '#94a3b8';
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Language sx={{ color: '#38bdf8', fontSize: 32 }} />
          KAVACH URL & Phishing Security Engine
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Static lexical, Punycode IDN homograph, typosquatting, and SSRF threat inspection powered by Raksha AI.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper
        sx={{
          p: 2.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            fullWidth
            placeholder="Enter URL to inspect (e.g. https://secure-login-bank-verify.xyz/auth)..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            variant="outlined"
            size="medium"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleScan()}
            disabled={loading}
            sx={{ px: 4, minWidth: 140 }}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search />}
          >
            {loading ? 'Scanning' : 'Inspect'}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Results Section */}
      {scanResult && (
        <Grid container spacing={3}>
          {/* Main Verdict Card */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                border: `2px solid ${getLevelColor(scanResult.risk_level)}`,
                borderRadius: 2,
                boxShadow: `0 0 15px ${getLevelColor(scanResult.risk_level)}20`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Security Verdict
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: getLevelColor(scanResult.risk_level) }}>
                      {scanResult.risk_level}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h3" fontWeight={800} sx={{ color: getLevelColor(scanResult.risk_level) }}>
                      {Math.round(scanResult.risk_score)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      /100 Risk Score
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Detected Indicators ({scanResult.indicators.length}):
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {scanResult.indicators.map((ind, idx) => (
                    <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {scanResult.risk_level === 'SAFE' ? (
                          <CheckCircle sx={{ color: '#22c55e', fontSize: 18 }} />
                        ) : (
                          <Warning sx={{ color: getLevelColor(scanResult.risk_level), fontSize: 18 }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={ind}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Raksha AI Explanation Card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%',
                background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.05) 0%, rgba(15, 23, 42, 0.5) 100%)',
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Psychology sx={{ color: '#38bdf8', fontSize: 24 }} />
                  <Typography variant="h6" fontWeight={700}>
                    Raksha AI Assessment
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, flexGrow: 1 }}>
                  {scanResult.raksha_summary}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Inspected Domain: <strong>{scanResult.domain}</strong>
                  </Typography>
                  <Chip
                    label={scanResult.scheme.toUpperCase()}
                    size="small"
                    color={scanResult.scheme === 'https' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Scan History */}
      <Paper sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <History sx={{ color: 'text.secondary' }} />
          Recent URL Scan History
        </Typography>
        {history.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
            No URL scans recorded yet. Enter a URL above or browse with the KAVACH extension.
          </Typography>
        ) : (
          <List dense>
            {history.map((h, i) => (
              <ListItem
                key={h.id || i}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                  <Chip
                    label={h.risk_level || 'SAFE'}
                    size="small"
                    sx={{
                      bgcolor: `${getLevelColor(h.risk_level)}20`,
                      color: getLevelColor(h.risk_level),
                      fontWeight: 700,
                      minWidth: 80,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.url}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Risk: {Math.round(h.risk_score || 0)}/100
                  </Typography>
                  <Button size="small" variant="text" onClick={() => handleScan(h.url)}>
                    Re-test
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
