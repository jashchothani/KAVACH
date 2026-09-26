import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Button, IconButton, Drawer, List,
  ListItem, ListItemButton, ListItemText, Stack, Divider
} from '@mui/material';
import {
  Menu as MenuIcon, Close as CloseIcon, Brightness4, Brightness7
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeMode } from '../context/ThemeContext';
import { Footer } from '../components/home/Footer';
import { AnimatedGradientBackground } from '../components/common/AnimatedGradientBackground';

const CR = '#DC2626';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    setMobileOpen(false);
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Product', path: '/' },
    { label: 'Protection', path: '/features' },
    { label: 'Intelligence', path: '/how-it-works' },
    { label: 'Raksha AI', path: '/raksha-ai' },
    { label: 'Security', path: '/security' },
    { label: 'About', path: '/about' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDark ? '#08080C' : '#FFFFFF',
        color: isDark ? '#FFFFFF' : '#0B0B0F',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        overflowX: 'hidden',
      }}
    >
      {/* ─── GLOBAL INNOVATIVE ANIMATED CHANGING GRADIENT BACKGROUND (NO DOTS) ─── */}
      <AnimatedGradientBackground isDark={isDark} />

      {/* Premium Full-Width Navbar */}
      <Box
        component={motion.header}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          height: { xs: 76, md: 84 },
          display: 'flex',
          alignItems: 'center',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          bgcolor: isDark
            ? (scrolled ? 'rgba(5, 5, 8, 0.85)' : 'transparent')
            : (scrolled ? 'rgba(253, 252, 251, 0.9)' : 'transparent'),
          borderBottom: scrolled ? (isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)') : '1px solid transparent',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Box
          sx={{
            maxWidth: 1440,
            width: '100%',
            mx: 'auto',
            px: { xs: 3, md: 6 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          {/* Left: Brand Logo & Tagline */}
          <Box
            onClick={() => handleNavigation('/')}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/kavach-logo-transparent.png"
              alt="KAVACH"
              onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
              sx={{
                height: { xs: 44, sm: 54, md: 68 },
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>

          {/* Center: Premium Text Navigation */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
              gap: 4.5,
            }}
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Box
                  key={link.label}
                  onClick={() => handleNavigation(link.path)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    py: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive
                        ? (isDark ? '#FFFFFF' : '#0B0B0F')
                        : (isDark ? 'rgba(255,255,255,0.7)' : '#475569'),
                      transition: 'color 0.2s',
                      '&:hover': {
                        color: isDark ? '#FFFFFF' : '#0B0B0F',
                      },
                    }}
                  >
                    {link.label}
                  </Typography>
                  {isActive && (
                    <Box
                      component={motion.div}
                      layoutId="nav-indicator"
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        bgcolor: CR,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.85)' : '#475569',
                display: 'inline-flex',
                '&:hover': { color: isDark ? '#FFFFFF' : '#0B0B0F' }
              }}
            >
              {isDark ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </IconButton>

            <Typography
              onClick={() => handleNavigation('/login')}
              sx={{
                display: { xs: 'none', lg: 'block' },
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: isDark ? '#FFFFFF' : '#0B0B0F',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.7 }
              }}
            >
              Sign In
            </Typography>

            <Button
              onClick={() => handleNavigation('/get-started')}
              sx={{
                display: { xs: 'none', lg: 'flex' },
                bgcolor: CR,
                color: '#FFFFFF',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#B91C1C',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                },
              }}
            >
              Get Started
            </Button>

            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                color: isDark ? '#FFFFFF' : '#0B0B0F',
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 360,
            bgcolor: isDark ? '#08080C' : '#FDFCFB',
            backgroundImage: 'none',
          },
        }}
      >
        <Box p={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'Outfit', color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
            KAVACH
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
        <List sx={{ p: 2 }}>
          {navLinks.map((link) => (
            <ListItem key={link.label} disablePadding sx={{ mb: 1 }}>
              <ListItemButton onClick={() => handleNavigation(link.path)} sx={{ borderRadius: 2 }}>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: isDark ? '#FFFFFF' : '#0B0B0F'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box p={3} mt="auto">
          <Stack spacing={2}>
            <Button
              fullWidth
              onClick={() => handleNavigation('/login')}
              sx={{
                py: 1.5,
                color: isDark ? '#FFFFFF' : '#0B0B0F',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleNavigation('/get-started')}
              sx={{
                py: 1.5,
                bgcolor: CR,
                color: '#FFFFFF',
                borderRadius: 2,
                fontWeight: 700,
                '&:hover': { bgcolor: '#B91C1C' }
              }}
            >
              Get Started
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Footer */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <Footer isDark={isDark} />
      </Box>
    </Box>
  );
};
