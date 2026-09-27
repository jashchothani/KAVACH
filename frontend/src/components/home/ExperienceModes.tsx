import React, { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Security, Analytics, AdminPanelSettings } from '@mui/icons-material';

const CR = '#DC2626';

const modes = [
  { id: 'normal', label: 'NORMAL USER', desc: 'Simple, clear security posture for executives.', icon: Security },
  { id: 'soc', label: 'SOC ANALYST', desc: 'Deep investigative tools and correlation data.', icon: Analytics },
  { id: 'admin', label: 'ADMINISTRATOR', desc: 'Full control over playbooks and configurations.', icon: AdminPanelSettings },
];

const ModePreview: React.FC<{ activeId: string; isDark: boolean }> = ({ activeId, isDark }) => {
  return (
    <Box sx={{ mt: 8, maxWidth: 1000, mx: 'auto', borderRadius: 4, overflow: 'hidden', bgcolor: isDark ? '#0A0B0F' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 24px 60px rgba(15,23,42,0.08)' }}>
      {/* Chrome */}
      <Box sx={{ height: 40, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', px: 2, gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDark ? '#333' : '#E2E8F0' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDark ? '#333' : '#E2E8F0' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDark ? '#333' : '#E2E8F0' }} />
      </Box>

      {/* Content Area */}
      <Box sx={{ height: { xs: 300, md: 450 }, bgcolor: isDark ? '#050508' : '#FDFCFB', position: 'relative', overflow: 'hidden', p: { xs: 3, md: 6 } }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%' }}
          >
            {activeId === 'normal' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F', fontWeight: 900 }}>92</Typography>
                </Box>
                <Typography sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F', fontSize: '1.2rem', fontWeight: 600 }}>Your environment is secure.</Typography>
                <Box sx={{ width: '60%', height: 60, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
              </Box>
            )}

            {activeId === 'soc' && (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ width: '40%', height: 24, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                  {[1, 2, 3].map(i => (
                    <Box key={i} sx={{ width: '100%', height: 48, borderRadius: 1, bgcolor: i === 1 ? 'rgba(220,38,38,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), border: i === 1 ? `1px solid ${CR}` : 'none' }} />
                  ))}
                </Box>
                <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ width: '30%', height: 24, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                  <Box sx={{ width: '100%', flexGrow: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', inset: 20, border: '1px dashed rgba(220,38,38,0.3)', borderRadius: 2 }} />
                  </Box>
                </Box>
              </Box>
            )}

            {activeId === 'admin' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Box sx={{ width: '30%', height: 24, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                   <Box sx={{ width: 120, height: 32, borderRadius: 1, bgcolor: '#3B82F6' }} />
                 </Box>
                 <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flexGrow: 1 }}>
                    {[1, 2, 3].map(i => (
                      <Box key={i} sx={{ flex: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                         <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                         <Box sx={{ width: '80%', height: 16, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                         <Box sx={{ width: '60%', height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                         <Box sx={{ mt: 'auto', width: '100%', height: 24, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                      </Box>
                    ))}
                 </Box>
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export const ExperienceModes: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [activeMode, setActiveMode] = useState('normal');

  return (
    <Box sx={{ py: { xs: 12, md: 16 }, bgcolor: 'transparent' }}>
      <Container maxWidth="xl">
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: { xs: '2rem', md: '3rem' }, color: isDark ? '#FFFFFF' : '#0B0B0F', lineHeight: 1.1, letterSpacing: '-0.02em', mb: 3 }}>
            Tailored experiences.
          </Typography>
        </Box>

        {/* Custom Tab Switcher */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, width: '100%', overflowX: 'auto', pb: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 3,
              p: 0.5,
              position: 'relative',
              maxWidth: '100%',
            }}
          >
            {modes.map((mode) => {
              const isActive = activeMode === mode.id;
              const Icon = mode.icon;
              return (
                <Box
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  sx={{
                    position: 'relative',
                    px: { xs: 1.5, sm: 2.5, md: 4 },
                    py: { xs: 1, sm: 1.5 },
                    cursor: 'pointer',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.8, sm: 1.5 },
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: isDark ? '#11131A' : '#FFFFFF',
                        borderRadius: 8,
                        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(15,23,42,0.08)',
                        zIndex: -1,
                        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    />
                  )}
                  <Icon sx={{ fontSize: { xs: 16, sm: 18 }, color: isActive ? CR : (isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8'), transition: 'color 0.2s' }} />
                  <Typography sx={{ color: isActive ? (isDark ? '#FFFFFF' : '#0B0B0F') : (isDark ? 'rgba(255,255,255,0.5)' : '#64748B'), fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.82rem', md: '0.85rem' }, letterSpacing: '0.04em', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
                    {mode.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
        
        <Typography align="center" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', minHeight: 24 }}>
          {modes.find(m => m.id === activeMode)?.desc}
        </Typography>

        <ModePreview activeId={activeMode} isDark={isDark} />
      </Container>
    </Box>
  );
};
