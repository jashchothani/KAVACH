import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface RakshaAiLiveLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  isDark?: boolean;
}

export const RakshaAiLiveLogo: React.FC<RakshaAiLiveLogoProps> = ({
  size = 'md',
  showBadge = true,
  isDark = true,
}) => {
  const pixelSize = size === 'sm' ? 36 : size === 'md' ? 48 : 64;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: { xs: 1.5, sm: 2 },
        userSelect: 'none',
      }}
    >
      {/* Animated Live Holographic Neural Core Emblem */}
      <Box
        sx={{
          position: 'relative',
          width: pixelSize,
          height: pixelSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Outer glowing ambient field */}
        <Box
          sx={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
            filter: 'blur(8px)',
            animation: 'pulse-glow 3s infinite',
          }}
        />

        {/* Outer Rotating Cyber HUD Ring */}
        <Box
          component={motion.div}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1.5px dashed rgba(59, 130, 246, 0.65)',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
          }}
        />

        {/* Counter-rotating segmented inner ring */}
        <Box
          component={motion.div}
          animate={{ rotate: -360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            border: '1px dotted rgba(220, 38, 38, 0.55)',
          }}
        />

        {/* Central Glowing Neural Core Hexagon / Iris */}
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'relative',
            width: pixelSize * 0.68,
            height: pixelSize * 0.68,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #DC2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.7), inset 0 0 8px rgba(255, 255, 255, 0.5)',
          }}
        >
          {/* Futuristic Cyber Synapse SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: pixelSize * 0.42, height: pixelSize * 0.42, filter: 'drop-shadow(0 0 4px #FFFFFF)' }}
          >
            {/* Neural Brain / Central Node Network */}
            <circle cx="12" cy="12" r="3" fill="#FFFFFF" />
            <line x1="12" y1="3" x2="12" y2="7" stroke="#93C5FD" strokeWidth="1.5" />
            <line x1="12" y1="17" x2="12" y2="21" stroke="#93C5FD" strokeWidth="1.5" />
            <line x1="3" y1="12" x2="7" y2="12" stroke="#93C5FD" strokeWidth="1.5" />
            <line x1="17" y1="12" x2="21" y2="12" stroke="#93C5FD" strokeWidth="1.5" />
            <circle cx="12" cy="3" r="1.5" fill="#60A5FA" />
            <circle cx="12" cy="21" r="1.5" fill="#EF4444" />
            <circle cx="3" cy="12" r="1.5" fill="#60A5FA" />
            <circle cx="21" cy="12" r="1.5" fill="#EF4444" />
          </svg>
        </Box>
      </Box>

      {/* Live Equalizer / Soundwave Frequency Bars */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.4, sm: 0.6 },
          height: pixelSize * 0.45,
        }}
      >
        {[0.4, 0.95, 0.6, 1.0, 0.75, 0.85, 0.45].map((h, i) => (
          <Box
            key={i}
            component={motion.div}
            animate={{
              height: [`${h * 8}px`, `${h * 24}px`, `${h * 12}px`],
            }}
            transition={{
              duration: 0.85,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
            sx={{
              width: 3,
              bgcolor: i % 2 === 0 ? '#3B82F6' : '#DC2626',
              borderRadius: '2px',
              boxShadow: i % 2 === 0 ? '0 0 6px rgba(59, 130, 246, 0.6)' : '0 0 6px rgba(220, 38, 38, 0.6)',
            }}
          />
        ))}
      </Box>

      {/* Text Branding & Live Telemetry Badge */}
      {showBadge && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, textAlign: 'left' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                letterSpacing: '0.04em',
                lineHeight: 1,
                fontSize: size === 'lg' ? '1.35rem' : '1.1rem',
                color: isDark ? '#FFFFFF' : '#0B0B0F',
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
              }}
            >
              RAKSHA AI
              <Box
                component="span"
                sx={{
                  color: '#3B82F6',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                [v2.4]
              </Box>
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1.2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.6}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#22C55E',
                  boxShadow: '0 0 8px #22C55E',
                  animation: 'status-blink 1.5s infinite',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: '#22C55E',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                LIVE NEURAL STREAM
              </Typography>
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.45)' : '#64748B',
                fontSize: '0.68rem',
                fontFamily: 'JetBrains Mono, monospace',
                display: { xs: 'none', sm: 'inline' },
              }}
            >
              • &lt; 8.4ms INFERENCE
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RakshaAiLiveLogo;
