import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu,
  MenuItem, Badge, Tooltip, useTheme, Chip, TextField, InputAdornment
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Shield, Warning, AccessTime,
  Computer, Router, Search, Lock, Person, Apps, InsertDriveFile,
  Usb, Psychology, History, BarChart, Badge as BadgeIcon, Assessment,
  Settings, ExitToApp, Brightness4, Brightness7, NotificationsNone,
  FiberManualRecord, Whatshot
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { isAnalystRole } from '../context/AuthContext';
import { useAppTheme } from '../context/useAppTheme';
import { KavachLogo } from '../components/common/KavachLogo';
import { SecurityPassportModal } from '../components/user/SecurityPassportModal';
import { SecurityReportModal } from '../components/user/SecurityReportModal';

const DRAWER_W = 260;
const CR = '#DC2626';
const SAFE = '#22C55E';

interface UserNavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  isActionModal?: 'passport' | 'reports';
}

const USER_NAV_ITEMS: UserNavItem[] = [
  { text: 'Overview', icon: <Dashboard />, path: '/dashboard' },
  { text: 'My Security', icon: <Shield />, path: '/user/my-security' },
  { text: 'Alerts', icon: <Warning />, path: '/user/alerts', badge: 1 },
  { text: 'Digital Day', icon: <AccessTime />, path: '/user/digital-day' },
  { text: 'My Devices', icon: <Computer />, path: '/user/devices' },
  { text: 'Network', icon: <Router />, path: '/user/network' },
  { text: 'Is This Safe?', icon: <Search />, path: '/user/is-this-safe' },
  { text: 'Privacy', icon: <Lock />, path: '/user/privacy' },
  { text: 'Account Security', icon: <Person />, path: '/user/account' },
  { text: 'Applications', icon: <Apps />, path: '/user/apps' },
  { text: 'File Protection', icon: <InsertDriveFile />, path: '/user/file-protection' },
  { text: 'USB Devices', icon: <Usb />, path: '/user/usb' },
  { text: 'Raksha AI', icon: <Psychology />, path: '/user/raksha' },
  { text: 'Protection History', icon: <History />, path: '/user/history' },
  { text: 'Security Analytics', icon: <BarChart />, path: '/user/analytics' },
  { text: 'Security Passport', icon: <BadgeIcon />, path: '/user/passport', isActionModal: 'passport' },
  { text: 'Reports', icon: <Assessment />, path: '/user/reports', isActionModal: 'reports' },
  { text: 'Settings', icon: <Settings />, path: '/user/settings' },
];

