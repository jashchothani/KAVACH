import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box, Container, Typography, Button, IconButton, Drawer, List,
  ListItem, ListItemButton, ListItemText, useTheme, Chip, Stack,
  Divider, Tooltip, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import {
  Menu as MenuIcon, Close as CloseIcon, Brightness4, Brightness7,
  ArrowForward, Lock, RocketLaunch, Download, PhoneCallback, Info, Home,
  KeyboardArrowUp, CheckCircle, PlayCircle, AutoAwesome
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppTheme } from '../context/useAppTheme';
import { CinematicIntro } from '../components/common/CinematicIntro';
import { KavachLogo } from '../components/common/KavachLogo';
import { SystemSpecsModal } from '../components/common/SystemSpecsModal';

export const PublicLayout: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    // Show intro on first load of session
    return !sessionStorage.getItem('kavach_intro_seen');
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('kavach_intro_seen', 'true');
  };

  const navLinks = [
    { label: 'Overview', path: '/', icon: <Home fontSize="small" /> },
    { label: 'Project Roadmap', path: '/about', icon: <Info fontSize="small" /> },
    { label: '3D Showcase', path: '/showcase', icon: <AutoAwesome fontSize="small" /> },
    { label: 'Download Agents', path: '/download', icon: <Download fontSize="small" /> },
    { label: 'Setup Guide', path: '/get-started', icon: <RocketLaunch fontSize="small" /> },
    { label: 'Contact', path: '/contact', icon: <PhoneCallback fontSize="small" /> },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      className={isDark ? 'cyber-grid-bg' : ''}
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Cinematic Intro Animation Overlay */}
      <AnimatePresence>
        {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(20px)',
          bgcolor: isDark ? 'rgba(8, 8, 12, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          borderBottom: isDark ? '1px solid rgba(193, 18, 31, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="xl">
          <Box display="flex" alignItems="center" justifyContent="space-between" py={1.5}>
            {/* Brand Logo & Name */}
            <Box onClick={() => navigate('/')}>
              <KavachLogo size="md" showSubtitle={true} />
            </Box>

            {/* Desktop Navigation Links */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Button
                    key={link.path}
                    component={Link}
                    to={link.path}
                    startIcon={link.icon}
                    sx={{
                      color: isActive ? '#C1121F' : isDark ? '#E2E8F0' : '#1E293B',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.9rem',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      position: 'relative',
                      bgcolor: isActive ? (isDark ? 'rgba(193, 18, 31, 0.12)' : 'rgba(193, 18, 31, 0.08)') : 'transparent',
                      border: isActive ? '1px solid rgba(193, 18, 31, 0.3)' : '1px solid transparent',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(193, 18, 31, 0.15)' : 'rgba(193, 18, 31, 0.06)',
                        color: '#C1121F',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {link.label}
                  </Button>
                );
              })}
            </Stack>

            {/* Right Action CTA Buttons & Theme Toggle */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSpecsModalOpen(true)}
                sx={{
                  display: { xs: 'none', lg: 'inline-flex' },
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  color: isDark ? '#93C5FD' : '#2563EB',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 1.8,
                  '&:hover': {
                    borderColor: '#3B82F6',
                    bgcolor: 'rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                System Specs
              </Button>

              <Tooltip title="Replay Cinematic Intro Animation">
                <IconButton
                  onClick={() => setShowIntro(true)}
                  sx={{
                    color: '#C1121F',
                    bgcolor: isDark ? 'rgba(193, 18, 31, 0.15)' : 'rgba(193, 18, 31, 0.08)',
                    '&:hover': { bgcolor: 'rgba(193, 18, 31, 0.25)' }
                  }}
                >
                  <PlayCircle fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    color: isDark ? '#F59E0B' : '#1E293B',
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                  }}
                >
                  {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                </IconButton>
              </Tooltip>

              <Button
                variant="outlined"
                startIcon={<Lock fontSize="small" />}
                onClick={() => navigate('/login')}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  borderColor: 'rgba(193, 18, 31, 0.5)',
                  color: isDark ? '#FFFFFF' : '#C1121F',
                  fontWeight: 700,
                  px: 2.5,
                  py: 0.8,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#C1121F',
                    bgcolor: 'rgba(193, 18, 31, 0.1)'
                  }
                }}
              >
                Login
              </Button>

              <Button
                variant="contained"
                endIcon={<ArrowForward fontSize="small" />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  px: 2.5,
                  py: 0.9,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(193, 18, 31, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #E63946 0%, #C1121F 100%)',
                    boxShadow: '0 6px 25px rgba(193, 18, 31, 0.6)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Launch SOAR
              </Button>

              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Mobile Drawer Navigation */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: isDark ? '#0A0A0F' : '#FFFFFF',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
          }
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <KavachLogo size="sm" />
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <List>
            {navLinks.map((link) => (
              <ListItem key={link.path} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component={Link}
                  to={link.path}
                  onClick={handleDrawerToggle}
                  selected={location.pathname === link.path}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(193, 18, 31, 0.15)',
                      color: '#C1121F',
                      fontWeight: 700,
                    }
                  }}
                >
                  <Box mr={2} color={location.pathname === link.path ? '#C1121F' : 'inherit'}>
                    {link.icon}
                  </Box>
                  <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box mt={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<RocketLaunch />}
            onClick={() => {
              handleDrawerToggle();
              navigate('/dashboard');
            }}
            sx={{
              background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
              py: 1.2,
              borderRadius: 2,
              fontWeight: 800,
            }}
          >
            Launch Command Center
          </Button>
        </Box>
      </Drawer>

      {/* Main Page Content View with Framer Motion Animation */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Footer Component */}
      <Box
        component="footer"
        sx={{
          bgcolor: isDark ? '#040407' : '#0F172A',
          color: '#F8FAFC',
          pt: 8,
          pb: 4,
          borderTop: '1px solid rgba(193, 18, 31, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="xl">
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }} gap={4} mb={6}>
            {/* Col 1: Brand Info */}
            <Box>
              <Box mb={2}>
                <KavachLogo size="sm" showSubtitle={true} />
              </Box>
              <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2, maxWidth: 360, lineHeight: 1.7 }}>
                Next-Generation AI-Driven SOAR-XDR Threat Intelligence & Autonomous Incident Response Platform built with <strong>Swastik Chemical (India)</strong> for critical infrastructure & enterprise networks.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#CBD5E1', mb: 2, lineHeight: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong>Project Team:</strong> Jash Bharat Chothani (B007) • Shishir Jaimin Bhavsar (B030) • Ved Kantilal Waghela (B061)<br />
                <span style={{ color: '#94A3B8' }}>Shri Bhagubhai Mafatlal Polytechnic</span>
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<CheckCircle style={{ color: '#10B981', fontSize: 14 }} />}
                  label="SOC Systems Operational"
                  size="small"
                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}
                />
              </Stack>
            </Box>

            {/* Col 2: Navigation Links */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#C1121F', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                Navigation
              </Typography>
              <Stack spacing={1.2}>
                <Link to="/" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.9rem' }}>Home Overview</Link>
                <Link to="/about" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.9rem' }}>About Swastik Chemical & Kavach</Link>
                <Link to="/download" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.9rem' }}>Download Agents & CLI</Link>
                <Link to="/contact" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.9rem' }}>24/7 Threat Response Contact</Link>
                <Link to="/get-started" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.9rem' }}>Get Started Wizard</Link>
              </Stack>
            </Box>

            {/* Col 3: Core Security Modules */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#C1121F', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                Modules & Engines
              </Typography>
              <Stack spacing={1.2}>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>AI Neural Deepfake Detector</Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Autonomous SOAR Playbooks</Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>MITRE ATT&CK Matrix v14</Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Industrial OT & Chemical Defense</Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>SIEM Telemetry Pipeline</Typography>
              </Stack>
            </Box>

            {/* Col 4: Compliance & Certifications */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#C1121F', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                Certifications
              </Typography>
              <Stack spacing={1} mb={2}>
                <Chip label="ISO/IEC 27001 Certified" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0' }} />
                <Chip label="SOC2 Type II Compliant" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0' }} />
                <Chip label="GDPR & CERT-In Ready" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0' }} />
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={2}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              © {new Date().getFullYear()} <strong>KAVACH BY SWASTIK CHEMICAL (INDIA)</strong>. All Rights Reserved. Protected by Military-Grade Encryption.
            </Typography>

            <IconButton
              onClick={scrollToTop}
              size="small"
              sx={{
                bgcolor: 'rgba(193, 18, 31, 0.2)',
                color: '#E63946',
                border: '1px solid rgba(193, 18, 31, 0.4)',
                '&:hover': { bgcolor: '#C1121F', color: '#FFFFFF' }
              }}
            >
              <KeyboardArrowUp />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* System Specifications Modal Dialog */}
      <Dialog
        open={specsModalOpen}
        onClose={() => setSpecsModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#0A0A10' : '#FFFFFF',
            borderRadius: 4,
            border: '1px solid rgba(193, 18, 31, 0.3)',
            p: { xs: 2, md: 3 },
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <KavachLogo size="sm" />
            <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit' }}>
              System Specifications & Architecture
            </Typography>
          </Box>
          <IconButton onClick={() => setSpecsModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, md: 2 } }}>
          <SystemSpecsModal />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
