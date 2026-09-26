import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, Avatar, Menu,
  MenuItem, Badge, Tooltip, useTheme, Chip, Switch,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, BugReport, Notifications, Assignment,
  Computer, Memory, Router, AccessTime, Language, Shield, AutoGraph,
  Psychology, Assessment, Settings, ExitToApp, Brightness4, Brightness7,
  FiberManualRecord, BarChart, Security,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { useAppTheme } from '../context/useAppTheme';
import { useViewMode } from '../context/ViewModeContext';
import { KavachLogo } from '../components/common/KavachLogo';
import { CinematicIntro } from '../components/common/CinematicIntro';

const DRAWER_W = 252;
const DRAWER_MINI = 68;

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ── Nav Config ─────────────────────────────────────────────────────────────
const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ text: 'Overview', icon: <Dashboard />, path: '/dashboard' }],
  },
  {
    title: 'SECURITY',
    items: [
      { text: 'Threats', icon: <BugReport />, path: '/threats' },
      { text: 'Alerts', icon: <Notifications />, path: '/alerts', badge: 3 },
      { text: 'Incidents', icon: <Assignment />, path: '/incidents' },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { text: 'Devices', icon: <Computer />, path: '/devices' },
      { text: 'Processes', icon: <Memory />, path: '/processes' },
      { text: 'Network', icon: <Router />, path: '/network' },
      { text: 'Activity', icon: <AccessTime />, path: '/activity' },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { text: 'URL Scanner', icon: <Language />, path: '/url-scanner' },
      { text: 'Threat Intel', icon: <Shield />, path: '/threat-intel' },
      { text: 'ML Detection', icon: <AutoGraph />, path: '/ml-detection' },
    ],
  },
  {
    title: 'AI ASSISTANT',
    items: [
      { text: 'Raksha AI', icon: <Psychology />, path: '/raksha-ai' },
    ],
  },
  {
    title: 'PLATFORM',
    items: [
      { text: 'Analytics', icon: <BarChart />, path: '/analytics' },
      { text: 'SOAR', icon: <Security />, path: '/soar' },
      { text: 'Reports', icon: <Assessment />, path: '/reports' },
      { text: 'Settings', icon: <Settings />, path: '/settings' },
    ],
  },
];

