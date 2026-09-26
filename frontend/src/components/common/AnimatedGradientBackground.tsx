import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export const AnimatedGradientBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* ─── LAYER 1: BASE FLUID MESH GRADIENT (CONTINUOUSLY FLOWING) ─── */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-20%',
          width: '140%',
          height: '140%',
          background: isDark
            ? 'linear-gradient(135deg, #06070B 0%, #110A14 25%, #060D1E 50%, #130B18 75%, #06070B 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #FFF1F2 20%, #EFF6FF 40%, #FAF5FF 60%, #F0FDF4 80%, #FFFFFF 100%)',
          backgroundSize: '300% 300%',
          animation: 'meshGradientMotion 22s ease-in-out infinite alternate',
          '@keyframes meshGradientMotion': {
            '0%': { backgroundPosition: '0% 20%' },
            '50%': { backgroundPosition: '100% 80%' },
            '100%': { backgroundPosition: '50% 0%' },
          },
        }}
      />

      {/* ─── LAYER 2: MORPHING RADIAL AURORA ORBS (ORGANIC LIVING FLOW) ─── */}

      {/* Crimson / Rose Sunset Orb */}
      <Box
        component={motion.div}
        animate={{
          x: [0, 90, -50, 0],
          y: [0, -70, 50, 0],
          scale: [1, 1.25, 0.92, 1],
          opacity: isDark ? [0.12, 0.22, 0.12] : [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        sx={{
          position: 'absolute',
          top: '-15%',
          right: '-5%',
          width: '65vw',
          height: '65vw',
          background: isDark
            ? 'radial-gradient(circle, #DC2626 0%, rgba(220, 38, 38, 0.4) 35%, transparent 70%)'
            : 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, rgba(244, 63, 94, 0.28) 40%, transparent 70%)',
          filter: { xs: 'blur(70px)', md: 'blur(100px)' },
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
        }}
      />

      {/* Electric Cobalt / Sky-Blue Aurora Orb */}
      <Box
        component={motion.div}
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 60, -50, 0],
          scale: [1.1, 0.88, 1.2, 1.1],
          opacity: isDark ? [0.10, 0.20, 0.10] : [0.32, 0.52, 0.32],
        }}
        transition={{
          duration: 19,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-8%',
          width: '60vw',
          height: '60vw',
          background: isDark
            ? 'radial-gradient(circle, #2563EB 0%, rgba(37, 99, 235, 0.35) 35%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(6, 182, 212, 0.25) 45%, transparent 70%)',
          filter: { xs: 'blur(80px)', md: 'blur(110px)' },
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
        }}
      />

      {/* Royal Violet / Amethyst Core Orb */}
      <Box
        component={motion.div}
        animate={{
          x: [0, 70, -70, 0],
          y: [0, -50, 60, 0],
          scale: [0.95, 1.22, 0.98, 0.95],
          opacity: isDark ? [0.08, 0.18, 0.08] : [0.28, 0.48, 0.28],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
        sx={{
          position: 'absolute',
          top: '30%',
          right: '-12%',
          width: '55vw',
          height: '55vw',
          background: isDark
            ? 'radial-gradient(circle, #7C3AED 0%, rgba(124, 58, 237, 0.3) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(217, 70, 239, 0.22) 45%, transparent 70%)',
          filter: { xs: 'blur(90px)', md: 'blur(120px)' },
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
        }}
      />

      {/* Radiant Amber / Cyber-Mint Pulse Orb */}
      <Box
        component={motion.div}
        animate={{
          x: [0, -60, 50, 0],
          y: [0, 70, -40, 0],
          scale: [1.15, 0.92, 1.18, 1.15],
          opacity: isDark ? [0.06, 0.14, 0.06] : [0.25, 0.44, 0.25],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
        sx={{
          position: 'absolute',
          top: '55%',
          left: '-10%',
          width: '52vw',
          height: '52vw',
          background: isDark
            ? 'radial-gradient(circle, #059669 0%, rgba(16, 185, 129, 0.25) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.38) 0%, rgba(16, 185, 129, 0.22) 45%, transparent 70%)',
          filter: { xs: 'blur(80px)', md: 'blur(110px)' },
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
        }}
      />

      {/* ─── LAYER 3: DYNAMIC COLOR-SHIFT SHIMMER OVERLAY ─── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
          animation: 'subtleShimmer 14s ease-in-out infinite alternate',
          '@keyframes subtleShimmer': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 0.9 },
            '100%': { opacity: 0.6 },
          },
        }}
      />

      {/* ─── LAYER 4: ARCHITECTURAL HUD BOUNDARY GUIDELINES (CLEAN, MINIMAL) ─── */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 'max(0px, calc(50vw - 720px))',
          width: '1px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.06)',
          pointerEvents: 'none',
          display: { xs: 'none', xl: 'block' },
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 'max(0px, calc(50vw - 720px))',
          width: '1px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.06)',
          pointerEvents: 'none',
          display: { xs: 'none', xl: 'block' },
        }}
      />
    </Box>
  );
};
