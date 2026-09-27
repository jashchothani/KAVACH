import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

interface LivingSecurityFieldProps {
  isDark?: boolean;
}

export const LivingSecurityField: React.FC<LivingSecurityFieldProps> = ({ isDark = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);

    // Track mouse with smooth damping
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * window.devicePixelRatio;
      const y = (e.clientY - rect.top) * window.devicePixelRatio;
      mouseRef.current.targetX = (x - width / 2) * 0.15;
      mouseRef.current.targetY = (y - height / 2) * 0.15;
      mouseRef.current.isHovering = true;
    };
    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.isHovering = false;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Nodes & telemetry particles
    const nodeCount = 28;
    const nodes: Array<{
      angle: number;
      dist: number;
      baseDist: number;
      speed: number;
      size: number;
      alpha: number;
      targetAlpha: number;
      pulseOffset: number;
      color: string;
      isThreat?: boolean;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      const baseDist = (0.28 + Math.random() * 0.45) * Math.min(width, height) * 0.5;
      nodes.push({
        angle: Math.random() * Math.PI * 2,
        dist: baseDist,
        baseDist: baseDist,
        speed: (Math.random() - 0.5) * 0.004,
        size: 2 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.6,
        targetAlpha: 0.2 + Math.random() * 0.6,
        pulseOffset: Math.random() * Math.PI * 2,
        color: i % 7 === 0 ? '#DC2626' : i % 5 === 0 ? '#3B82F6' : '#94A3B8',
        isThreat: i % 7 === 0,
      });
    }

    let pulseRadius = 0;
    let time = 0;

    const render = () => {
      time += 0.018;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouseRef.current.x;
      const centerY = height / 2 + mouseRef.current.y;
      const baseRadius = Math.min(width, height) * 0.36;

      // 1. Soft radial background atmosphere
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5);
      bgGrad.addColorStop(0, 'rgba(220, 38, 38, 0.08)');
      bgGrad.addColorStop(0.45, 'rgba(220, 38, 38, 0.03)');
      bgGrad.addColorStop(0.8, 'rgba(59, 130, 246, 0.015)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Concentric delicate living field rings
      const ringCount = 3;
      for (let r = 1; r <= ringCount; r++) {
        const ringRadius = baseRadius * (0.6 + r * 0.22) + Math.sin(time + r) * 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = r === 2
          ? 'rgba(220, 38, 38, 0.22)'
          : isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(15, 23, 42, 0.08)';
        ctx.lineWidth = r === 2 ? 1.5 : 1;
        if (r === 1) {
          ctx.setLineDash([4, 8]);
        } else if (r === 3) {
          ctx.setLineDash([2, 6]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Ambient outward pulse wave (OBSERVE → DETECT → PROTECT)
      pulseRadius = (pulseRadius + 1.2) % (baseRadius * 1.3);
      const pulseAlpha = Math.max(0, 1 - pulseRadius / (baseRadius * 1.3)) * 0.35;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 38, 38, ${pulseAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 4. Update and connect telemetry nodes
      const calculatedNodes = nodes.map((node) => {
        node.angle += node.speed;
        const breathing = Math.sin(time + node.pulseOffset) * 6;
        const currentDist = node.baseDist + breathing;
        const nx = centerX + Math.cos(node.angle) * currentDist;
        const ny = centerY + Math.sin(node.angle) * currentDist;
        return { ...node, x: nx, y: ny };
      });

      // Draw faint connection lines between nearby nodes
      for (let i = 0; i < calculatedNodes.length; i++) {
        for (let j = i + 1; j < calculatedNodes.length; j++) {
          const dx = calculatedNodes[i].x - calculatedNodes[j].x;
          const dy = calculatedNodes[i].y - calculatedNodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * 0.22;
            ctx.beginPath();
            ctx.moveTo(calculatedNodes[i].x, calculatedNodes[i].y);
            ctx.lineTo(calculatedNodes[j].x, calculatedNodes[j].y);
            ctx.strokeStyle = calculatedNodes[i].isThreat || calculatedNodes[j].isThreat
              ? `rgba(220, 38, 38, ${lineAlpha * 1.5})`
              : isDark
              ? `rgba(255, 255, 255, ${lineAlpha})`
              : `rgba(15, 23, 42, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw individual telemetry nodes
      calculatedNodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.pulseOffset) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Faint glow around threat node
        if (node.isThreat) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(220, 38, 38, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // 5. Central KAVACH Protective Shield Emblem Core
      const coreSize = 36 * window.devicePixelRatio;
      // Soft core illumination glow
      const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize * 1.6);
      coreGlow.addColorStop(0, 'rgba(220, 38, 38, 0.35)');
      coreGlow.addColorStop(0.5, 'rgba(220, 38, 38, 0.1)');
      coreGlow.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Shield path
      ctx.save();
      ctx.translate(centerX, centerY);
      const shieldScale = (coreSize / 50) * (1 + Math.sin(time * 1.5) * 0.02);
      ctx.scale(shieldScale, shieldScale);

      // Shield outer border
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.bezierCurveTo(20, -28, 26, -20, 26, -5);
      ctx.bezierCurveTo(26, 16, 12, 30, 0, 36);
      ctx.bezierCurveTo(-12, 30, -26, 16, -26, -5);
      ctx.bezierCurveTo(-26, -20, -20, -28, 0, -28);
      ctx.closePath();

      // Shield interior gradient
      const shieldGrad = ctx.createLinearGradient(0, -28, 0, 36);
      shieldGrad.addColorStop(0, isDark ? '#1C1C24' : '#FFFFFF');
      shieldGrad.addColorStop(1, isDark ? '#0D0D12' : '#F8FAFC');
      ctx.fillStyle = shieldGrad;
      ctx.fill();

      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Subtle inner crimson core symbol
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(11, -2);
      ctx.lineTo(0, 18);
      ctx.lineTo(-11, -2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
      ctx.fill();

      ctx.restore();

      // 6. Orbital telemetry status pill in field
      const orbitAngle = time * 0.4;
      const orbitDist = baseRadius * 0.95;
      const ox = centerX + Math.cos(orbitAngle) * orbitDist;
      const oy = centerY + Math.sin(orbitAngle) * orbitDist;

      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#22C55E';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ox, oy, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDark]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 340, sm: 420, md: 500 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
        }}
      />
    </Box>
  );
};
export default LivingSecurityField;
