import React from 'react';
import { Box, Grid, Typography, Button, useTheme } from '@mui/material';
import { Download } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, Legend
} from 'recharts';

const trendData = [
  { name: 'Jan', threats: 120, incidents: 40 },
  { name: 'Feb', threats: 150, incidents: 45 },
  { name: 'Mar', threats: 180, incidents: 50 },
  { name: 'Apr', threats: 140, incidents: 35 },
  { name: 'May', threats: 210, incidents: 60 },
  { name: 'Jun', threats: 190, incidents: 55 },
  { name: 'Jul', threats: 240, incidents: 70 },
];

const scoreTrend = [
  { name: 'Wk 1', score: 82 },
  { name: 'Wk 2', score: 84 },
  { name: 'Wk 3', score: 83 },
  { name: 'Wk 4', score: 87.5 },
];

const healthData = [
  { name: 'Online', count: 142, fill: '#10B981' },
  { name: 'Offline', count: 8, fill: '#64748B' },
  { name: 'Isolated', count: 3, fill: '#EF4444' },
  { name: 'Compromised', count: 3, fill: '#F59E0B' },
];

export const Analytics: React.FC = () => {
  const theme = useTheme();

  const handleExport = (format: string) => {
    alert(`Exporting security metrics to ${format.toUpperCase()}...`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            Executive Reporting & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Long-term threat trends, incident tracking and endpoint risk reports
          </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button startIcon={<Download />} variant="outlined" onClick={() => handleExport('csv')} sx={{ fontWeight: 'bold' }}>
            CSV
          </Button>
          <Button startIcon={<Download />} variant="outlined" onClick={() => handleExport('excel')} sx={{ fontWeight: 'bold' }}>
            Excel
          </Button>
          <Button startIcon={<Download />} variant="contained" onClick={() => handleExport('pdf')} sx={{ fontWeight: 'bold', boxShadow: '0 4px 15px rgba(193, 18, 31, 0.3)' }}>
            PDF Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Long term trend */}
        <Grid item xs={12} lg={8}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontFamily: 'Outfit' }}>
              Threats & Incidents Long-term Trends
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C1121F" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#C1121F" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" name="Threats" dataKey="threats" stroke="#C1121F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorThreats)" />
                  <Area type="monotone" name="Incidents" dataKey="incidents" stroke={theme.palette.warning.main} strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncidents)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Endpoint Health */}
        <Grid item xs={12} lg={4}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontFamily: 'Outfit' }}>
              Endpoint Agent Health Status
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Security score trend */}
        <Grid item xs={12}>
          <GlassCard sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontFamily: 'Outfit' }}>
              Weekly Security Posture Growth
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} />
                  <YAxis domain={[70, 100]} stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Security Index"
                    stroke={theme.palette.success.main} 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: theme.palette.success.main, strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};
