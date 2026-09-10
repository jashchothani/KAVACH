import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper, Card, CardContent,
  Button, Chip, Stack, Stepper, Step, StepLabel,
  Divider, useTheme, IconButton
} from '@mui/material';
import {
  RocketLaunch, Check, VpnKey, ContentCopy, Download,
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const GetStarted: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const [activeStep, setActiveStep] = useState(0);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Industrial');

  const steps = ['Select Infrastructure Scope', 'Generate Sandbox API Key', 'Deploy & Connect Agents'];

  const handleGenerateKey = () => {
    const key = 'kvch_live_sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setGeneratedKey(key);
    setActiveStep(1);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const plans = [
    {
      name: 'Community Free',
      price: '$0 / mo',
      desc: 'Ideal for independent developers, lab servers, and small test environments.',
      features: ['Up to 5 Endpoints', 'Basic Neural AI Correlation', 'Standard SOAR Playbooks', 'Community Support'],
      buttonText: 'Start Free Sandbox',
      tag: 'Developer'
    },
    {
      name: 'Industrial OT & Chemical',
      price: 'Custom / Plant',
      desc: 'Designed for Swastik Chemical OT networks, SCADA, Modbus, and critical manufacturing.',
      features: ['Unlimited OT/ICS Sensors', 'Air-Gapped Sync Protocol', 'Neural Deepfake & Vishing Engine', '24/7 Emergency SOC Hotline', 'Dedicated Security Engineer'],
      buttonText: 'Deploy Industrial Shield',
      tag: 'Recommended',
      popular: true
    },
    {
      name: 'Enterprise SOAR-XDR',
      price: '$499 / mo',
      desc: 'Full autonomous security orchestration for hybrid enterprise networks and multi-cloud.',
      features: ['Up to 500 Endpoints', 'MITRE ATT&CK Mapping Engine', 'Custom SOAR Playbook Builder', 'Cryptographic Audit Vault', '10ms Mean Response Guarantee'],
      buttonText: 'Start 30-Day Trial',
      tag: 'Enterprise'
    }
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              icon={<RocketLaunch sx={{ color: '#C1121F !important' }} />}
              label="KAVACH ONBOARDING WIZARD"
              sx={{ bgcolor: 'rgba(193, 18, 31, 0.1)', color: '#C1121F', fontWeight: 800, mb: 2 }}
            />
            <Typography variant="h1" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 2 }}>
              Get Started with KAVACH SOAR-XDR
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontWeight: 400 }}>
              Follow our 3-step setup to generate your API key, select your protection scope, and deploy security agents in minutes.
            </Typography>
          </motion.div>
        </Box>

        {/* Stepper Progress Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: isDark ? '#0D0D14' : '#FFFFFF',
            border: '1px solid rgba(193, 18, 31, 0.2)',
            mb: 8,
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step 1: Select Plan / Scope */}
        {activeStep === 0 && (
          <Box mb={8}>
            <Box textAlign="center" mb={4}>
              <Typography variant="h3" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 1 }}>
                Step 1: Choose Your Protection Scope
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select the tier that best matches your organization's security requirements.
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {plans.map((p, idx) => (
                <Grid item xs={12} md={4} key={idx}>
                  <Card
                    className="crimson-glow-card"
                    onClick={() => setSelectedPlan(p.name)}
                    sx={{
                      height: '100%',
                      bgcolor: isDark ? '#08080E' : '#FFFFFF',
                      border: selectedPlan === p.name ? '2px solid #C1121F' : '1px solid rgba(193, 18, 31, 0.15)',
                      borderRadius: 4,
                      p: 1,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {p.popular && (
                      <Chip
                        label="MOST POPULAR FOR OT & MANUFACTURING"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bgcolor: '#C1121F',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.65rem'
                        }}
                      />
                    )}

                    <CardContent sx={{ p: 3 }}>
                      <Chip label={p.tag} size="small" sx={{ bgcolor: 'rgba(193, 18, 31, 0.1)', color: '#C1121F', fontWeight: 800, mb: 2 }} />
                      <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 1 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="primary" sx={{ mb: 2 }}>
                        {p.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3} sx={{ minHeight: 40 }}>
                        {p.desc}
                      </Typography>

                      <Divider sx={{ mb: 3 }} />

                      <Stack spacing={1.5} mb={4}>
                        {p.features.map((feat, fidx) => (
                          <Box display="flex" alignItems="center" gap={1} key={fidx}>
                            <Check sx={{ color: '#10B981', fontSize: 18 }} />
                            <Typography variant="body2">{feat}</Typography>
                          </Box>
                        ))}
                      </Stack>

                      <Button
                        fullWidth
                        variant={selectedPlan === p.name ? 'contained' : 'outlined'}
                        onClick={handleGenerateKey}
                        sx={{
                          background: selectedPlan === p.name ? 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)' : 'transparent',
                          borderColor: '#C1121F',
                          color: selectedPlan === p.name ? '#FFFFFF' : '#C1121F',
                          fontWeight: 800,
                          py: 1.2,
                          borderRadius: 2.5
                        }}
                      >
                        {p.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Step 2: Generated API Key */}
        {activeStep >= 1 && (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 4,
              bgcolor: isDark ? '#0D0D14' : '#FFFFFF',
              border: '1px solid rgba(193, 18, 31, 0.3)',
              mb: 8,
              maxWidth: 800,
              mx: 'auto',
              textAlign: 'center'
            }}
          >
            <VpnKey sx={{ fontSize: 50, color: '#C1121F', mb: 2 }} />
            <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit', mb: 1 }}>
              Your KAVACH Sandbox API Key Generated
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Use this secret key to authenticate your background security agents with the KAVACH cloud backend.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: isDark ? '#040407' : '#F1F5F9',
                borderRadius: 3,
                border: '1px solid rgba(193, 18, 31, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
                mb: 4
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#C1121F', wordBreak: 'break-all' }}>
                {generatedKey}
              </Typography>
              <IconButton onClick={handleCopyKey} color="primary">
                {copied ? <Check sx={{ color: '#10B981' }} /> : <ContentCopy />}
              </IconButton>
            </Paper>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => navigate('/download')}
                sx={{
                  background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                  fontWeight: 800,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2.5
                }}
              >
                Proceed to Download Agents
              </Button>
              <Button
                variant="outlined"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  borderColor: '#C1121F',
                  color: isDark ? '#FFFFFF' : '#C1121F',
                  fontWeight: 800,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2.5
                }}
              >
                Go to SOAR Dashboard
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
};
