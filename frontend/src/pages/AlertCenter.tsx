import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Button, List, ListItem,
  Divider, IconButton, useTheme
} from '@mui/material';
import { Check, Delete, Notifications, Drafts } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';

const initialAlerts = [
  { id: 1, title: 'Ransomware telemetry execution signature match', category: 'threat', severity: 'critical', desc: 'LockBit 3.0 execution traces identified on PROD-DB-02.', time: '5 mins ago', read: false },
  { id: 2, title: 'Deepfake analysis confidence high', category: 'ai', severity: 'high', desc: 'AI media analysis complete. Video file Authenticity score: 5%.', time: '20 mins ago', read: false },
  { id: 3, title: 'Host isolation playbook executed', category: 'soar', severity: 'high', desc: 'Endpoint PROD-DB-02 network interfaces disabled.', time: '40 mins ago', read: true },
  { id: 4, title: 'Failed login attempts warning threshold', category: 'threat', severity: 'medium', desc: '15 failed logins in 2 mins on user accounts.', time: '1 hour ago', read: false },
  { id: 5, title: 'Vishing call synthetic markers identified', category: 'ai', severity: 'high', desc: 'Voice matching score: 87% synthetic probability.', time: '2 hours ago', read: true },
  { id: 6, title: 'SSL certification expiration warning', category: 'system', severity: 'low', desc: 'Portal certificate resolves to expire in 7 days.', time: '1 day ago', read: true }
];

export const AlertCenter: React.FC = () => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [tabVal, setTabVal] = useState(0);
  const theme = useTheme();

  const handleMarkRead = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleDelete = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getFilteredAlerts = () => {
    const cats = ['all', 'threat', 'soar', 'ai', 'system'];
    const currentCat = cats[tabVal];
    if (currentCat === 'all') return alerts;
    return alerts.filter(a => a.category === currentCat);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            Alert Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process incoming security incidents, AI model flags, and system metrics
          </Typography>
        </Box>
        <Button 
          startIcon={<Drafts />} 
          variant="outlined"
          onClick={() => setAlerts(prev => prev.map(a => ({ ...a, read: true })))}
          sx={{ fontWeight: 'bold' }}
        >
          Mark All Read
        </Button>
      </Box>

      <Tabs 
        value={tabVal} 
        onChange={(e, val) => setTabVal(val)} 
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All Alerts" sx={{ fontWeight: 'bold' }} />
        <Tab label="Threats" sx={{ fontWeight: 'bold' }} />
        <Tab label="SOAR Events" sx={{ fontWeight: 'bold' }} />
        <Tab label="AI Detections" sx={{ fontWeight: 'bold' }} />
        <Tab label="System Alerts" sx={{ fontWeight: 'bold' }} />
      </Tabs>

      <GlassCard>
        <List sx={{ p: 0 }}>
          {getFilteredAlerts().length > 0 ? (
            getFilteredAlerts().map((alert, idx) => (
              <React.Fragment key={alert.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  sx={{
                    p: 3,
                    bgcolor: !alert.read 
                      ? theme.palette.mode === 'dark' ? 'rgba(193, 18, 31, 0.03)' : 'rgba(193, 18, 31, 0.015)' 
                      : 'transparent',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Typography variant="body1" fontWeight={!alert.read ? 800 : 600}>
                        {alert.title}
                      </Typography>
                      <SeverityBadge severity={alert.severity} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 0.5 }}>
                      {alert.desc}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Detected {alert.time} • Category: {alert.category.toUpperCase()}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1}>
                    {!alert.read && (
                      <IconButton color="success" onClick={() => handleMarkRead(alert.id)}>
                        <Check />
                      </IconButton>
                    )}
                    <IconButton color="error" onClick={() => handleDelete(alert.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" py={8} sx={{ color: 'text.secondary' }}>
              <Notifications sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">No alerts found in this category</Typography>
            </Box>
          )}
        </List>
      </GlassCard>
    </Box>
  );
};
