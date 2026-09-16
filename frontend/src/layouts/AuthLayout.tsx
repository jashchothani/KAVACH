import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 40%, #F1F5F9 75%, #FEF2F2 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Soft Ambient Light Glows */}
      <Box
        sx={{
          position: 'absolute',
          top: '-12%',
          right: '10%',
          width: { xs: 320, md: 550 },
          height: { xs: 320, md: 550 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0) 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-12%',
          left: '8%',
          width: { xs: 360, md: 600 },
          height: { xs: 360, md: 600 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.07) 0%, rgba(2, 132, 199, 0) 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle Dot Grid */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.45,
          pointerEvents: 'none',
        }}
      />

      {/* Main Content Area */}
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1060 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

