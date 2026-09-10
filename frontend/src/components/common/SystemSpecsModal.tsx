import React from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Stack, useTheme
} from '@mui/material';
import {
  Cpu, Storage, CheckCircle2, Hub, Security, VerifiedUser, Memory
} from '@mui/icons-material';
import { PROJECT_DETAILS } from '../../data/projectData';

export const SystemSpecsModal: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ spaceY: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          bgcolor: isDark ? 'rgba(13, 14, 24, 0.85)' : '#FFFFFF',
          border: '1px solid rgba(193, 18, 31, 0.25)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Storage sx={{ color: '#3B82F6', fontSize: 20 }} />
          <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 800, letterSpacing: '0.04em' }}>
            TECHNICAL SPECIFICATIONS & ARCHITECTURE
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
          System Specifications, Scope & Technology Stack
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 700 }}>
          Comprehensive software/hardware requirements, sensor telemetry pipeline, and Swastik Chemical (India) OT deployment criteria.
        </Typography>
      </Paper>

      {/* Software & Hardware Specs Grid */}
      <Grid container spacing={4} mb={4}>
        {/* Software Stack */}
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            className="glass-panel-enterprise"
            sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, height: '100%' }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
                <Memory />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF' }}>
                Software Stack & Frameworks
              </Typography>
            </Box>

            <Stack spacing={1.5} sx={{ fontSize: '0.85rem' }}>
              {[
                { cat: 'Operating System', tech: 'Windows 10/11, Linux (eBPF Kernel 5.8+), macOS' },
                { cat: 'Frontend Web & 3D', tech: 'React 18, TypeScript, Three.js, WebGL 2.0, Vite' },
                { cat: 'Backend & APIs', tech: 'FastAPI, Python 3.11, Rust async DAG engine, Uvicorn' },
                { cat: 'Sensor Telemetry', tech: 'eBPF syscall hooks, Sysmon Event Logs, File Integrity Monitor' },
                { cat: 'AI / Neural Engine', tech: 'Transformer anomaly models, 48 kHz FFT audio classifier' },
                { cat: 'Database & Vault', tech: 'PostgreSQL, Redis Cache, SHA3-256 Merkle Ledger' },
                { cat: 'Standards Reference', tech: 'MITRE ATT&CK v14, NIST SP 800-61, SOC 2 Type II' },
              ].map((item) => (
                <Box
                  key={item.cat}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: '#FFFFFF', minWidth: 140 }}>{item.cat}</Typography>
                  <Typography sx={{ color: '#93C5FD', textAlign: 'right' }}>{item.tech}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Hardware Specifications */}
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            className="glass-panel-enterprise"
            sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, height: '100%' }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(193, 18, 31, 0.15)', color: '#F87171' }}>
                <Storage />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF' }}>
                Hardware Requirements (SOC Server)
              </Typography>
            </Box>

            <Stack spacing={1.5} sx={{ fontSize: '0.85rem' }}>
              {[
                { comp: 'Processor', spec: 'Intel Core i5 (8th Gen) / AMD Ryzen 5 or higher' },
                { comp: 'RAM', spec: '8 GB minimum (16 GB recommended for AI training & stream buffer)' },
                { comp: 'Storage', spec: '256 GB NVMe SSD for fast log indexing & quarantine store' },
                { comp: 'Network Adapter', spec: 'Gigabit Ethernet NIC with promiscuous packet capture' },
                { comp: 'Industrial Tap', spec: 'RS-485 / Serial out-of-band tap for legacy SCADA PLCs' },
              ].map((item) => (
                <Box
                  key={item.comp}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: '#FFFFFF', minWidth: 140 }}>{item.comp}</Typography>
                  <Typography sx={{ color: '#FBBF24', textAlign: 'right' }}>{item.spec}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
