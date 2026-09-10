import React, { useState } from 'react';
import {
  Box, Container, Typography, Grid, Paper, Card, CardContent,
  Button, Chip, Stack, useTheme, IconButton
} from '@mui/material';
import {
  Download, DesktopWindows, Terminal, Apple, PhoneIphone,
  ContentCopy, Check
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const DownloadPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const dockerCommand = "docker run -d --name kavach-agent --net=host -v /var/run/docker.sock:/var/run/docker.sock -e KAVACH_KEY=YOUR_API_KEY kavach/agent:latest";
  const linuxInstallScript = "curl -fsSL https://kavach.swastikchemical.in/install.sh | sudo bash";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const downloads = [
    {
      os: 'Windows x64 / ARM64',
      icon: <DesktopWindows sx={{ fontSize: 40, color: '#00ADEF' }} />,
      ver: 'v2.4.2 Stable',
      filename: 'kavach-agent-setup-v2.4.2.msi',
      size: '42.8 MB',
      sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      type: 'msi',
    },
    {
      os: 'Linux (Ubuntu/Debian/RHEL)',
      icon: <Terminal sx={{ fontSize: 40, color: '#FCC624' }} />,
      ver: 'v2.4.2 Daemon',
      filename: 'kavach-agent_2.4.2_amd64.deb',
      size: '28.4 MB',
      sha: 'd41d8cd98f00b204e9800998ecf8427e997e06a5a04595e865f3f0c3a502691b',
      type: 'deb',
    },
    {
      os: 'macOS (Apple Silicon & Intel)',
      icon: <Apple sx={{ fontSize: 40, color: isDark ? '#FFFFFF' : '#000000' }} />,
      ver: 'v2.4.2 Universal',
      filename: 'KavachAgent-2.4.2.pkg',
      size: '38.1 MB',
      sha: '7d793037a0760186574b0282f2f435e7b1e737b640a3407c6f05e3f1624c965c',
      type: 'pkg',
    }
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<Download sx={{ color: '#C1121F !important' }} />}
              label="KAVACH AGENT DOWNLOAD & DEPLOYMENT CENTER"
              sx={{ bgcolor: 'rgba(193, 18, 31, 0.1)', color: '#C1121F', fontWeight: 800, mb: 2 }}
            />
            <Typography variant="h1" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 2 }}>
              Deploy Endpoint & Server Protection
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 750, mx: 'auto', fontWeight: 400 }}>
              Download official lightweight security agents engineered by <strong>Swastik Chemical (India)</strong> for enterprise endpoints, servers, containers, and OT nodes.
            </Typography>
          </motion.div>
        </Box>

        {/* Desktop OS Download Cards */}
        <Grid container spacing={4} mb={8}>
          {downloads.map((item, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }}>
                <Card
                  className="crimson-glow-card"
                  sx={{
                    height: '100%',
                    bgcolor: isDark ? '#0D0D14' : '#FFFFFF',
                    border: '1px solid rgba(193, 18, 31, 0.2)',
                    borderRadius: 4,
                    p: 1
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box p={1.5} borderRadius={3} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                        {item.icon}
                      </Box>
                      <Chip label={item.ver} size="small" sx={{ bgcolor: 'rgba(193, 18, 31, 0.15)', color: '#C1121F', fontWeight: 800 }} />
                    </Box>

                    <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'Outfit', mb: 1 }}>
                      {item.os}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      File: {item.filename} ({item.size})
                    </Typography>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => alert(`Downloading ${item.filename}...`)}
                      sx={{
                        background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                        fontWeight: 800,
                        py: 1.3,
                        borderRadius: 2.5,
                        boxShadow: '0 4px 15px rgba(193, 18, 31, 0.4)',
                        mb: 2,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #E63946 0%, #C1121F 100%)',
                        }
                      }}
                    >
                      Download Agent ({item.type.toUpperCase()})
                    </Button>

                    <Box p={1.5} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        SHA-256: {item.sha}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Docker & Container 1-Click Installation Terminal */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            bgcolor: isDark ? '#08080D' : '#0F172A',
            color: '#FFFFFF',
            borderRadius: 4,
            border: '1px solid rgba(193, 18, 31, 0.3)',
            mb: 8,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Terminal sx={{ color: '#C1121F', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
              1-Click Docker & Kubernetes Container Deployment
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
            Run KAVACH agent as a non-intrusive background container on Linux servers, cloud instances, or Kubernetes clusters.
          </Typography>

          <Box mb={3}>
            <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 700, mb: 1, display: 'block' }}>
              Docker Run Terminal Command:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#040406',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#34D399',
                overflowX: 'auto',
              }}
            >
              <code>{dockerCommand}</code>
              <IconButton
                onClick={() => handleCopy(dockerCommand, 'docker')}
                size="small"
                sx={{ color: '#E2E8F0', ml: 2 }}
              >
                {copiedCmd === 'docker' ? <Check sx={{ color: '#10B981' }} /> : <ContentCopy />}
              </IconButton>
            </Paper>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 700, mb: 1, display: 'block' }}>
              Linux One-Liner Install Script:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#040406',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#F59E0B',
                overflowX: 'auto',
              }}
            >
              <code>{linuxInstallScript}</code>
              <IconButton
                onClick={() => handleCopy(linuxInstallScript, 'linux')}
                size="small"
                sx={{ color: '#E2E8F0', ml: 2 }}
              >
                {copiedCmd === 'linux' ? <Check sx={{ color: '#10B981' }} /> : <ContentCopy />}
              </IconButton>
            </Paper>
          </Box>
        </Paper>

        {/* Mobile App Download Card */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: isDark ? '#0D0D14' : '#FFFFFF',
            border: '1px solid rgba(193, 18, 31, 0.2)',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                <PhoneIphone sx={{ color: '#C1121F', fontSize: 32 }} />
                <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
                  KAVACH Mobile SOC Companion App
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Receive real-time push alerts, approve critical playbook isolations, and monitor threat telemetry from your mobile device.
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => alert('Downloading Android APK...')}
                  sx={{ borderColor: 'rgba(193, 18, 31, 0.5)', color: isDark ? '#FFFFFF' : '#C1121F', fontWeight: 700 }}
                >
                  Download Android APK
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Apple />}
                  onClick={() => alert('Opening iOS TestFlight link...')}
                  sx={{ borderColor: 'rgba(193, 18, 31, 0.5)', color: isDark ? '#FFFFFF' : '#C1121F', fontWeight: 700 }}
                >
                  iOS TestFlight Setup
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4} textAlign="center">
              <Download sx={{ fontSize: 100, color: '#C1121F', opacity: 0.3, filter: 'drop-shadow(0 0 20px rgba(193, 18, 31, 0.5))' }} />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};