export const UserDashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [passportOpen, setPassportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = mode === 'dark';

  const sidebarBg = isDark ? '#0A0B10' : '#F8FAFC';
  const mainBg = isDark ? '#06070A' : '#F4F6F9';
  const border = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)';

  const handleNavClick = (item: UserNavItem) => {
    if (item.isActionModal === 'passport') {
      setPassportOpen(true);
      return;
    }
    if (item.isActionModal === 'reports') {
      setReportOpen(true);
      return;
    }
    navigate(item.path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: sidebarBg, p: 2 }}>
      {/* Brand Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.5, mb: 1 }}>
        <KavachLogo size="sm" />
        <Box>
          <Typography sx={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.2rem', lineHeight: 1, letterSpacing: '-0.02em', color: 'text.primary' }}>
            KAVACH
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono', fontWeight: 800, color: CR, letterSpacing: '0.08em' }}>
            SOVEREIGN DEFENSE
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: border, mb: 1.5 }} />

      {/* Navigation List */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 0.5 }}>
        {USER_NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard');

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.4 }}>
              <ListItemButton
                onClick={() => handleNavClick(item)}
                sx={{
                  borderRadius: 3,
                  py: 1.1,
                  px: 2,
                  bgcolor: isActive ? (isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF') : 'transparent',
                  color: isActive ? (isDark ? '#FFFFFF' : '#0B0B0F') : 'text.secondary',
                  boxShadow: isActive ? (isDark ? '0 4px 14px rgba(0,0,0,0.5)' : '0 4px 14px rgba(15,23,42,0.06)') : 'none',
                  border: isActive ? `1px solid ${border}` : '1px solid transparent',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    bgcolor: isActive
                      ? (isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF')
                      : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.03)'),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? CR : 'inherit',
                    fontSize: 20,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 800 : 600,
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 18,
                      minWidth: 18,
                      fontSize: '0.62rem',
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 900,
                      bgcolor: CR,
                      color: '#FFFFFF',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: border, my: 1.5 }} />

      {/* User Mini Profile Card */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          border: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: CR,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          >
            {(user?.username || 'U')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.2 }}>
              {user?.username || 'User'}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
              {user?.role_name || 'User'}
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary' }}>
          <ExitToApp fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: mainBg }}>
      {/* ─── Top AppBar (Bento Aesthetic Matching Reference) ─── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: isDark ? 'rgba(10, 11, 16, 0.88)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${border}`,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, minHeight: 68 }}>
          {/* Mobile Menu Trigger & Title */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <IconButton
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { md: 'none' }, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
              Security Command Center
            </Typography>

            {/* Reference Image Company / Network Pill */}
            <Chip
              label="swastik.corp / jash-laptop"
              size="small"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                fontFamily: 'JetBrains Mono',
                fontWeight: 700,
                fontSize: '0.72rem',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                border: `1px solid ${border}`,
              }}
            />
          </Box>

          {/* Search & Actions Bar (Matching Reference Image) */}
          <Box display="flex" alignItems="center" gap={1.5}>
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search security checks, tools, alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 999,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                  width: { xs: 140, sm: 240, md: 280 },
                  fontSize: '0.82rem',
                },
              }}
            />

            {/* Notifications Icon with Badge */}
            <IconButton size="small" sx={{ color: 'text.primary' }}>
              <Badge badgeContent={1} color="error">
                <NotificationsNone fontSize="small" />
              </Badge>
            </IconButton>

            {/* Theme Toggle */}
            <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.primary' }}>
              {isDark ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </IconButton>

            {/* Profile Avatar */}
            <Avatar
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                width: 36,
                height: 36,
                bgcolor: CR,
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 14px ${CR}60`,
                },
              }}
            >
              {(user?.username || 'U')[0].toUpperCase()}
            </Avatar>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  width: 230,
                  mt: 1.5,
                  borderRadius: 3,
                  bgcolor: isDark ? '#0D0E15' : '#FFFFFF',
                  border: `1px solid ${border}`,
                  boxShadow: isDark
                    ? '0 16px 48px rgba(0,0,0,0.65)'
                    : '0 8px 32px rgba(15,23,42,0.12)',
                  overflow: 'hidden',
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${border}` }}>
                <Typography variant="body2" fontWeight={800} sx={{ color: 'text.primary' }}>
                  {user?.username || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', wordBreak: 'break-all' }}>
                  {user?.email || 'user@kavach.io'}
                </Typography>
                <Chip
                  label={user?.role_name || 'User'}
                  size="small"
                  sx={{
                    mt: 0.8,
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono',
                    bgcolor: 'rgba(220,38,38,0.1)',
                    color: '#DC2626',
                    border: '1px solid rgba(220,38,38,0.2)',
                  }}
                />
              </Box>

              {/* If user is an analyst or admin, allow switching to SOC Console */}
              {isAnalystRole(user?.role) && (
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate('/analyst');
                  }}
                  sx={{ gap: 1.5, py: 1.2 }}
                >
                  <Dashboard sx={{ fontSize: 18, color: '#DC2626' }} />
                  <Typography variant="body2" fontWeight={600}>
                    Switch to SOC Console
                  </Typography>
                </MenuItem>
              )}

              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate('/user/settings');
                }}
                sx={{ gap: 1.5, py: 1.2 }}
              >
                <Settings sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600}>
                  Security Settings
                </Typography>
              </MenuItem>

              <Divider sx={{ borderColor: border }} />

              <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.2, color: '#DC2626' }}>
                <ExitToApp sx={{ fontSize: 18, color: '#DC2626' }} />
                <Typography variant="body2" fontWeight={700} color="#DC2626">
                  Sign Out
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Desktop Sidebar ─── */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_W }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_W, borderRight: `1px solid ${border}` },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_W,
              boxSizing: 'border-box',
              borderRight: `1px solid ${border}`,
              top: 0,
              height: '100vh',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* ─── Main Content Canvas ─── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${DRAWER_W}px)` },
          mt: '68px',
          minHeight: 'calc(100vh - 68px)',
        }}
      >
        {children || <Outlet />}
      </Box>

      {/* Modals triggered from layout */}
      <SecurityPassportModal
        open={passportOpen}
        onClose={() => setPassportOpen(false)}
        isDark={isDark}
      />

      <SecurityReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        isDark={isDark}
        score={94}
      />
    </Box>
  );
};
