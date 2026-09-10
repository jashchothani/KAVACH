import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface SeverityBadgeProps extends Omit<ChipProps, 'color'> {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, sx, ...props }) => {
  const getBadgeConfig = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return {
          label: 'CRITICAL',
          bgcolor: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        };
      case 'high':
        return {
          label: 'HIGH',
          bgcolor: 'rgba(245, 158, 11, 0.15)',
          color: '#F59E0B',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          bgcolor: 'rgba(59, 130, 246, 0.15)',
          color: '#3B82F6',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        };
      case 'low':
        return {
          label: 'LOW',
          bgcolor: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        };
      default:
        return {
          label: sev.toUpperCase(),
          bgcolor: 'rgba(100, 116, 139, 0.15)',
          color: '#64748B',
          border: '1px solid rgba(100, 116, 139, 0.3)',
        };
    }
  };

  const config = getBadgeConfig(severity);

  return (
    <Chip
      size="small"
      label={config.label}
      sx={{
        bgcolor: config.bgcolor,
        color: config.color,
        border: config.border,
        fontWeight: 700,
        fontSize: '0.65rem',
        letterSpacing: '0.05em',
        borderRadius: 1.5,
        height: 20,
        ...sx
      }}
      {...props}
    />
  );
};
