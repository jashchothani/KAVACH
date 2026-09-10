import React, { useState } from 'react';
import {
  Box, Container, Typography, Grid, Paper, TextField, Button,
  Chip, Stack, useTheme, Alert, MenuItem
} from '@mui/material';
import {
  PhoneCallback, Email, LocationOn, Send, CheckCircle, Alarm
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const Contact: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
      address: 'Swastik Industrial Chemical Complex, Tech Zone, India',
      phone: '+91 (022) 4910-KAVACH',
      email: 'soc@swastikchemical.in',
      tag: 'Global SOC HQ'
    },
    {
      city: 'Kavach Threat Research Labs',
      address: 'Cyber Defense Towers, Sector 4, Tech City',
      phone: '+91 (022) 4910-LABS',
      email: 'threat-intel@kavach.io',
      tag: 'AI R&D Center'
    }
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<PhoneCallback sx={{ color: '#C1121F !important' }} />}
              label="24/7 THREAT RESPONSE & INQUIRY CENTER"
              sx={{ bgcolor: 'rgba(193, 18, 31, 0.1)', color: '#C1121F', fontWeight: 800, mb: 2 }}
            />
            <Typography variant="h1" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 2 }}>
              Get in Touch with Our Security Engineers
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontWeight: 400 }}>
              Need assistance with an active threat incident, deployment inquiry, or enterprise demo? Our SOC engineers are standing by 24/7.
            </Typography>
          </motion.div>
        </Box>

        {/* 24/7 SOC Emergency Banner */}
        <Paper
          elevation={0}
          className="crimson-glow-card"
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #C1121F 0%, #7A0000 100%)',
            color: '#FFFFFF',
            mb: 8,
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Experiencing an active breach or ransomware execution? Call our emergency SOC hotline immediately for automated playbook deployment assistance.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
              <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit', letterSpacing: 1 }}>
                +91 1800-KAVACH-SOC
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Available 24 hours / 365 days
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
                bgcolor: isDark ? '#0D0D14' : '#FFFFFF',
                borderRadius: 4,
                border: '1px solid rgba(193, 18, 31, 0.2)',
              }}
            >
              <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 1 }}>
                Send an Inquiry
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>
                Fill out the form below and a Kavach Security Specialist will respond within 1 hour.
              </Typography>

              {submitted ? (
                <Alert
                  severity="success"
                  icon={<CheckCircle fontSize="inherit" />}
                  sx={{ borderRadius: 3, p: 3 }}
                >
                  <Typography variant="subtitle1" fontWeight={800}>Inquiry Submitted Successfully!</Typography>
                  <Typography variant="body2">
                    Thank you, {formData.name}. Our security team has received your message regarding <strong>{formData.department}</strong> and will reach out to {formData.email} shortly.
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
                          background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                          fontWeight: 800,
                          px: 4,
                          py: 1.5,
                          borderRadius: 2.5,
                          boxShadow: '0 4px 15px rgba(193, 18, 31, 0.4)',
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
                    bgcolor: isDark ? '#08080D' : '#F8FAFC',
                    borderRadius: 4,
                    border: '1px solid rgba(193, 18, 31, 0.2)',
                  }}
                >
                  <Chip label={office.tag} size="small" sx={{ bgcolor: 'rgba(193, 18, 31, 0.15)', color: '#C1121F', fontWeight: 800, mb: 2 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'Outfit', mb: 2 }}>
                    {office.city}
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <LocationOn sx={{ color: '#C1121F' }} />
                      <Typography variant="body2" color="text.secondary">{office.address}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <PhoneCallback sx={{ color: '#C1121F' }} />
                      <Typography variant="body2" color="text.secondary">{office.phone}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Email sx={{ color: '#C1121F' }} />
                      <Typography variant="body2" color="text.secondary">{office.email}</Typography>
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
