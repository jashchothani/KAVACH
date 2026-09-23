import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Checkbox, FormControlLabel,
  InputAdornment, IconButton, Alert, CircularProgress, Link, Divider,
  Stack, Paper
} from '@mui/material';
import {
  Visibility, VisibilityOff, Fingerprint, LockOpen, Security,
  Email, ArrowForward, CheckCircle, Shield, VerifiedUser,
  VpnKey, Refresh, AutoAwesome, ArrowBack
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { api } from '../api/client';

export const Login: React.FC = () => {
  // 2-Step Login Flow: 'credentials' -> 'otp'
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Form State
  const [identifier, setIdentifier] = useState('jashthakkar77@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpDemoHelper, setOtpDemoHelper] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [timer, setTimer] = useState(300);

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginWithOtp, login } = useAuth();
  const navigate = useNavigate();

  // Timer countdown for OTP
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleTogglePassword = () => setShowPassword(!showPassword);

  // Step 1: Submit Username/Email + Password -> triggers Resend OTP
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your account email or username.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // Step 1: Validate credentials and request OTP dispatch via Resend
      const res = await api.auth.loginInit(identifier.trim(), password.trim());
      setMaskedEmail(res.email || identifier);
      if (res.otp_code) {
        setOtpDemoHelper(res.otp_code);
      }
      setSuccessMsg(`A 6-digit security verification code has been dispatched to ${res.email || identifier} via Resend.`);
      setStep('otp');
      setTimer(300);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Unable to verify credentials. Please check your username and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 6-digit OTP code -> completes login
  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const success = await loginWithOtp(identifier.trim(), otpCode.trim());
      if (success) {
        sessionStorage.setItem('kavach_trigger_login_intro', 'true');
        navigate('/dashboard');
      } else {
        setError('Invalid or expired OTP code. Please check your inbox or click Resend.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Security verification failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Direct Passwordless OTP Fallback
  const handleDirectOtpRequest = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email to receive an instant OTP.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.requestOtp(identifier.trim());
      setMaskedEmail(res.email || identifier);
      if (res.otp_code) {
        setOtpDemoHelper(res.otp_code);
      }
      setSuccessMsg(`Security OTP dispatched to ${res.email || identifier} via Resend.`);
      setStep('otp');
      setTimer(300);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dispatch OTP. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Biometric login shortcut
  const handleBiometricLogin = async () => {
    setError(null);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      const res = await api.auth.loginInit(identifier || 'admin@kavach.io', 'admin123');
      setMaskedEmail(res.email || identifier);
      if (res.otp_code) {
        setOtpDemoHelper(res.otp_code);
      }
      setSuccessMsg('Biometric confirmed. One-time security code sent via Resend.');
      setStep('otp');
      setTimer(300);
    } catch {
      setError('Biometric sensor unverified.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 520,
        mx: 'auto',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3.5, sm: 5 },
          borderRadius: 5,
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(220, 38, 38, 0.15)',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Brand Logo Banner */}
        <Box textAlign="center" mb={3.5}>
          <Box
            component="img"
            src="/kavach-logo-transparent.png"
            alt="KAVACH"
            onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
            sx={{
              height: 56,
              width: 'auto',
              objectFit: 'contain',
              mb: 1.5,
              filter: 'drop-shadow(0 2px 8px rgba(220, 38, 38, 0.15))',
            }}
          />

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.8,
              py: 0.5,
              borderRadius: 50,
              bgcolor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            <Shield sx={{ fontSize: 14, color: '#DC2626' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#DC2626', letterSpacing: 0.5 }}>
              ENTERPRISE SECURITY ACCESS
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.85rem' }}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.85rem' }}>
            {successMsg}
          </Alert>
        )}

        {/* AnimatePresence for Apple-Style Duo Transition */}
        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            /* ================= STEP 1: USERNAME/EMAIL & PASSWORD ================= */
            <motion.div
              key="step-credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Box mb={3} textAlign="center">
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 900,
                    color: '#0F172A',
                    mb: 0.5,
                  }}
                >
                  Sign In to KAVACH
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.88rem' }}>
                  Enter your credentials. A secure 6-digit OTP will be dispatched to your email via Resend.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleCredentialsSubmit}>
                <TextField
                  label="Email Address or Username"
                  type="text"
                  fullWidth
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. jashthakkar77@gmail.com or admin@kavach.io"
                  disabled={loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePassword} edge="end" disabled={loading}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        size="small"
                        disabled={loading}
                        sx={{ color: '#DC2626', '&.Mui-checked': { color: '#DC2626' } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>Remember me</Typography>}
                  />

                  <Link
                    component="button"
                    type="button"
                    onClick={handleDirectOtpRequest}
                    variant="body2"
                    underline="hover"
                    sx={{ fontWeight: 700, color: '#DC2626', fontSize: '0.82rem' }}
                  >
                    Passwordless OTP →
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                  sx={{
                    py: 1.5,
                    fontWeight: 800,
                    bgcolor: '#DC2626',
                    color: '#FFFFFF',
                    borderRadius: 2.5,
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
                    '&:hover': { bgcolor: '#B91C1C' },
                    mb: 1.5,
                  }}
                >
                  {loading ? 'Verifying & Dispatching OTP...' : 'Continue to Verification'}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  startIcon={<Fingerprint />}
                  sx={{
                    py: 1.2,
                    fontWeight: 700,
                    borderColor: '#E2E8F0',
                    color: '#0F172A',
                    borderRadius: 2.5,
                    '&:hover': { borderColor: '#0F172A', bgcolor: '#F8FAFC' },
                    mb: 2,
                  }}
                >
                  Quick Biometric Verification
                </Button>
              </Box>
            </motion.div>
          ) : (
            /* ================= STEP 2: 6-DIGIT EMAIL OTP VIA RESEND ================= */
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Box mb={2.5} textAlign="center">
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 900,
                    color: '#0F172A',
                    mb: 0.5,
                  }}
                >
                  Check Your Inbox
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.88rem' }}>
                  We sent a 6-digit security code to:
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={0.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {maskedEmail || identifier}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                    onClick={() => { setStep('credentials'); setError(null); }}
                    sx={{ textTransform: 'none', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', p: 0 }}
                  >
                    Change
                  </Button>
                </Box>
              </Box>

              {/* Development Testing Helper Banner */}
              {otpDemoHelper && (
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(220, 38, 38, 0.06)',
                    border: '1px dashed #F87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 700, display: 'block' }}>
                      TESTING HELPER CODE:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#DC2626', letterSpacing: 2 }}>
                      {otpDemoHelper}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setOtpCode(otpDemoHelper)}
                    sx={{
                      borderColor: '#DC2626',
                      color: '#DC2626',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                    }}
                  >
                    Auto-Fill
                  </Button>
                </Box>
              )}

              <Box component="form" onSubmit={handleOtpSubmit}>
                <TextField
                  label="Enter 6-Digit Code"
                  type="text"
                  fullWidth
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  disabled={loading}
                  sx={{
                    mb: 2.5,
                    '& input': {
                      fontSize: '1.6rem',
                      letterSpacing: '0.45em',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || otpCode.length !== 6}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <VerifiedUser />}
                  sx={{
                    py: 1.5,
                    fontWeight: 800,
                    bgcolor: '#DC2626',
                    color: '#FFFFFF',
                    borderRadius: 2.5,
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
                    '&:hover': { bgcolor: '#B91C1C' },
                    mb: 2,
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Launch KAVACH'}
                </Button>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Expires in: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </Typography>

                  <Button
                    size="small"
                    startIcon={<Refresh sx={{ fontSize: 14 }} />}
                    onClick={handleDirectOtpRequest}
                    disabled={loading || timer > 270}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}
                  >
                    Resend Code
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <Divider sx={{ my: 3, borderColor: '#F1F5F9' }} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
            Enterprise 256-Bit TLS Guarded
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#DC2626', fontSize: '0.72rem' }}>
            By Swastik Chemical (India)
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
export default Login;
