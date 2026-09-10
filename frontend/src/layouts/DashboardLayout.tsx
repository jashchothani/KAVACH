import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu,
  MenuItem, Badge, Tooltip, useTheme
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Security, Explore,
  PlayCircleFilled, Assignment, Settings, ExitToApp, Brightness4,
  Brightness7, Notifications, Shield, Gavel, BarChart, BugReport
} from '@mui/icons-material';
import { useAuth } from '../context/useAuth';
import { useAppTheme } from '../context/useAppTheme';

const drawerWidth = 260;

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifMenuClose = () => {
    setNotifAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav Items configured for KAVACH SOC
  const menuItems = [
    { text: 'SOC Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Threat Detection', icon: <BugReport />, path: '/threats' },
    { text: 'MITRE ATT&CK', icon: <Explore />, path: '/mitre' },
    { text: 'SOAR Playbooks', icon: <PlayCircleFilled />, path: '/soar' },
    { text: 'Incident Response', icon: <Assignment />, path: '/incidents' },
    { text: 'AI Security', icon: <Security />, path: '/ai-security' },
    { text: 'Threat Intelligence', icon: <Shield />, path: '/threat-intel' },
    { text: 'Alert Center', icon: <Notifications />, path: '/alerts', badge: 5 },
    { text: 'Analytics Center', icon: <BarChart />, path: '/analytics' },
    { text: 'Audit Center', icon: <Gavel />, path: '/audit' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', transition: 'background-color 0.3s' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: mode === 'dark' ? 'rgba(17, 17, 24, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => setOpen(!open)}
              edge="start"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo area */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
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
                  KAVACH <span style={{ color: '#C1121F' }}>SOC</span>
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: '#C1121F', display: 'block', fontWeight: 700 }}>
                  SWASTIK CHEMICAL (INDIA)
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title="Toggle Light/Dark Theme">
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'dark' ? <Brightness7 sx={{ color: '#F59E0B' }} /> : <Brightness4 />}
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
              PaperProps={{
                sx: { width: 320, mt: 1.5, maxHeight: 400 }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">Active Alerts</Typography>
                <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => navigate('/alerts')}>View All</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleNotifMenuClose}>
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold" color="error.main">Ransomware Suspected</Typography>
                    <Typography variant="caption" color="text.secondary">10m ago</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">Suspicious activity on host PROD-WEB-01</Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotifMenuClose}>
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold" color="warning.main">Deepfake Upload Analysis</Typography>
                    <Typography variant="caption" color="text.secondary">1h ago</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">Authentication process complete (94% confidence)</Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotifMenuClose}>
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold" color="info.main">Playbook Success</Typography>
                    <Typography variant="caption" color="text.secondary">3h ago</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">Isolation playbook executed on DEV-APP-03</Typography>
                </Box>
              </MenuItem>
            </Menu>

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, cursor: 'pointer' }} onClick={handleProfileMenuOpen}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.95rem', fontWeight: 'bold' }}>
                {user?.full_name[0] || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1 }}>{user?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {user?.role_name.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: { width: 180, mt: 1.5 }
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
            bgcolor: mode === 'dark' ? '#0F0F16' : '#FFFFFF',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxSizing: 'border-box',
            pt: 8,
          },
        }}
      >
        <List sx={{ px: 1.5, py: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(193, 18, 31, 0.1)',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'rgba(193, 18, 31, 0.15)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      }
                    },
                    '&:hover': {
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      transition: 'color 0.2s',
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error" variant="dot">
                        {item.icon}
                      </Badge>
                    ) : item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: open ? 1 : 0,
                      transition: 'opacity 0.2s',
                      '& .MuiTypography-root': {
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.85rem',
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 11, width: '100%', overflowX: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  );
};
