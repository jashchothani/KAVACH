import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, useTheme, Container } from '@mui/material';
import { Shield, Home, Dashboard as DashboardIcon, ArrowBack } from '@mui/icons-material';

export const NotFound: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Container maxWidth="md" sx={{ py: { xs: 8, md: 14 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 8 },
          textAlign: 'center',
          borderRadius: 4,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
          boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.4)' : '0 8px 30px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            bgcolor: 'rgba(220, 38, 38, 0.1)',
            color: '#DC2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Shield sx={{ fontSize: 44 }} />
        </Box>

        <Typography
          variant="overline"
          sx={{
            display: 'block',
            fontWeight: 800,
            letterSpacing: 2,
            color: '#DC2626',
            fontSize: '0.9rem',
          }}
        >
          404 — PAGE NOT FOUND
        </Typography>

        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            fontFamily: 'Outfit',
            color: isDark ? '#FFFFFF' : '#0F172A',
            mt: 1,
            mb: 2,
          }}
        >
          This Security Endpoint Does Not Exist
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: 500,
            mx: 'auto',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          The page you are trying to reach may have been moved, renamed, or is restricted under your active KAVACH role policy.
        </Typography>

        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#DC2626',
              color: '#FFFFFF',
              fontWeight: 700,
              px: 3.5,
              py: 1.4,
              borderRadius: 2.5,
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Return to Overview
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{
              borderColor: 'divider',
              fontWeight: 700,
              px: 3.5,
              py: 1.4,
              borderRadius: 2.5,
            }}
          >
            Open KAVACH Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
