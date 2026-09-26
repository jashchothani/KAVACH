import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Divider,
  FormControlLabel, Switch, MenuItem, useTheme, Stack, Chip,
  Avatar,
} from '@mui/material';
import {
  Person, Security, Palette, Notifications, Check,
  Brightness4, Brightness7, Shield, Lock,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { useAppTheme } from '../context/useAppTheme';

const CR = '#DC2626';

const SettingsSection: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, subtitle, icon, children, delay = 0 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Box
        sx={{
          borderRadius: 3,
          border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(11,11,15,0.07)',
          bgcolor: isDark ? 'rgba(18,18,26,0.9)' : '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Section header */}
        <Box
          sx={{
            px: 3, py: 2.5,
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(11,11,15,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              bgcolor: `${CR}12`,
              border: `1px solid ${CR}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: CR,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </motion.div>
  );
};

const ToggleRow: React.FC<{
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, sublabel, checked, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(11,11,15,0.04)',
        '&:last-child': { borderBottom: 'none', pb: 0 },
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.2 }}>{label}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sublabel}</Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          '& .MuiSwitch-thumb': { bgcolor: checked ? CR : undefined },
          '& .MuiSwitch-track': { bgcolor: checked ? `${CR}50 !important` : undefined },
        }}
      />
    </Box>
  );
};

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [mfa, setMfa] = useState(false);
  const [alertsEmail, setAlertsEmail] = useState(true);
  const [alertsSounds, setAlertsSounds] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
              Platform Settings
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
              Manage profile, security preferences, and platform configuration
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            startIcon={saved ? <Check sx={{ fontSize: 16 }} /> : undefined}
            sx={{
              fontWeight: 700,
              bgcolor: saved ? '#22C55E' : CR,
              '&:hover': { bgcolor: saved ? '#16A34A' : '#B91C1C' },
              px: 2.5,
              transition: 'background 0.3s',
            }}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </Box>
      </motion.div>

      <Grid container spacing={2.5}>
        {/* Profile */}
        <Grid item xs={12} md={6}>
          <SettingsSection
            icon={<Person sx={{ fontSize: 18 }} />}
            title="Account Profile"
            subtitle="Your KAVACH operator identity"
            delay={0.05}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 3, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(11,11,15,0.05)' }}>
              <Avatar
                sx={{
                  width: 56, height: 56,
                  bgcolor: CR,
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  boxShadow: `0 0 0 3px rgba(220,38,38,0.25)`,
                }}
              >
                {user?.full_name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                  {user?.full_name || user?.username || 'Analyst'}
                </Typography>
                <Chip
                  label={(user?.role || 'member').toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: `${CR}12`,
                    color: CR,
                    fontWeight: 800,
                    fontSize: '0.62rem',
                    border: `1px solid ${CR}25`,
                    height: 20,
                    mt: 0.5,
                  }}
                />
              </Box>
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Username"
                value={user?.username || ''}
                fullWidth
                size="small"
                disabled
              />
              <TextField
                label="Email Address"
                value={user?.email || ''}
                fullWidth
                size="small"
                disabled
              />
              <TextField
                label="Role"
                value={(user?.role_name || user?.role || '').replace(/_/g, ' ').toUpperCase()}
                fullWidth
                size="small"
                disabled
              />
              <TextField
                label="Department"
                value={user?.department || 'Security Operations'}
                fullWidth
                size="small"
                disabled
              />
            </Stack>
          </SettingsSection>
        </Grid>

        {/* Security */}
        <Grid item xs={12} md={6}>
          <SettingsSection
            icon={<Shield sx={{ fontSize: 18 }} />}
            title="Security & Access"
            subtitle="Authentication and session controls"
            delay={0.1}
          >
            <ToggleRow
              label="Two-Factor Authentication"
              sublabel="Require TOTP on every sign-in"
              checked={mfa}
              onChange={setMfa}
            />
            <ToggleRow
              label="Auto-Refresh Dashboard"
              sublabel="Refresh telemetry every 15 seconds"
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.disabled', fontSize: '0.65rem', display: 'block', mb: 1 }}>
                SESSION TIMEOUT
              </Typography>
              <TextField
                select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="15">15 Minutes</MenuItem>
                <MenuItem value="30">30 Minutes</MenuItem>
                <MenuItem value="60">60 Minutes</MenuItem>
                <MenuItem value="never">Never Time Out</MenuItem>
              </TextField>
            </Box>
          </SettingsSection>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <SettingsSection
            icon={<Palette sx={{ fontSize: 18 }} />}
            title="Appearance"
            subtitle="Theme and display preferences"
            delay={0.15}
          >
            <Box
              onClick={toggleTheme}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2.5,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(11,11,15,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: CR,
                  bgcolor: `${CR}06`,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: 2,
                    bgcolor: isDark ? '#141419' : '#F8F6F3',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,11,15,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isDark
                    ? <Brightness7 sx={{ fontSize: 20, color: '#F59E0B' }} />
                    : <Brightness4 sx={{ fontSize: 20, color: '#0F172A' }} />}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Click to switch to {isDark ? 'light' : 'dark'} theme
                  </Typography>
                </Box>
              </Box>
              <Switch
                checked={isDark}
                onChange={toggleTheme}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  '& .MuiSwitch-thumb': { bgcolor: isDark ? '#F59E0B' : '#0F172A' },
                }}
              />
            </Box>
          </SettingsSection>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <SettingsSection
            icon={<Notifications sx={{ fontSize: 18 }} />}
            title="Notifications"
            subtitle="Alert and notification preferences"
            delay={0.2}
          >
            <ToggleRow
              label="Email Alerts"
              sublabel="Send critical alerts to registered email"
              checked={alertsEmail}
              onChange={setAlertsEmail}
            />
            <ToggleRow
              label="Alert Sounds"
              sublabel="Play sound on high-severity detections"
              checked={alertsSounds}
              onChange={setAlertsSounds}
            />
          </SettingsSection>
        </Grid>

        {/* Danger Zone */}
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Box
              sx={{
                p: 3, borderRadius: 3,
                border: '1px solid rgba(220,38,38,0.2)',
                bgcolor: 'rgba(220,38,38,0.03)',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: CR, mb: 0.5, fontFamily: 'Outfit, sans-serif' }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                These actions are irreversible. Proceed with caution.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: 'rgba(220,38,38,0.35)',
                    color: CR,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { borderColor: CR, bgcolor: 'rgba(220,38,38,0.06)' },
                  }}
                >
                  Reset All Settings
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: 'rgba(220,38,38,0.35)',
                    color: CR,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { borderColor: CR, bgcolor: 'rgba(220,38,38,0.06)' },
                  }}
                >
                  Clear Telemetry Cache
                </Button>
              </Stack>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
