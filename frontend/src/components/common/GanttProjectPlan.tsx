import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme
} from '@mui/material';
import { CalendarMonth, Layers, CheckCircle2, Engineering, Hub } from '@mui/icons-material';
import { GANTT_WEEKS, GANTT_ACTIVITIES, DEVELOPMENT_MODULES, PROJECT_DETAILS, TEAM_MEMBERS } from '../../data/projectData';

export const GanttProjectPlan: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState<'gantt' | 'modules' | 'team'>('gantt');

  return (
    <Box sx={{ spaceY: 4 }}>
      {/* Header & Toggle */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          bgcolor: isDark ? 'rgba(13, 14, 24, 0.85)' : '#FFFFFF',
          border: '1px solid rgba(193, 18, 31, 0.25)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 3,
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CalendarMonth sx={{ color: '#3B82F6', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 800, letterSpacing: '0.04em' }}>
              PROJECT EXECUTION SCHEDULE (2026–2027)
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
            Project Planning & Development Roadmap
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 680 }}>
            11-week project milestone schedule from 13 July 2026 through deployment on 27 September 2026 for {PROJECT_DETAILS.sponsor}.
          </Typography>
        </Box>

        {/* Tab Selector */}
        <Stack direction="row" spacing={1} sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', p: 0.6, borderRadius: 2 }}>
          <Button
            size="small"
            variant={activeTab === 'gantt' ? 'contained' : 'text'}
            onClick={() => setActiveTab('gantt')}
            sx={{
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: 1.5,
              bgcolor: activeTab === 'gantt' ? '#C1121F' : 'transparent',
              color: '#FFFFFF',
              '&:hover': { bgcolor: activeTab === 'gantt' ? '#E63946' : 'rgba(255, 255, 255, 0.08)' }
            }}
          >
            11-Week Gantt
          </Button>

          <Button
            size="small"
            variant={activeTab === 'modules' ? 'contained' : 'text'}
            onClick={() => setActiveTab('modules')}
            sx={{
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: 1.5,
              bgcolor: activeTab === 'modules' ? '#C1121F' : 'transparent',
              color: '#FFFFFF',
              '&:hover': { bgcolor: activeTab === 'modules' ? '#E63946' : 'rgba(255, 255, 255, 0.08)' }
            }}
          >
            Modules (1–8)
          </Button>

          <Button
            size="small"
            variant={activeTab === 'team' ? 'contained' : 'text'}
            onClick={() => setActiveTab('team')}
            sx={{
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: 1.5,
              bgcolor: activeTab === 'team' ? '#C1121F' : 'transparent',
              color: '#FFFFFF',
              '&:hover': { bgcolor: activeTab === 'team' ? '#E63946' : 'rgba(255, 255, 255, 0.08)' }
            }}
          >
            Project Team
          </Button>
        </Stack>
      </Paper>

      {/* Tab 1: Gantt Chart Table */}
      {activeTab === 'gantt' && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            bgcolor: isDark ? 'rgba(13, 14, 24, 0.85)' : '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF' }}>
              11-Week Milestone Timeline
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#C1121F' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Active Development Phase
              </Typography>
            </Box>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }}>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 800, minWidth: 260 }}>
                    Activity / Milestone
                  </TableCell>
                  {GANTT_WEEKS.map((w) => (
                    <TableCell key={w.weekNum} align="center" sx={{ color: '#93C5FD', fontWeight: 800, fontSize: '0.75rem', px: 1 }}>
                      W{w.weekNum}
                      <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.65rem' }}>
                        {w.dates}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {GANTT_ACTIVITIES.map((act) => (
                  <TableRow key={act.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem' }}>
                      {act.name}
                    </TableCell>
                    {GANTT_WEEKS.map((w) => {
                      const isActive = act.activeWeeks.includes(w.weekNum);
                      return (
                        <TableCell key={w.weekNum} align="center" sx={{ px: 0.8, py: 1 }}>
                          {isActive ? (
                            <Box
                              sx={{
                                width: '100%',
                                height: 26,
                                borderRadius: 1,
                                bgcolor: '#C1121F',
                                boxShadow: '0 2px 8px rgba(193, 18, 31, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFFFFF',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                              }}
                            >
                              ✓
                            </Box>
                          ) : (
                            <Box sx={{ width: '100%', height: 26, borderRadius: 1, bgcolor: 'rgba(255, 255, 255, 0.02)' }} />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 2: Development Modules */}
      {activeTab === 'modules' && (
        <Grid container spacing={3}>
          {DEVELOPMENT_MODULES.map((mod) => (
            <Grid item xs={12} md={6} key={mod.number}>
              <Paper
                elevation={0}
                className="glass-panel-enterprise"
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Chip
                      label={`Module ${mod.number}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(193, 18, 31, 0.15)', color: '#F87171', fontWeight: 800 }}
                    />
                    <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 700 }}>
                      {mod.duration}
                    </Typography>
                  </Box>

                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 1 }}>
                    {mod.title}
                  </Typography>

                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>
                    {mod.description}
                  </Typography>
                </Box>

                <Box pt={2} borderTop="1px solid rgba(255, 255, 255, 0.08)">
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)', fontWeight: 700, display: 'block', mb: 1 }}>
                    KEY DELIVERABLES:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {mod.deliverables.map((d) => (
                      <Chip
                        key={d}
                        label={d}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.06)',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          mb: 0.5,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 3: Project Team & Academic Credentials */}
      {activeTab === 'team' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              className="glass-panel-enterprise"
              sx={{ p: 4, borderRadius: 3, height: '100%' }}
            >
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 2 }}>
                Engineering Team Members
              </Typography>
              <Stack spacing={2}>
                {TEAM_MEMBERS.map((member) => (
                  <Box
                    key={member.roll}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#FFFFFF' }}>{member.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#93C5FD' }}>{member.role}</Typography>
                    </Box>
                    <Chip label={`Roll No: ${member.roll}`} size="small" sx={{ bgcolor: 'rgba(193, 18, 31, 0.2)', color: '#F87171', fontWeight: 800 }} />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              className="glass-panel-enterprise"
              sx={{ p: 4, borderRadius: 3, height: '100%' }}
            >
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#FFFFFF', mb: 2 }}>
                Academic & Industry Details
              </Typography>
              <Stack spacing={1.8} sx={{ fontSize: '0.88rem' }}>
                <Box display="flex" justifyContent="space-between" borderBottom="1px solid rgba(255, 255, 255, 0.08)" pb={1}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Sponsor:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#F59E0B' }}>{PROJECT_DETAILS.sponsor}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" borderBottom="1px solid rgba(255, 255, 255, 0.08)" pb={1}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Institute:</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#FFFFFF', textAlign: 'right', maxWidth: 220 }}>SBMP (SVKM)</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" borderBottom="1px solid rgba(255, 255, 255, 0.08)" pb={1}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Project Guide:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#FFFFFF' }}>{PROJECT_DETAILS.guide}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" borderBottom="1px solid rgba(255, 255, 255, 0.08)" pb={1}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>H.O.D.:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#FFFFFF' }}>{PROJECT_DETAILS.hod}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Course Code:</Typography>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#10B981' }}>{PROJECT_DETAILS.courseCode}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
