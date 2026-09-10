import React, { useState } from 'react';
import {
  Box, Grid, Typography, TextField, MenuItem, Button,
  Divider, Paper, useTheme
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';

export const ThreatIntelligence: React.FC = () => {
  const [iocType, setIocType] = useState('ip');
  const [iocValue, setIocValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const theme = useTheme();

  const handleSearch = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setLoading(false);
      setResult({
        ioc: iocValue,
        type: iocType,
        malicious: true,
        reputation: '92.5 / 100 Risk Index',
        source: 'VirusTotal + MISP Correlated Feed',
        country: 'Russia (RU)',
        asn: 'AS48003 (Hosting Provider)',
        tags: ['APT29', 'C2 Server', 'Brute Force Infrastructure'],
        first_seen: '2024-03-15',
        last_seen: '2024-07-24'
      });
    }, 1200);
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
          Threat Intelligence Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Correlate Indicators of Compromise (IOC) against VirusTotal, MISP, and internal security logs
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Search IOC */}
        <Grid item xs={12} md={5}>
          <GlassCard sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
              Indicator Lookup
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Submit an IP address, domain name, file hash, or URL to query threat records
            </Typography>

            <TextField
              select
              label="Indicator Type"
              fullWidth
              value={iocType}
              onChange={(e) => setIocType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="ip">IP Address</MenuItem>
              <MenuItem value="domain">Domain Name</MenuItem>
              <MenuItem value="hash">File Hash (MD5/SHA256)</MenuItem>
              <MenuItem value="url">URL Link</MenuItem>
            </TextField>

            <TextField
              label="Indicator Value"
              placeholder="e.g. 45.143.203.14"
              fullWidth
              value={iocValue}
              onChange={(e) => setIocValue(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={!iocValue || loading}
              sx={{ fontWeight: 'bold' }}
            >
              {loading ? 'Querying threat feeds...' : 'Correlate IOC'}
            </Button>
          </GlassCard>
        </Grid>

        {/* Results display */}
        <Grid item xs={12} md={7}>
          <GlassCard sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {result ? (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
                    IOC Reputation Report
                  </Typography>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      px: 2, py: 0.5, borderRadius: 1, fontWeight: 'bold', fontSize: '0.75rem',
                      bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)'
                    }}
                  >
                    MALICIOUS
                  </Paper>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace', mb: 3, wordBreak: 'break-all' }}>
                  {result.ioc}
                </Typography>

                <Grid container spacing={2} mb={3}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Indicator Type</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>{result.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Threat Feed Source</Typography>
                    <Typography variant="body2" fontWeight="bold">{result.source}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Geographic Origin</Typography>
                    <Typography variant="body2" fontWeight="bold">{result.country}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Autonomous System (ASN)</Typography>
                    <Typography variant="body2" fontWeight="bold">{result.asn}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Intelligence Tags</Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                  {result.tags.map((tag: string) => (
                    <Paper 
                      key={tag} 
                      elevation={0} 
                      sx={{ 
                        px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      {tag}
                    </Paper>
                  ))}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">First Detected</Typography>
                    <Typography variant="body2" fontWeight="bold">{result.first_seen}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Last Observed</Typography>
                    <Typography variant="body2" fontWeight="bold">{result.last_seen}</Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ flexGrow: 1, py: 6, color: 'text.secondary' }}>
                <Search sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">
                  Submit an IOC value to load correlated threat data
                </Typography>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};
