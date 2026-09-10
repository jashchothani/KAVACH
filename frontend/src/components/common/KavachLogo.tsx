import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface KavachLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const KavachLogo: React.FC<KavachLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 56 : 42;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
      {/* SVG Shield Emblem */}
      <Box
        sx={{
          width: dim,
          height: dim,
          borderRadius: size === 'sm' ? '8px' : '12px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #4C0519 100%)',
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(193, 18, 31, 0.35)',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          {/* Outer Shield Outline */}
          <path
            d="M50 5 L90 20 L90 50 C90 75 70 90 50 95 C30 90 10 75 10 50 L10 20 Z"
            fill="none"
            stroke="url(#shieldGrad)"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Left Dark Side */}
          <path
            d="M50 8 L87 22 L87 48 C87 70 70 85 50 89 Z"
            fill="#0f172a"
            opacity="0.9"
          />
          {/* Right Crimson Side */}
          <path
            d="M50 8 L13 22 L13 48 C13 70 30 85 50 89 Z"
            fill="#C1121F"
            opacity="0.9"
          />
          {/* Letter K */}
          <path
            d="M32 30 L32 70 M32 50 L55 30 M38 46 L58 70"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Chemical Flask motif at base */}
          <path
            d="M45 68 L55 68 L52 75 L48 75 Z"
            fill="#F59E0B"
          />
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#C1121F" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </Box>

      {/* Brand Typography */}
      <Box display="flex" flexDirection="column">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            sx={{
              fontFamily: '"Outfit", "Space Grotesk", sans-serif',
              fontWeight: 900,
              fontSize: size === 'sm' ? '1.1rem' : size === 'lg' ? '1.6rem' : '1.3rem',
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            KAVACH
          </Typography>
          <Chip
            label="SOAR-XDR"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 800,
              bgcolor: 'rgba(193, 18, 31, 0.18)',
              color: '#F87171',
              border: '1px solid rgba(193, 18, 31, 0.4)',
            }}
          />
        </Box>

        {showSubtitle && (
          <Typography
            sx={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.65)',
              textTransform: 'uppercase',
            }}
          >
            Swastik Chemical (India)
          </Typography>
        )}
      </Box>
    </Box>
  );
};
