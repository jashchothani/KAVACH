import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Stack, CircularProgress } from '@mui/material';
import { AccessTime, Warning, Security, CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api/client';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export const DigitalDayTimeline: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.monitoring.getActivity(15);
        setEvents(data || []);
      } catch (err) {
        // Silently handle offline state
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    const iv = setInterval(fetchEvents, 20000);
    return () => clearInterval(iv);
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        bgcolor: cardBg,
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(15,23,42,0.06)',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              bgcolor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}
          >
            <AccessTime sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              Recent Security Activity
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Live stream of events monitored by KAVACH
            </Typography>
          </Box>
        </Box>

        <Chip
          label="Live"
          size="small"
          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CR }} />}
          sx={{ bgcolor: `${CR}15`, color: CR, fontWeight: 800, '& .MuiChip-icon': { ml: 1 } }}
        />
      </Box>

      {/* Timeline Stream */}
      <Box sx={{ position: 'relative', pl: { xs: 2, sm: 3 }, minHeight: 150 }}>
        {loading && events.length === 0 ? (
          <Box display="flex" alignItems="center" justifyContent="center" height={150}>
            <CircularProgress size={24} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : events.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={150} gap={1}>
            <Security sx={{ fontSize: 32, color: 'text.disabled' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              No recent security events detected. Your device is quiet.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Continuous vertical guide line */}
            <Box
              sx={{
                position: 'absolute',
                left: { xs: 27, sm: 35 },
                top: 12,
                bottom: 12,
                width: 2,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              }}
            />

            <Stack spacing={2.5}>
              <AnimatePresence>
                {events.map((evt, idx) => {
                  const severity = evt.severity?.toLowerCase() || 'info';
                  const isSuccess = severity === 'info' || severity === 'low';
                  const isWarn = severity === 'medium' || severity === 'high';
                  const isBlocked = severity === 'critical';

                  const dotColor = isBlocked ? CR : isWarn ? WARN : SAFE;
                  const timeString = evt.timestamp 
                    ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <Box
                      key={evt.id || idx}
                      component={motion.div}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, position: 'relative' }}
                    >
                      {/* Time Indicator */}
                      <Typography
                        sx={{
                          width: 68,
                          fontSize: '0.72rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700,
                          color: 'text.secondary',
                          pt: 0.4,
                          flexShrink: 0,
                        }}
                      >
                        {timeString}
                      </Typography>

                      {/* Status Dot */}
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: dotColor,
                          border: `3px solid ${isDark ? '#0A0B10' : '#FFFFFF'}`,
                          boxShadow: `0 0 10px ${dotColor}80`,
                          mt: 0.6,
                          flexShrink: 0,
                          zIndex: 2,
                        }}
                      />

                      {/* Event Card */}
                      <Box
                        sx={{
                          flexGrow: 1,
                          p: 1.8,
                          px: 2.2,
                          borderRadius: 3,
                          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                          border: `1px solid ${border}`,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.primary' }}>
                              {evt.name || 'Security Event'}
                            </Typography>
                            {isBlocked && (
                              <Chip
                                label="DEFLECTED"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.58rem',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontWeight: 900,
                                  bgcolor: 'rgba(220, 38, 38, 0.15)',
                                  color: CR,
                                }}
                              />
                            )}
                          </Box>
                          <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.2 }}>
                            {evt.what_happened || evt.description || 'System monitored activity.'}
                          </Typography>
                        </Box>

                        <Chip
                          label={evt.process_name || evt.source || 'Kernel'}
                          size="small"
                          sx={{
                            fontSize: '0.66rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            color: 'text.secondary',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </AnimatePresence>
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
};
