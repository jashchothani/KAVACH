import React from 'react';
import { Box, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle at 50% 50%, #151525 0%, #0A0A0F 100%)' 
            : 'radial-gradient(circle at 50% 50%, #EDF2F7 0%, #F5F7FA 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: (theme) => 
            theme.palette.mode === 'dark'
              ? 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0, 0, 0, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.015) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          pointerEvents: 'none',
        }
      }}
    >
      {/* Floating cybersecurity particles / decorations */}
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          filter: 'blur(100px)',
          background: 'rgba(193, 18, 31, 0.08)',
          top: '-10%',
          left: '-10%',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          filter: 'blur(100px)',
          background: 'rgba(193, 18, 31, 0.06)',
          bottom: '-10%',
          right: '-10%',
          pointerEvents: 'none',
        }}
      />

      <Paper
        elevation={0}
        sx={{
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          p: 4,
          mx: 2,
          borderRadius: 4,
          backdropFilter: 'blur(16px)',
          bgcolor: (theme) => 
            theme.palette.mode === 'dark' 
              ? 'rgba(17, 17, 24, 0.7)' 
              : 'rgba(255, 255, 255, 0.8)',
          border: (theme) => 
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: (theme) => 
            theme.palette.mode === 'dark'
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
              : '0 8px 32px 0 rgba(148, 163, 184, 0.1)',
        }}
      >
        <Outlet />
      </Paper>
    </Box>
  );
};
