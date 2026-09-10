import React from 'react';
import { Card, CardProps } from '@mui/material';

interface GlassCardProps extends CardProps {
  glowColor?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  glowColor = 'rgba(193, 18, 31, 0.15)', 
  glow = false, 
  sx, 
  ...props 
}) => {
  return (
    <Card
      sx={{
        backdropFilter: 'blur(12px)',
        bgcolor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(17, 17, 24, 0.75)' 
            : 'rgba(255, 255, 255, 0.85)',
        border: (theme) => 
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: 3,
        boxShadow: (theme) => 
          theme.palette.mode === 'dark'
            ? glow 
              ? `0 0 30px ${glowColor}, 0 4px 30px rgba(0, 0, 0, 0.4)`
              : '0 4px 30px rgba(0, 0, 0, 0.4)'
            : glow
              ? `0 0 20px ${glowColor}, 0 4px 20px rgba(148, 163, 184, 0.08)`
              : '0 4px 20px rgba(148, 163, 184, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        ...sx
      }}
      {...props}
    >
      {children}
    </Card>
  );
};
