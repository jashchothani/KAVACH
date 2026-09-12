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
  const [analystMode, setAnalystMode] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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
              <Box
                component="img"
                src="/assets/kavach-logo.png"
                alt="KAVACH"
                sx={{
                  height: 32,
                  width: 'auto',
                  filter: 'drop-shadow(0 0 6px rgba(193, 18, 31, 0.6))',
                }}
              />
              <Box>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.1, fontFamily: 'Outfit', color: mode === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  KAVACH <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>SOAR-XDR</span>
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'text.secondary', display: 'block', fontWeight: 600 }}>
                  INTELLIGENT DEFENSE PLATFORM
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Live WebSocket Status Pill */}
            <Tooltip title={wsConnected ? 'WebSocket live stream connected to :8000' : 'WebSocket disconnected (offline)'}>
              <Chip
                icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
                label={wsConnected ? 'LIVE' : 'OFFLINE'}
                size="small"
                sx={{
                  bgcolor: wsConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: wsConnected ? '#22c55e' : '#ef4444',
                  fontWeight: 700,
                  fontSize: 10,
                  border: `1px solid ${wsConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              />
            </Tooltip>

            {/* Normal User Mode vs Analyst Mode Toggle */}
            <Tooltip title="Switch between Simplified Protection Mode and Deep SOC Telemetry View">
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, bgcolor: 'background.paper', px: 1.5, py: 0.2, borderRadius: 9999, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: !analystMode ? '#38bdf8' : 'text.secondary' }}>
                  User
                </Typography>
                <Switch
                  size="small"
                  checked={analystMode}
                  onChange={(e) => setAnalystMode(e.target.checked)}
                  color="primary"
                />
                <Typography variant="caption" sx={{ fontWeight: 600, color: analystMode ? '#a855f7' : 'text.secondary' }}>
                  Analyst
                </Typography>
              </Box>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} color="inherit" size="small">
                {mode === 'dark' ? <Brightness7 sx={{ color: '#F59E0B', fontSize: 20 }} /> : <Brightness4 sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5, cursor: 'pointer' }} onClick={handleProfileMenuOpen}>
              <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32, fontSize: '0.85rem', fontWeight: 'bold' }}>
                {user?.full_name?.[0] || 'A'}
              </Avatar>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{ sx: { width: 180, mt: 1.5 } }}
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
                            bgcolor: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.18)' },
                            '& .MuiListItemIcon-root': { color: '#38bdf8' },
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
                            color: isActive ? '#38bdf8' : 'text.secondary',
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
                              fontWeight: isActive ? 700 : 500,
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
        </Box>
      </Drawer>

      {/* Main Outlet */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10, width: '100%', overflowX: 'hidden' }}>
        <Outlet context={{ analystMode }} />
      </Box>
    </Box>
  );
};
