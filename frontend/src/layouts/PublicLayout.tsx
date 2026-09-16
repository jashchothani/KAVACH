import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Button, IconButton, Drawer, List,
  ListItem, ListItemButton, ListItemText, Stack, Divider, ThemeProvider
} from '@mui/material';
import {
  Menu as MenuIcon, Close as CloseIcon,
  ArrowForward, Lock, RocketLaunch, KeyboardArrowUp, Shield
} from '@mui/icons-material';
import { lightTheme } from '../theme/theme';
import { KavachLogo } from '../components/common/KavachLogo';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', path: '/#overview' },
    { label: 'Features', path: '/#features' },
    { label: 'Protection', path: '/#protection' },
    { label: 'Devices', path: '/#devices' },
    { label: 'About', path: '/about' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#F8FAFC',
          color: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top Navigation Bar: Clean White Glassmorphism Sticky Header */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            backdropFilter: 'blur(20px)',
            bgcolor: 'rgba(255, 255, 255, 0.92)',
            borderBottom: '1px solid #E2E8F0',
            boxShadow: '0 2px 14px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.25s ease',
          }}
        >
          <Container maxWidth="xl">
            <Box display="flex" alignItems="center" justifyContent="space-between" py={1.5}>
              {/* Left: Official KAVACH Transparent Logo */}
              <Box onClick={() => navigate('/')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <KavachLogo size="md" showSubtitle={true} tagline="AI-Driven Security. Simplified for Everyone." />
              </Box>

              {/* Center: Overview, Features, Protection, Devices, About */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: 'none', md: 'flex' } }}
              >
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path || (link.path === '/#overview' && location.pathname === '/' && !location.hash);
                  return (
                    <Button
                      key={link.label}
                      onClick={() => {
                        if (link.path.startsWith('/#')) {
                          if (location.pathname !== '/') {
                            navigate(link.path);
                          } else {
                            const targetId = link.path.replace('/#', '');
                            const el = document.getElementById(targetId);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              navigate(link.path);
                            }
                          }
                        } else {
                          navigate(link.path);
                        }
                      }}
                      sx={{
                        color: isActive ? '#DC2626' : '#334155',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.92rem',
                        px: 2,
                        py: 0.8,
                        borderRadius: 2.5,
                        bgcolor: isActive ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                        '&:hover': {
                          bgcolor: 'rgba(220, 38, 38, 0.06)',
                          color: '#DC2626',
                        },
                        textTransform: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </Stack>

              {/* Right: Sign In + High-Impact "Get Started" CTA */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  startIcon={<Lock sx={{ fontSize: 16 }} />}
                  sx={{
                    color: '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    display: { xs: 'none', sm: 'inline-flex' },
                    px: 2,
                    py: 0.9,
                    borderRadius: 2.5,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  Sign In
                </Button>

                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    px: 2.8,
                    py: 1,
                    borderRadius: 2.5,
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
                    '&:hover': {
                      bgcolor: '#B91C1C',
                      boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)',
                    },
                  }}
                >
                  Get Started Free
                </Button>

                {/* Mobile Menu Hamburger */}
                <IconButton
                  onClick={handleDrawerToggle}
                  sx={{ display: { md: 'none' }, color: '#0F172A' }}
                >
                  {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
              </Stack>
            </Box>
          </Container>
        </Box>

        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: 280,
              bgcolor: '#FFFFFF',
              p: 3,
            }
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <KavachLogo size="sm" showSubtitle={false} />
            <IconButton onClick={handleDrawerToggle} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {navLinks.map((item) => (
              <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 700, color: '#0F172A' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box mt={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => { navigate('/login'); setMobileOpen(false); }}
              sx={{
                bgcolor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 800,
                py: 1.2,
                borderRadius: 2.5,
                mb: 1.5,
              }}
            >
              Sign In to KAVACH
            </Button>
          </Box>
        </Drawer>

        {/* Main Public Website Content */}
        <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
          <Outlet />
        </Box>

        {/* Clean Modern Light SaaS Footer */}
        <Box
          component="footer"
          sx={{
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            pt: 8,
            pb: 4,
            mt: 'auto',
          }}
        >
          <Container maxWidth="xl">
            <Box
              display="flex"
              flexDirection={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              gap={4}
              mb={6}
            >
              <Box maxWidth={460}>
                <Box mb={2}>
                  <KavachLogo size="lg" showSubtitle={false} />
                </Box>
                <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.7, mb: 2 }}>
                  AI-driven autonomous threat deflection and endpoint security platform.
                  Built for everyday simplicity, backed by the industrial manufacturing heritage of <strong>Swastik Chemical (India)</strong>.
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16A34A' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#16A34A' }}>
                    Sentinel Engine v2.4 Active & Operational
                  </Typography>
                </Box>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 6 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
                    Platform
                  </Typography>
                  <Stack spacing={1}>
                    {['Overview', 'Features', 'Protection', 'Devices'].map((item) => (
                      <Typography
                        key={item}
                        variant="body2"
                        onClick={() => navigate(`/#${item.toLowerCase()}`)}
                        sx={{ color: '#64748B', cursor: 'pointer', '&:hover': { color: '#DC2626' } }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
                    Access & Company
                  </Typography>
                  <Stack spacing={1}>
                    <Typography
                      variant="body2"
                      onClick={() => navigate('/about')}
                      sx={{ color: '#64748B', cursor: 'pointer', '&:hover': { color: '#DC2626' } }}
                    >
                      About Swastik Chemical
                    </Typography>
                    <Typography
                      variant="body2"
                      onClick={() => navigate('/login')}
                      sx={{ color: '#64748B', cursor: 'pointer', '&:hover': { color: '#DC2626' } }}
                    >
                      Login Portal
                    </Typography>
                    <Typography
                      variant="body2"
                      onClick={() => navigate('/download')}
                      sx={{ color: '#64748B', cursor: 'pointer', '&:hover': { color: '#DC2626' } }}
                    >
                      Download Agent
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems="center"
              gap={2}
            >
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                © {new Date().getFullYear()} <strong>KAVACH BY SWASTIK CHEMICAL (INDIA)</strong>. All Rights Reserved. Enterprise TLS Encrypted.
              </Typography>

              <IconButton
                onClick={scrollToTop}
                size="small"
                sx={{
                  bgcolor: '#F1F5F9',
                  color: '#0F172A',
                  '&:hover': { bgcolor: '#DC2626', color: '#FFFFFF' },
                }}
              >
                <KeyboardArrowUp />
              </IconButton>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
export default PublicLayout;
