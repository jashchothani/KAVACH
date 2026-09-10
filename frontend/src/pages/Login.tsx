import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Checkbox, FormControlLabel,
  InputAdornment, IconButton, Alert, CircularProgress, Link, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Fingerprint, LockOpen } from '@mui/icons-material';
import { useAuth } from '../context/useAuth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@kavach.io');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Check email or password.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);
    setLoading(true);
    // Simulate FaceID/TouchID prompt delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Login as Admin
    const success = await login('admin@kavach.io', 'admin123');
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Biometric authentication failed.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Header Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box 
          sx={{ 
            width: 44, 
            height: 44, 
            bgcolor: 'primary.main', 
            borderRadius: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(193, 18, 31, 0.6)'
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 900, fontFamily: 'Outfit' }}>K</Typography>
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1, fontFamily: 'Outfit' }}>
            KAVACH
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', letterSpacing: '0.12em', opacity: 0.8, fontWeight: 700 }}>
            COMMAND CENTER
          </Typography>
        </Box>
      </Box>

      <Typography variant="h5" align="center" sx={{ mb: 1, fontWeight: 800, fontFamily: 'Outfit' }}>
        Welcome Back
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Authenticate to access the SOAR-XDR platform
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <TextField
          label="Email Address"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          placeholder="admin@kavach.io"
          disabled={loading}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          disabled={loading}
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePassword} edge="end" disabled={loading}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
                size="small"
                disabled={loading}
              />
            }
            label={<Typography variant="body2">Remember me</Typography>}
          />
          <Link href="#" variant="body2" underline="hover" sx={{ fontWeight: 600 }}>
            Forgot Password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOpen />}
          sx={{
            py: 1.5,
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(193, 18, 31, 0.4)',
            mb: 2,
          }}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={handleBiometricLogin}
          disabled={loading}
          startIcon={<Fingerprint />}
          sx={{
            py: 1.5,
            fontWeight: 'bold',
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'text.primary',
              bgcolor: 'transparent',
            },
            mb: 4,
          }}
        >
          Sign In with Biometrics
        </Button>
      </Box>

      {/* Footer */}
      <Divider sx={{ width: '100%', mb: 2 }} />
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="caption" color="text.secondary" align="center">
          Authorized Access Only. Actions are logged.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mt: 0.5 }}>
          Swastik Chemical (India)
        </Typography>
      </Box>
    </Box>
  );
};