export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const { isAdvanced, toggleMode } = useViewMode();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = mode === 'dark';

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('kavach_trigger_login_intro') === 'true';
  });

  const handleIntroComplete = () => {
    sessionStorage.removeItem('kavach_trigger_login_intro');
    setShowIntro(false);
  };

  // Live WebSocket probe
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:8000/api/v1/dashboard/live');
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch {
      setWsConnected(false);
    }
    return () => { if (ws) ws.close(); };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Top AppBar ──────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: isDark
            ? 'rgba(21, 23, 34, 0.95)' // CRM dark header
            : 'rgba(253,252,251,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid rgba(11,11,15,0.08)',
          boxShadow: 'none',
          color: 'text.primary',
          transition: 'background-color 0.25s, border-color 0.25s',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important', px: { xs: 2, sm: 3 } }}>
          {/* Left */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => setOpen(!open)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              }}
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer' }}>
              <KavachLogo size="sm" showSubtitle={false} />
            </Box>
          </Box>

          {/* Right */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
            {/* Live feed indicator */}
            <Tooltip title={wsConnected ? 'Live telemetry stream active' : 'Backend disconnected'}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.7,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 100,
                  bgcolor: wsConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${wsConnected ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: wsConnected ? '#22C55E' : '#EF4444',
                    animation: wsConnected ? 'status-blink 2s ease-in-out infinite' : 'none',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    letterSpacing: '0.04em',
                    color: wsConnected ? '#22C55E' : '#EF4444',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {wsConnected ? 'LIVE' : 'OFFLINE'}
                </Typography>
              </Box>
            </Tooltip>


            {/* Theme toggle */}
            <Tooltip title={isDark ? 'Light Mode' : 'Dark Mode'}>
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: isDark ? '#F59E0B' : '#0F172A' },
                }}
              >
                {isDark ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            {/* User Avatar */}
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                pl: 0.5,
                borderRadius: 100,
                py: 0.3,
                pr: 1,
                transition: 'background 0.2s',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: '#DC2626',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  boxShadow: '0 0 0 2px rgba(220,38,38,0.35)',
                }}
              >
                {user?.full_name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', lineHeight: 1.2 }}>
                  {user?.username || 'Analyst'}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1, textTransform: 'capitalize' }}>
                  {user?.role || 'member'}
                </Typography>
              </Box>
            </Box>

            {/* Profile Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  width: 200,
                  mt: 1,
                  borderRadius: 3,
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(11,11,15,0.08)',
                  boxShadow: isDark
                    ? '0 16px 48px rgba(0,0,0,0.6)'
                    : '0 8px 32px rgba(11,11,15,0.12)',
                  overflow: 'hidden',
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(11,11,15,0.06)' }}>
                <Typography variant="body2" fontWeight={700}>{user?.username}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user?.email}</Typography>
              </Box>
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }} sx={{ gap: 1.5, py: 1.2 }}>
                <Settings sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600}>Settings</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.2, color: '#DC2626' }}>
                <ExitToApp sx={{ fontSize: 18, color: '#DC2626' }} />
                <Typography variant="body2" fontWeight={700} color="#DC2626">Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar Drawer ──────────────────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? DRAWER_W : DRAWER_MINI,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_W : DRAWER_MINI,
            overflowX: 'hidden',
            overflowY: 'auto',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            bgcolor: isDark ? '#151722' : '#FFFFFF', // CRM dark sidebar
            borderRight: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(11,11,15,0.07)',
            boxSizing: 'border-box',
            pt: '60px',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        }}
      >
        <Box sx={{ py: 1.5, px: open ? 1.5 : 0.75 }}>
          {NAV_SECTIONS.map((section, sIdx) => (
            <Box key={sIdx} sx={{ mb: 1 }}>
              {/* Section Label */}
              <AnimatePresence>
                {section.title && open && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        px: 1.5,
                        pb: 0.5,
                        display: 'block',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        color: '#EC4899', // Hot-pink section labels from reference
                      }}
                    >
                      {section.title}
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>

              <List disablePadding>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.25 }}>
                      <Tooltip title={!open ? item.text : ''} placement="right">
                        <ListItemButton
                          onClick={() => navigate(item.path)}
                          selected={isActive}
                          sx={{
                            minHeight: 40,
                            px: 1.5,
                            borderRadius: 2.5,
                            justifyContent: open ? 'initial' : 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                            bgcolor: isActive
                              ? 'linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.08) 100%) !important'
                              : 'transparent',
                            '&.Mui-selected': {
                              bgcolor: 'linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.08) 100%)',
                              '&:hover': {
                                bgcolor: 'linear-gradient(90deg, rgba(236,72,153,0.25) 0%, rgba(168,85,247,0.12) 100%)',
                              },
                            },
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.05)',
                            },
                          }}
                        >
                          {/* Active bar with neon magenta glow */}
                          {isActive && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: '20%',
                                height: '60%',
                                width: 3.5,
                                borderRadius: '0 4px 4px 0',
                                bgcolor: '#EC4899',
                                boxShadow: '0 0 12px #EC4899',
                              }}
                            />
                          )}

                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: open ? 1.5 : 'auto',
                              justifyContent: 'center',
                              color: isActive ? (isDark ? '#EC4899' : '#DC2626') : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(11,11,15,0.45)',
                              fontSize: '1.15rem',
                              transition: 'color 0.2s',
                            }}
                          >
                            {item.badge ? (
                              <Badge
                                badgeContent={item.badge}
                                color="error"
                                sx={{ '& .MuiBadge-badge': { fontSize: '0.58rem', minWidth: 16, height: 16 } }}
                              >
                                {item.icon}
                              </Badge>
                            ) : item.icon}
                          </ListItemIcon>

                          {open && (
                            <motion.div
                              initial={false}
                              animate={{ opacity: 1 }}
                              style={{ overflow: 'hidden', flex: 1 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isActive ? 800 : 600,
                                  fontSize: '0.82rem',
                                  color: isActive
                                    ? isDark ? '#EC4899' : '#DC2626'
                                    : isDark ? 'rgba(255,255,255,0.75)' : 'rgba(11,11,15,0.75)',
                                  transition: 'color 0.2s',
                                  lineHeight: 1,
                                }}
                              >
                                {item.text}
                              </Typography>
                            </motion.div>
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>

              {sIdx < NAV_SECTIONS.length - 1 && (
                <Divider
                  sx={{
                    mt: 1,
                    mb: 0.5,
                    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(11,11,15,0.05)',
                  }}
                />
              )}
            </Box>
          ))}

          {/* Footer */}
          {open && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(11,11,15,0.06)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', display: 'block', fontWeight: 600 }}>
                KAVACH Platform v2.4
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#DC2626', fontWeight: 800, display: 'block' }}>
                Swastik Chemical (India)
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '60px',
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden',
          bgcolor: isDark ? '#1C1F2B' : 'background.default', // CRM main content background
          transition: 'background-color 0.25s',
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 }, minHeight: 'calc(100vh - 60px)' }}>
          {children || <Outlet context={{ analystMode: isAdvanced }} />}
        </Box>
      </Box>

      {/* Cinematic Intro Overlay */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
    </Box>
  );
};

export default DashboardLayout;
