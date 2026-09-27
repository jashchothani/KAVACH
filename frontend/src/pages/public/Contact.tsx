import React, { useState } from 'react';
import {
  Box, Container, Typography, Grid, Paper, TextField, Button,
  Chip, Stack, Alert, MenuItem
} from '@mui/material';
import {
  PhoneCallback, Email, LocationOn, Send, CheckCircle, Alarm, Shield
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

export const Contact: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    department: 'Enterprise Security',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const offices = [
    {
      city: 'Swastik Chemical Headquarters',
      address: 'Swastik Industrial Chemical Complex, Tech Zone, Mumbai, India',
      phone: '+91 (022) 4910-KAVACH',
      email: 'soc@swastikchemical.in',
      tag: 'Global SOC HQ & Sovereign Vault'
    },
    {
      city: 'Kavach Threat Research Labs',
      address: 'Cyber Defense Towers, Sector 4, Tech Corridor, India',
      phone: '+91 (022) 4910-LABS',
      email: 'threat-intel@kavach.io',
      tag: 'Raksha AI R&D Center'
    }
  ];

  return (
    <Box
      sx={{
        py: { xs: 12, md: 16 },
        bgcolor: 'transparent',
        color: isDark ? '#FFFFFF' : '#0F172A',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<Shield sx={{ color: '#DC2626 !important' }} />}
              label="24/7 SOVEREIGN THREAT RESPONSE & INQUIRY CENTER"
              sx={{
                bgcolor: 'rgba(220, 38, 38, 0.1)',
                color: '#DC2626',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 2,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4.2rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: isDark ? '#FFFFFF' : '#0F172A',
                mb: 2,
              }}
            >
              Get in Touch with Our Security Engineers
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569',
                fontSize: '1.15rem',
                maxWidth: 720,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Need assistance with an active threat incident, industrial OT integration, or sovereign deployment? Our SOC engineers are on standby 24/7/365.
            </Typography>
          </motion.div>
        </Box>

        {/* 24/7 SOC Emergency Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, md: 4.5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
            color: '#FFFFFF',
            mb: 8,
            boxShadow: '0 12px 36px rgba(220, 38, 38, 0.35)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                <Alarm sx={{ fontSize: 32 }} />
                <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
                  ACTIVE THREAT EMERGENCY HOTLINE
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                Experiencing an active breach, lateral movement, or ransomware execution? Call our emergency SOC hotline immediately for automated containment assistance.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
              <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit', letterSpacing: '0.02em', mb: 0.5 }}>
                +91 1800-KAVACH-SOC
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: '0.05em' }}>
                AVAILABLE 24 HOURS / 365 DAYS • IMMEDIATE TRIAGE
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={6}>
          {/* Interactive Form */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 5 },
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                borderRadius: 4.5,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                boxShadow: isDark ? 'none' : '0 8px 30px rgba(15, 23, 42, 0.04)',
              }}
            >
              <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                Send an Inquiry
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', mb: 4 }}>
                Fill out the secure form below and a KAVACH Security Specialist will respond within 15 minutes.
              </Typography>

              {submitted ? (
                <Alert
                  severity="success"
                  icon={<CheckCircle fontSize="inherit" />}
                  sx={{
                    borderRadius: 3,
                    p: 3,
                    bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
                    border: '1px solid #86EFAC',
                    color: isDark ? '#FFFFFF' : '#14532D',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                    Inquiry Submitted Successfully!
                  </Typography>
                  <Typography variant="body2">
                    Thank you, {formData.name}. Our security team has received your message regarding <strong>{formData.department}</strong> and will reach out to <strong>{formData.email}</strong> shortly.
                  </Typography>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Your Full Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="email"
                        label="Work Email Address"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company / Organization"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Department / Topic"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        <MenuItem value="Enterprise Security">Enterprise Security Demo</MenuItem>
                        <MenuItem value="Industrial OT Security">Swastik Chemical OT Defense</MenuItem>
                        <MenuItem value="Incident Emergency">Active Incident Assistance</MenuItem>
                        <MenuItem value="API Integration">API & SIEM Integration</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Message / Infrastructure Details"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        sx={{
                          bgcolor: '#DC2626',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          px: 4,
                          py: 1.5,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
                          '&:hover': { bgcolor: '#B91C1C' },
                        }}
                      >
                        Submit Inquiry
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Paper>
          </Grid>

          {/* Offices List */}
          <Grid item xs={12} md={5}>
            <Stack spacing={4}>
              {offices.map((office, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 4,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                    borderRadius: 4.5,
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    boxShadow: isDark ? 'none' : '0 6px 24px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <Chip
                    label={office.tag}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(220, 38, 38, 0.1)',
                      color: '#DC2626',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      mb: 2,
                    }}
                  />
                  <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 2, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                    {office.city}
                  </Typography>

                  <Stack spacing={1.6}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <LocationOn sx={{ color: '#DC2626', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569' }}>
                        {office.address}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <PhoneCallback sx={{ color: '#DC2626', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569' }}>
                        {office.phone}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Email sx={{ color: '#DC2626', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569' }}>
                        {office.email}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Contact;
