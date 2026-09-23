import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface KavachLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  tagline?: string;
  variant?: 'full' | 'shield' | 'white';
}

export const KavachLogo: React.FC<KavachLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  tagline = 'AI-Driven Security. Simplified for Everyone.',
  variant = 'full',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Height mappings for the official logo
  const height = size === 'sm' ? 36 : size === 'md' ? 44 : size === 'lg' ? 64 : 88;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Box
        component="img"
        src="/kavach-logo-transparent.png"
        alt="KAVACH - By Swastik Chemical (India)"
        onError={(e: any) => {
          // Fallback to non-transparent if needed
          e.currentTarget.src = '/kavach-logo.png';
        }}
        sx={{
          height: height,
          width: 'auto',
          objectFit: 'contain',
          filter: isDark ? 'drop-shadow(0 2px 8px rgba(220, 38, 38, 0.4))' : 'drop-shadow(0 2px 6px rgba(15, 23, 42, 0.08))',
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        }}
      />
      {showSubtitle && (
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column' }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B',
              lineHeight: 1.2,
            }}
          >
            {tagline}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
export default KavachLogo;
