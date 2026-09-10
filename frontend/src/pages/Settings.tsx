import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Divider,
  FormControlLabel, Switch, MenuItem, useTheme, CardContent
} from '@mui/material';
import { useAuth } from '../context/useAuth';
import { useAppTheme } from '../context/useAppTheme';
import { GlassCard } from '../components/common/GlassCard';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const [mfa, setMfa] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const _theme = useTheme();

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
          Platform Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure security rules, user profile preferences, and theme choices
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* User Profile Info */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
                User Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Operator account settings for KAVACH SOC
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                label="Full Name"
                value={user?.full_name || ''}
                fullWidth
                disabled
                sx={{ mb: 2.5 }}
              />
              <TextField
                label="Email Address"
                value={user?.email || ''}
                fullWidth
                disabled
                sx={{ mb: 2.5 }}
              />
              <TextField
                label="Access Permission Group"
                value={user?.role_name.replace('_', ' ').toUpperCase() || ''}
                fullWidth
                disabled
                sx={{ mb: 2.5 }}
              />
              <TextField
                label="Department"
                value={user?.department || 'Operations'}
                fullWidth
                disabled
              />
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Security & Preferences */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
                Security Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure multi-factor and session rules
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <FormControlLabel
                control={
                  <Switch 
                    checked={mfa} 
                    onChange={(e) => {
                      setMfa(e.target.checked);
                      alert(e.target.checked ? 'MFA setup requested. Scan QR code in authenticator app.' : 'MFA disabled.');
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Two-Factor Authentication (2FA)</Typography>
                    <Typography variant="caption" color="text.secondary">Secure user profile logons with TOTP secret verification</Typography>
                  </Box>
                }
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              />

              <FormControlLabel
                control={
                  <Switch 
                    checked={mode === 'light'} 
                    onChange={toggleTheme}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Use Light Theme Option</Typography>
                    <Typography variant="caption" color="text.secondary">Toggle between dark command center and clean enterprise view</Typography>
                  </Box>
                }
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              />

              <TextField
                select
                label="Auto Session Timeout"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                fullWidth
              >
                <MenuItem value="15">15 Minutes</MenuItem>
                <MenuItem value="30">30 Minutes</MenuItem>
                <MenuItem value="60">60 Minutes</MenuItem>
                <MenuItem value="never">Never Time Out</MenuItem>
              </TextField>

              <Button
                variant="contained"
                sx={{ mt: 4, fontWeight: 'bold' }}
                onClick={() => alert('Platform settings saved successfully.')}
              >
                Save Preferences
              </Button>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};
