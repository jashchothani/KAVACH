import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, InputAdornment, IconButton, Alert, CircularProgress, Link
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email, Lock, ArrowForward,
  Shield, VpnKey, Refresh, ArrowBack
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { useThemeMode } from '../context/ThemeContext';
import { api } from '../api/client';

const CR = '#DC2626';

// ─── Subtle Tech Background ─────────────────────────────────────────────
const AuthBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: isDark
          ? 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
          : 'radial-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.6,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '60%',
        height: '60%',
        background: isDark
          ? 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 60%)'
          : 'radial-gradient(circle, rgba(220,38,38,0.04) 0%, transparent 60%)',
        filter: 'blur(40px)',
      }}
    />
  </Box>
);

// ─── OTP Digit Display (No Autofill) ──────────────────────────────────────────
const OtpInput: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean; isDark?: boolean }> = ({
  value, onChange, disabled, isDark
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', position: 'relative' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 48,
            height: 56,
            borderRadius: 2,
            border: `2px solid ${value[i] ? CR : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(11,11,15,0.15)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: value[i] ? 'rgba(220,38,38,0.05)' : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(11,11,15,0.02)',
            transition: 'border-color 0.2s, background 0.2s',
            boxShadow: value[i] ? `0 0 0 3px rgba(220,38,38,0.1)` : 'none',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: CR,
            }}
          >
            {value[i] || ''}
          </Typography>
        </Box>
      ))}
      <input
        autoFocus
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        style={{
          position: 'absolute',
          opacity: 0,
          width: '100%',
          height: '100%',
          inset: 0,
          cursor: 'text',
        }}
      />
    </Box>
  );
};

// ─── Main Login Component ─────────────────────────────────────────────────────
export const Login: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [step, setStep] = useState<'credentials' | 'otp' | 'success'>('credentials');
  
  // Credentials State
  const [identifier, setIdentifier] = useState('jashthakkar77@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // Handle OTP countdown timer
  useEffect(() => {
    let iv: any;
    if (step === 'otp' && timer > 0) {
      iv = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    }
    return () => clearInterval(iv);
  }, [step, timer]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email/username and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Direct login to dashboard without OTP screen
      const ok = await login(identifier.trim(), password.trim());
      if (ok) {
        setStep('success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        setError('Invalid username/email or password. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoId: string, demoPass: string) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      const ok = await login(demoId, demoPass);
      if (ok) {
        setStep('success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        setError('Direct authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOtpFlow = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email/username and password first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.loginInit(identifier.trim(), password.trim());
      setMaskedEmail(res.full_email || res.email || identifier);
      setSuccessMsg(`Identity verified. OTP dispatched to ${res.email || identifier}`);
      setStep('otp');
      setTimer(300);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length !== 6) { 
      setError('Please enter the full 6-digit verification code.'); 
      return; 
    }
    setError(null);
    setLoading(true);
    try {
      const ok = await loginWithOtp(identifier.trim(), otpCode.trim());
      if (ok) {
        setStep('success');
        // Give a short transition before redirect
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1200);
      } else {
        setError('Verification failed. The OTP may be incorrect or expired.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed. The OTP may be incorrect or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.auth.loginInit(identifier.trim(), password.trim());
      setTimer(300);
      setSuccessMsg(`A new OTP has been dispatched to ${maskedEmail}`);
    } catch (err: any) {
      setError('Failed to resend OTP. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format timer (MM:SS)
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        borderRadius: 4,
        p: { xs: 3, md: 5 },
        bgcolor: isDark ? '#0A0A0F' : '#FFFFFF',
        color: isDark ? '#FFFFFF' : '#0B0B0F',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(11,11,15,0.08)',
        boxShadow: isDark ? '0 32px 80px -12px rgba(0,0,0,0.5)' : '0 24px 64px -12px rgba(11,11,15,0.1)',
      }}
    >
      <AuthBackground isDark={isDark} />

      <AnimatePresence mode="wait">
        {step === 'credentials' && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
          >
            <Box mb={4} textAlign="center">
              <Box sx={{ width: 48, height: 48, mx: 'auto', mb: 2, borderRadius: 3, bgcolor: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(220,38,38,0.2)' }}>
                <Shield sx={{ color: CR, fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', mb: 1, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
                Access Platform
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary' }}>
                Enter your credentials to continue to KAVACH.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleCredentialsSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  placeholder="Email Address / Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Email sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                    sx: { borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FA', color: isDark ? '#FFFFFF' : '#000000', '& input': { color: isDark ? '#FFFFFF' : 'inherit' } }
                  }}
                />

                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading} size="small" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'inherit' }}>
                          {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FA', color: isDark ? '#FFFFFF' : '#000000', '& input': { color: isDark ? '#FFFFFF' : 'inherit' } }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    bgcolor: CR, color: '#FFFFFF', fontWeight: 800, py: 1.5, mt: 1, borderRadius: 2.5, textTransform: 'none',
                    boxShadow: '0 8px 20px -4px rgba(220,38,38,0.4)', '&:hover': { bgcolor: '#B91C1C', boxShadow: '0 12px 24px -4px rgba(220,38,38,0.5)' }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Dashboard'}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  size="small"
                  onClick={handleStartOtpFlow}
                  disabled={loading}
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary',
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    mt: 0.5,
                    '&:hover': { color: CR },
                  }}
                >
                  🔑 Prefer signing in with Email OTP? Click here
                </Button>

                <Box sx={{ mt: 2, pt: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary', display: 'block', mb: 1, textAlign: 'center', fontWeight: 600 }}>
                    Quick Instant Login (Click to Sign In):
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={loading}
                      onClick={() => handleQuickLogin('user@kavach.io', 'user123')}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: 2,
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        color: isDark ? '#E2E8F0' : '#1E293B',
                        '&:hover': { borderColor: '#DC2626', bgcolor: 'rgba(220,38,38,0.05)' }
                      }}
                    >
                      👤 User (User Dashboard)
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={loading}
                      onClick={() => handleQuickLogin('admin@kavach.io', 'admin123')}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: 2,
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        color: isDark ? '#E2E8F0' : '#1E293B',
                        '&:hover': { borderColor: '#DC2626', bgcolor: 'rgba(220,38,38,0.05)' }
                      }}
                    >
                      🛡️ Admin (SOC Console)
                    </Button>
                  </Box>
                </Box>
              </Box>
            </form>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Box mb={4} textAlign="center">
              <Box sx={{ width: 48, height: 48, mx: 'auto', mb: 2, borderRadius: 3, bgcolor: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(220,38,38,0.2)' }}>
                <VpnKey sx={{ color: CR, fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', mb: 1, color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
                Verify Identity
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'text.secondary', px: 2 }}>
                We've sent a 6-digit verification code to <br/>
                <strong style={{ color: isDark ? '#FFFFFF' : 'inherit' }}>{maskedEmail}</strong>
              </Typography>
            </Box>

            {successMsg && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                {successMsg}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleOtpSubmit}>
              <Box sx={{ mb: 4 }}>
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} isDark={isDark} />
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || otpCode.length !== 6}
                endIcon={!loading && <ArrowForward />}
                sx={{
                  bgcolor: CR, color: '#FFFFFF', fontWeight: 800, py: 1.5, borderRadius: 2.5, textTransform: 'none',
                  boxShadow: '0 8px 20px -4px rgba(220,38,38,0.4)', '&:hover': { bgcolor: '#B91C1C' },
                  '&.Mui-disabled': { bgcolor: 'rgba(220,38,38,0.4)', color: '#FFFFFF' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Continue'}
              </Button>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              {timer > 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Code expires in <span style={{ color: CR }}>{formatTime(timer)}</span>
                </Typography>
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, mb: 1 }}>
                    Verification code expired
                  </Typography>
                  <Button
                    onClick={handleResendOtp}
                    startIcon={<Refresh />}
                    sx={{ color: CR, fontWeight: 700, textTransform: 'none' }}
                  >
                    Resend Code
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                onClick={() => {
                  setStep('credentials');
                  setOtpCode('');
                  setError(null);
                  setSuccessMsg(null);
                }}
                startIcon={<ArrowBack />}
                sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}
              >
                Return to Login
              </Button>
            </Box>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
                  style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(34,197,94,0.4)',
                  }}
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </motion.svg>
                </motion.div>
                
                {/* Connecting Rings */}
                <Box sx={{ position: 'absolute', inset: -15, border: '2px solid rgba(34,197,94,0.3)', borderRadius: '50%', animation: 'pulse-glow 2s infinite' }} />
                <Box sx={{ position: 'absolute', inset: -30, border: '1px solid rgba(34,197,94,0.1)', borderRadius: '50%', animation: 'pulse-glow 2s infinite', animationDelay: '0.5s' }} />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: isDark ? '#FFFFFF' : '#0B0B0F', mb: 1 }}>
                Verification Successful
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary' }}>
                Preparing your secure operations environment...
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Login;
