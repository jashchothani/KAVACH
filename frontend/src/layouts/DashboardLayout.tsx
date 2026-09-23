import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu,
  MenuItem, Badge, Tooltip, useTheme, Chip, Switch, FormControlLabel,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, BugReport, Notifications, Assignment,
  Computer, Memory, Router, AccessTime, Language, Shield, AutoGraph,
  Psychology, Assessment, Settings, ExitToApp, Brightness4, Brightness7,
  Search, FiberManualRecord,
} from '@mui/icons-material';
import { useAuth } from '../context/useAuth';
import { useAppTheme } from '../context/useAppTheme';
import { useViewMode } from '../context/ViewModeContext';
import { KavachLogo } from '../components/common/KavachLogo';
import { CinematicIntro } from '../components/common/CinematicIntro';

const drawerWidth = 260;

interface NavSection {
  title?: string;
  items: {
    text: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
  }[];
}

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { isAdvanced, toggleMode } = useViewMode();
  const [wsConnected, setWsConnected] = useState(false);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('kavach_trigger_login_intro') === 'true';
  });

  const handleIntroComplete = () => {
    sessionStorage.removeItem('kavach_trigger_login_intro');
    setShowIntro(false);
  };

  // Test live WebSocket connectivity
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:8000/api/v1/dashboard/live');
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch (e) {
      setWsConnected(false);
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Structured menu items according to KAVACH master specification
  const navSections: NavSection[] = [
    {
      items: [
        { text: 'Overview', icon: <Dashboard />, path: '/dashboard' },
      ],
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
        { text: 'Threat Intelligence', icon: <Shield />, path: '/threat-intel' },
        { text: 'ML Detection', icon: <AutoGraph />, path: '/ml-detection' },
      ],
    },
    {
      title: 'INTELLIGENT ASSISTANT',
      items: [
        { text: 'Raksha AI', icon: <Psychology sx={{ color: '#38bdf8' }} />, path: '/raksha-ai' },
      ],
    },
    {
      title: 'PLATFORM',
      items: [
        { text: 'Reports', icon: <Assessment />, path: '/reports' },
        { text: 'Settings', icon: <Settings />, path: '/settings' },
      ],
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', transition: 'background-color 0.3s' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: mode === 'dark' ? 'rgba(10, 14, 23, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left brand area */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton color="inherit" onClick={() => setOpen(!open)} edge="start" sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
              <KavachLogo size="sm" showSubtitle={false} />
            </Box>
          </Box>

          {/* Right actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Live WebSocket Status Pill */}
            <Tooltip title={wsConnected ? 'WebSocket live telemetry stream connected to :8000' : 'WebSocket disconnected (offline)'}>
              <Chip
                icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
                label={wsConnected ? 'LIVE FEED' : 'OFFLINE'}
                size="small"
                sx={{
                  bgcolor: wsConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: wsConnected ? '#10B981' : '#EF4444',
                  fontWeight: 700,
                  fontSize: 10,
                  border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              />
            </Tooltip>

            {/* Layman Mode vs SOC Analyst Mode Toggle */}
            <Tooltip title={isAdvanced ? "SOC Analyst Mode (Deep telemetry, raw event logs & MITRE mapping active)" : "Layman User Mode (Simple protection status, 1-click scan & friendly advice active)"}>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.8, bgcolor: 'background.paper', px: 1.5, py: 0.4, borderRadius: 9999, border: '1px solid', borderColor: isAdvanced ? '#7C3AED' : '#10B981' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: !isAdvanced ? '#10B981' : 'text.secondary' }}>
                  🛡️ Layman
                </Typography>
                <Switch
                  size="small"
                  checked={isAdvanced}
                  onChange={toggleMode}
                  color="secondary"
                />
                <Typography variant="caption" sx={{ fontWeight: 700, color: isAdvanced ? '#7C3AED' : 'text.secondary' }}>
                  ⚡ SOC Analyst
                </Typography>
              </Box>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} color="inherit" size="small">
                {mode === 'dark' ? <Brightness7 sx={{ color: '#F59E0B', fontSize: 20 }} /> : <Brightness4 sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <IconButton onClick={handleNotifMenuOpen} color="inherit">
              <Badge badgeContent={5} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* Notification Menu */}
            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={handleNotifMenuClose}
              slotProps={{
                paper: {
                  sx: { width: 320, mt: 1.5, maxHeight: 400 }
                }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Active Alerts</Typography>
                <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => navigate('/alerts')}>View All</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleNotifMenuClose}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }} color="error.main">Ransomware Suspected</Typography>
                    <Typography variant="caption" color="text.secondary">10m ago</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>Suspicious activity on host PROD-WEB-01</Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotifMenuClose}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }} color="warning.main">Deepfake Upload Analysis</Typography>
                    <Typography variant="caption" color="text.secondary">1h ago</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>Authentication process complete (94% confidence)</Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotifMenuClose}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }} color="info.main">Playbook Success</Typography>
                    <Typography variant="caption" color="text.secondary">3h ago</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>Isolation playbook executed on DEV-APP-03</Typography>
                </Box>
              </MenuItem>
            </Menu>

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, cursor: 'pointer' }} onClick={handleProfileMenuOpen}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.95rem', fontWeight: 'bold' }}>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1 }}>{user?.full_name || 'Security Analyst'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {user?.role_name ? user.role_name.replace('_', ' ') : 'Analyst'}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              slotProps={{
                paper: {
                  sx: { width: 180, mt: 1.5 }
                }
              }}
            >
              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
                <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><ExitToApp fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 72,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 72,
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            bgcolor: mode === 'dark' ? '#080c14' : '#FFFFFF',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxSizing: 'border-box',
            pt: 8,
          },
        }}
      >
        <Box sx={{ overflowY: 'auto', px: 1.5, py: 1.5 }}>
          {navSections.map((section, sIdx) => (
            <Box key={sIdx} sx={{ mb: 1.5 }}>
              {section.title && open && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    display: 'block',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'text.secondary',
                  }}
                >
                  {section.title}
                </Typography>
              )}
              <List disablePadding>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.3 }}>
                      <ListItemButton
                        onClick={() => navigate(item.path)}
                        selected={isActive}
                        sx={{
                          minHeight: 40,
                          justifyContent: open ? 'initial' : 'center',
                          px: 2,
                          borderRadius: 1.5,
                          '&.Mui-selected': {
                            bgcolor: mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)',
                            color: '#DC2626',
                            '&:hover': { bgcolor: mode === 'dark' ? 'rgba(220, 38, 38, 0.22)' : 'rgba(220, 38, 38, 0.12)' },
                            '& .MuiListItemIcon-root': { color: '#DC2626' },
                          },
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 1.8 : 'auto',
                            justifyContent: 'center',
                            color: isActive ? '#DC2626' : 'text.secondary',
                            fontSize: 18,
                          }}
                        >
                          {item.badge ? (
                            <Badge badgeContent={item.badge} color="error" variant="dot">
                              {item.icon}
                            </Badge>
                          ) : (
                            item.icon
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          sx={{
                            opacity: open ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '& .MuiTypography-root': {
                              fontWeight: isActive ? 800 : 500,
                              fontSize: '0.82rem',
                            },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}

          {/* Drawer Footer Attribution */}
          {open && (
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', display: 'block' }}>
                KAVACH Platform v2.4
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.64rem', fontWeight: 800, color: '#DC2626' }}>
                By Swastik Chemical (India)
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Main Outlet */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10, width: '100%', overflowX: 'hidden' }}>
        <Outlet context={{ analystMode: isAdvanced }} />
      </Box>

      {/* Cinematic Intro Overlay on First Login */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
    </Box>
  );
};
