import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { RocketLaunch } from '@mui/icons-material';

interface Particle {
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  size: number;
  r: number;
  g: number;
  b: number;
  a: number;
  delay: number;
}

interface CinematicIntroProps {
  onComplete: () => void;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'loading' | 'assembling' | 'reveal' | 'ready'>('loading');
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const dprRef = useRef<number>(1);
  const revealedRef = useRef<boolean>(false);

  const buildParticles = useCallback((canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const dpr = dprRef.current;
    const vw = canvas.width / dpr;
    const vh = canvas.height / dpr;

    const offscreen = document.createElement('canvas');
    // Larger render → more pixels → sharper formed image
    const maxLogoWidth = Math.min(vw * 0.38, 420);
    const aspect = img.naturalHeight / img.naturalWidth;
    const logoW = Math.floor(maxLogoWidth);
    const logoH = Math.floor(maxLogoWidth * aspect);
    offscreen.width = logoW;
    offscreen.height = logoH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.drawImage(img, 0, 0, logoW, logoH);

    const imageData = offCtx.getImageData(0, 0, logoW, logoH);
    const px = imageData.data;

    const cx = vw / 2;
    const cy = vh / 2 - 80;
    const ox = cx - logoW / 2;
    const oy = cy - logoH / 2;

    const particles: Particle[] = [];
    const step = 2.4;

    for (let y = 0; y < logoH; y += step) {
      for (let x = 0; x < logoW; x += step) {
        const MathX = Math.floor(x);
        const MathY = Math.floor(y);
        const i = (MathY * logoW + MathX) * 4;
        const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];

        if (a < 100 || (r > 180 && g > 180 && b > 180)) continue;

        const tX = MathX + ox;
        const tY = MathY + oy;

        const dx = tX - cx;
        const dy = tY - cy;
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
        const dist = 350 + Math.random() * 350;
        const startX = cx + Math.cos(angle) * dist;
        const startY = cy + Math.sin(angle) * dist;

        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt((logoW / 2) ** 2 + (logoH / 2) ** 2);
        const delay = (distFromCenter / maxDist) * 0.28 + Math.random() * 0.1;

        particles.push({
          originX: startX,
          originY: startY,
          targetX: tX,
          targetY: tY,
          size: 1.8,
          r, g, b, a,
          delay,
        });
      }
    }

    // Cap at 4,500 particles for high-performance 60-120FPS
    if (particles.length > 4500) {
      const keep = 4500 / particles.length;
      const filtered = particles.filter(() => Math.random() < keep);
      particlesRef.current = filtered;
    } else {
      particlesRef.current = particles;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const setSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      buildParticles(canvas, img);
      startTimeRef.current = performance.now();
      setPhase('assembling');

      const DURATION = 3500; // 3.5s assembly

      const draw = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const globalT = Math.min(elapsed / DURATION, 1);
        const vw = canvas.width / dpr;
        const vh = canvas.height / dpr;

        // Solid clear — no ghosting trails
        ctx.fillStyle = '#030305';
        ctx.fillRect(0, 0, vw, vh);

        // Subtle ambient radial glow behind the assembly area
        const cx = vw / 2;
        const cy = vh / 2 - 80;
        const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, 280);
        grd.addColorStop(0, `rgba(193, 18, 31, ${0.03 + globalT * 0.05})`);
        grd.addColorStop(1, 'rgba(3, 3, 5, 0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, vw, vh);

        const particles = particlesRef.current;
        let settledCount = 0;

        for (const p of particles) {
          const rawT = Math.max(0, (globalT - p.delay) / (1 - p.delay));
          const t = easeOutCubic(Math.min(rawT, 1));

          if (t <= 0) continue;

          const drawX = p.originX + (p.targetX - p.originX) * t;
          const drawY = p.originY + (p.targetY - p.originY) * t;

          if (t >= 0.99) settledCount++;

          const alpha = (p.a / 255) * (0.2 + t * 0.8);
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;

          if (t > 0.92) {
            // Settled: crisp 1×1 pixel square
            ctx.fillRect(drawX, drawY, 1, 1);
          } else {
            // In flight: fast rect particle (no path arc overhead = 60FPS)
            const sz = 1.2 + (1 - t) * 0.8;
            ctx.fillRect(drawX, drawY, sz, sz);
          }
        }

        if (globalT >= 0.95) {
          if (!revealedRef.current) {
            revealedRef.current = true;
            setPhase('reveal');
            setTimeout(() => setPhase('ready'), 500);
          }

          // After assembly: subtle pulsing glow behind formed shield
          const pulseT = (performance.now() % 3000) / 3000;
          const pulseAlpha = 0.05 + Math.sin(pulseT * Math.PI * 2) * 0.03;
          const glowGrd = ctx.createRadialGradient(cx, cy, 30, cx, cy, 200);
          glowGrd.addColorStop(0, `rgba(193, 18, 31, ${pulseAlpha})`);
          glowGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrd;
          ctx.fillRect(0, 0, vw, vh);
        }

        animIdRef.current = requestAnimationFrame(draw);
      };

      draw();
    };
    img.src = '/assets/kavach-logo.png';

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animIdRef.current);
    };
  }, [buildParticles]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#030305',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Canvas particle rays */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: phase === 'assembling' ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />

        {/* SKIP Button - Anchored at top right */}
        <Box sx={{ position: 'fixed', top: 28, right: 28, zIndex: 100 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={onComplete}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: 1.5,
              px: 2,
              py: 0.5,
              borderRadius: 4,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                color: '#FFFFFF',
                borderColor: '#C1121F',
                bgcolor: 'rgba(193, 18, 31, 0.25)',
              },
            }}
          >
            SKIP
          </Button>
        </Box>

        {/* Central Reveal Container: High-Res Normal Logo + Bold Clear Text + Enter CTA */}
        {(phase === 'reveal' || phase === 'ready') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 20px',
            }}
          >
            {/* Normal crisp high-resolution transparent logo image */}
            <Box
              component="img"
              src="/assets/kavach-logo.png"
              alt="KAVACH Shield Logo"
              sx={{
                width: { xs: 240, sm: 300, md: 360 },
                height: 'auto',
                filter: 'drop-shadow(0 0 35px rgba(193, 18, 31, 0.7))',
                mb: 2.5,
              }}
            />

            {/* BY SWASTIK CHEMICAL (INDIA) - Bright, bold, crisp, highly visible */}
            <Typography
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 900,
                letterSpacing: 4,
                color: '#E63946',
                fontSize: { xs: '0.85rem', sm: '1.1rem' },
                textTransform: 'uppercase',
                mb: 0.8,
                textShadow: '0 0 16px rgba(230, 57, 70, 0.6)',
              }}
            >
              BY SWASTIK CHEMICAL (INDIA)
            </Typography>

            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 900,
                fontSize: { xs: '1.5rem', sm: '2.1rem' },
                color: '#F8FAFC',
                letterSpacing: 3,
                mb: 3,
                textShadow: '0 0 25px rgba(255, 255, 255, 0.3)',
              }}
            >
              KAVACH AI SOAR-XDR
            </Typography>

            <Button
              variant="contained"
              size="large"
              endIcon={<RocketLaunch />}
              onClick={onComplete}
              sx={{
                background: 'linear-gradient(135deg, #C1121F 0%, #8B0000 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.95rem',
                px: 4,
                py: 1.2,
                borderRadius: 3,
                letterSpacing: 1.5,
                boxShadow: '0 0 30px rgba(193, 18, 31, 0.6)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #E63946 0%, #C1121F 100%)',
                  boxShadow: '0 0 50px rgba(193, 18, 31, 0.9)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              ENTER PLATFORM
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
