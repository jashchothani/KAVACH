import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Public, Shield, Block, Laptop, InsertDriveFile, Apps, Router } from '@mui/icons-material';
import { motion } from 'framer-motion';

const CR = '#DC2626';
const SAFE = '#22C55E';

export const DigitalSecurityMap: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const cardBg = isDark ? '#12141F' : '#F8FAFC';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3.5,
        bgcolor: cardBg,
        border: `1px solid ${border}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', mb: 0.5 }}>
        Digital Security Map & Telemetry Routing
      </Typography>
      <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mb: 3 }}>
        Interactive architectural flow of incoming internet traffic through KAVACH defensive filtering.
      </Typography>

      {/* Visual Flow Tree */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {/* Tier 1: Internet */}
        <Box
          sx={{
            px: 2.5,
            py: 1,
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 2,
          }}
        >
          <Public sx={{ color: '#3B82F6', fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', fontFamily: 'JetBrains Mono' }}>
            GLOBAL INTERNET
          </Typography>
        </Box>

        {/* Vertical Line */}
        <Box sx={{ width: 2, height: 24, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

        {/* Tier 2: Filtering Split (Safe vs Blocked) */}
        <Box sx={{ display: 'flex', gap: { xs: 3, sm: 6 }, position: 'relative', zIndex: 2 }}>
          {/* Safe Branch */}
          <Box
            sx={{
              p: 1.4,
              px: 2,
              borderRadius: 2,
              bgcolor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              textAlign: 'center',
              minWidth: 120,
            }}
          >
            <Typography sx={{ color: SAFE, fontWeight: 900, fontSize: '1.2rem', fontFamily: 'Outfit' }}>
              274 SAFE
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700 }}>
              VERIFIED QUERIES
            </Typography>
          </Box>

          {/* Blocked Branch */}
          <Box
            sx={{
              p: 1.4,
              px: 2,
              borderRadius: 2,
              bgcolor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              textAlign: 'center',
              minWidth: 120,
            }}
          >
            <Typography sx={{ color: CR, fontWeight: 900, fontSize: '1.2rem', fontFamily: 'Outfit' }}>
              3 BLOCKED
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: CR, fontWeight: 700 }}>
              PHISH / C2 DEFLECTED
            </Typography>
          </Box>
        </Box>

        {/* Vertical Line */}
        <Box sx={{ width: 2, height: 24, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

        {/* Tier 3: Secured Device Core */}
        <Box
          sx={{
            px: 3,
            py: 1.2,
            borderRadius: 2.5,
            bgcolor: isDark ? '#1C2030' : '#FFFFFF',
            border: `2px solid ${SAFE}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            boxShadow: `0 0 20px rgba(34, 197, 94, 0.25)`,
            zIndex: 2,
          }}
        >
          <Laptop sx={{ color: SAFE, fontSize: 20 }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
            SECURED ENDPOINT (JASH LAPTOP)
          </Typography>
        </Box>

        {/* Sub-branches to Files, Apps, Network */}
        <Box sx={{ width: 2, height: 20, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip
            icon={<InsertDriveFile sx={{ fontSize: '14px !important', color: `${SAFE} !important` }} />}
            label="Protected Files"
            size="small"
            sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', border: `1px solid ${border}`, fontSize: '0.72rem', fontWeight: 700 }}
          />
          <Chip
            icon={<Apps sx={{ fontSize: '14px !important', color: `${SAFE} !important` }} />}
            label="Hardened Apps"
            size="small"
            sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', border: `1px solid ${border}`, fontSize: '0.72rem', fontWeight: 700 }}
          />
          <Chip
            icon={<Router sx={{ fontSize: '14px !important', color: `${SAFE} !important` }} />}
            label="Encrypted Sockets"
            size="small"
            sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', border: `1px solid ${border}`, fontSize: '0.72rem', fontWeight: 700 }}
          />
        </Box>
      </Box>
    </Box>
  );
};
