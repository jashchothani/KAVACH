import React from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { GlassCard } from './GlassCard';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  sparklineData?: { value: number }[];
  color?: string;
  glow?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  sparklineData,
  color = '#C1121F',
  glow = false,
}) => {
  return (
    <GlassCard glow={glow} glowColor={`${color}1A`} sx={{ p: 2.5, position: 'relative', height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
            {value}
          </Typography>
        </Box>
        <Box 
          sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: `${color}1A`, 
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
        {trend && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: trend.isUp ? 'success.main' : 'error.main',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {trend.isUp ? <ArrowUpward fontSize="inherit" /> : <ArrowDownward fontSize="inherit" />}
              {Math.abs(trend.value)}%
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs last week
            </Typography>
          </Box>
        )}

        {sparklineData && (
          <Box sx={{ width: 80, height: 30, ml: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={1.5} 
                  fill={`url(#grad-${title.replace(/\s+/g, '')})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </GlassCard>
  );
};
