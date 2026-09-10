import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface ShowcaseProject {
  id: string;
  badge: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  secondaryColor: string;
  tags: string[];
  metrics: { label: string; val: string }[];
  caseStudy: {
    overview: string;
    architecture: string[];
    threatVectors: string[];
    sampleLogs: string[];
  };
}

interface NoomoCrystalCanvasProps {
  projects: ShowcaseProject[];
  activeIndex: number;
  onSelectProject: (index: number) => void;
  onClickCrystal?: (index: number) => void;
  isAudioMuted: boolean;
}

// Procedural Cyberpunk Environment Cube Texture for realistic crystal reflections
const createCyberEnvTexture = (): THREE.DataTexture => {
  const size = 512;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const ny = (y / size) * 2 - 1;
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 2 - 1;
      const index = (y * size + x) * 4;

      // Studio horizon lighting with cyber-cyan and crimson accent bars
      const dist = Math.sqrt(nx * nx + ny * ny);
      const horizon = Math.exp(-Math.pow(ny * 4.5, 2)) * 255;
      const topLight = Math.max(0, -ny) * 90;
      const studioGlint = Math.max(0, 1 - dist * 1.5) * 120;

      // Blue-cyan studio ambience + specular highlight strips
      const r = Math.min(255, Math.floor(horizon * 0.25 + topLight * 0.15 + (x % 64 < 2 ? 80 : 0)));
      const g = Math.min(255, Math.floor(horizon * 0.6 + topLight * 0.35 + studioGlint * 0.4 + (x % 64 < 2 ? 140 : 0)));
      const b = Math.min(255, Math.floor(horizon * 0.95 + topLight * 0.8 + studioGlint * 0.8 + 30));

      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
};

// Procedurally generate HiDPI 2048x2048 artwork with bounded geometry & cyber telemetry
const createProjectArtworkTexture = (project: ShowcaseProject): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = 1024;
  const cy = 1024;

  // 1. Deep Cyber Radial Void
  const bgGrad = ctx.createRadialGradient(cx, cy, 100, cx, cy, 1024);
  if (project.id === '01') {
    // Coinbase x Warriors Sunset Golden Horizon
    bgGrad.addColorStop(0, '#1d1742');
    bgGrad.addColorStop(0.45, '#311b58');
    bgGrad.addColorStop(0.75, '#b45309');
    bgGrad.addColorStop(1, '#050b1f');
  } else if (project.id === '02') {
    // Autonomous SOAR Matrix Amber Gold
    bgGrad.addColorStop(0, '#1c1304');
    bgGrad.addColorStop(0.45, '#451a03');
    bgGrad.addColorStop(0.8, '#78350f');
    bgGrad.addColorStop(1, '#020617');
  } else if (project.id === '03') {
    // Synthetic Shield Cyber Pink
    bgGrad.addColorStop(0, '#2d061e');
    bgGrad.addColorStop(0.45, '#500724');
    bgGrad.addColorStop(0.8, '#831843');
    bgGrad.addColorStop(1, '#05050e');
  } else if (project.id === '04') {
    // MITRE Matrix Cyber Purple
    bgGrad.addColorStop(0, '#1a0b36');
    bgGrad.addColorStop(0.5, '#2e1065');
    bgGrad.addColorStop(0.8, '#581c87');
    bgGrad.addColorStop(1, '#030712');
  } else if (project.id === '05') {
    // SCADA OT Emerald Matrix
    bgGrad.addColorStop(0, '#022c22');
    bgGrad.addColorStop(0.5, '#064e3b');
    bgGrad.addColorStop(0.8, '#047857');
    bgGrad.addColorStop(1, '#020617');
  } else {
    // Decentralized Audit Crimson Vault
    bgGrad.addColorStop(0, '#2b0609');
    bgGrad.addColorStop(0.5, '#4c0519');
    bgGrad.addColorStop(0.8, '#9f1239');
    bgGrad.addColorStop(1, '#030712');
  }

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 2048, 2048);

  // 2. Cyber Telemetry Grid & Perspective Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2.5;

  // Concentric Radar Reticle
  for (let r = 200; r <= 900; r += 175) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radial Crosshairs
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160);
    ctx.lineTo(cx + Math.cos(a) * 920, cy + Math.sin(a) * 920);
    ctx.stroke();
  }

  // 3. Central Telemetry Visual Centerpiece
  const glowGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 550);
  glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  glowGrad.addColorStop(0.25, project.color);
  glowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 550, 0, Math.PI * 2);
  ctx.fill();

  if (project.id === '01') {
    // Warriors Basketball Collectible Hologram
    const ballGrad = ctx.createRadialGradient(cx - 70, cy - 70, 40, cx, cy, 280);
    ballGrad.addColorStop(0, '#fef08a');
    ballGrad.addColorStop(0.35, '#f59e0b');
    ballGrad.addColorStop(0.75, '#b45309');
    ballGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 270, 0, Math.PI * 2);
    ctx.fill();

    // Grooves
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 270, 0, Math.PI * 2);
    ctx.moveTo(cx - 270, cy);
    ctx.lineTo(cx + 270, cy);
    ctx.moveTo(cx, cy - 270);
    ctx.lineTo(cx, cy + 270);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy, 140, 270, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Typography
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 68px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 35;
    ctx.fillText('EXCLUSIVE COLLECTIBLE', cx, cy - 380);
    ctx.font = '800 58px "Space Grotesk", sans-serif';
    ctx.fillText('WARRIORS X NEURAL XDR', cx, cy - 310);
    ctx.shadowBlur = 0;
  } else if (project.id === '02') {
    // Autonomous SOAR Matrix Nodes
    ctx.fillStyle = '#fde68a';
    ctx.font = '900 84px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 40;
    ctx.fillText('AUTONOMOUS SOAR', cx, cy - 140);
    ctx.fillText('DAG ENGINE', cx, cy - 40);
    ctx.font = '700 48px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('SUB-12MS RESPONSE TIME', cx, cy + 80);
    ctx.shadowBlur = 0;

    // Orchestration nodes
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 6;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const nx = cx + Math.cos(a) * 380;
      const ny = cy + Math.sin(a) * 380;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(nx, ny, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (project.id === '03') {
    // Synthetic Media & Audio FFT Analyzer
    ctx.fillStyle = '#fbcfe8';
    ctx.font = '900 92px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 45;
    ctx.fillText('SYNTHETIC SHIELD', cx, cy - 120);
    ctx.font = '700 44px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f472b6';
    ctx.fillText('FFT SPECTRAL FREQUENCY DEFENSE', cx, cy - 20);
    ctx.shadowBlur = 0;

    // FFT frequency bars
    const barCount = 28;
    const barWidth = 24;
    const startX = cx - (barCount * 36) / 2;
    for (let i = 0; i < barCount; i++) {
      const h = 80 + Math.sin(i * 0.4) * 140 + ((i * 17) % 110);
      const bx = startX + i * 36;
      const by = cy + 220 - h;
      ctx.fillStyle = project.color;
      ctx.fillRect(bx, by, barWidth, h);
    }
  } else if (project.id === '04') {
    // MITRE Matrix Graph Engine
    ctx.fillStyle = '#e9d5ff';
    ctx.font = '900 86px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 40;
    ctx.fillText('MITRE ATT&CK v14', cx, cy - 120);
    ctx.font = '700 44px "JetBrains Mono", monospace';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('REAL-TIME TTP CORRELATION', cx, cy - 30);
    ctx.shadowBlur = 0;

    // Matrix Grid
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
    ctx.lineWidth = 4;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const gx = cx - 360 + col * 180;
        const gy = cy + 120 + row * 90;
        ctx.strokeRect(gx, gy, 150, 65);
        ctx.fillStyle = (row + col) % 2 === 0 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(gx, gy, 150, 65);
      }
    }
  } else if (project.id === '05') {
    // SCADA OT Industrial Defense
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '900 86px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 40;
    ctx.fillText('SCADA / OT DEFENSE', cx, cy - 120);
    ctx.font = '700 44px "JetBrains Mono", monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText('MODBUS / DNP3 PROTOCOL DPI', cx, cy - 30);
    ctx.shadowBlur = 0;

    // PLC Register Grid
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy + 220, 160, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#6ee7b7';
    ctx.font = '800 48px "JetBrains Mono", monospace';
    ctx.fillText('0x1FA0: SAFE', cx, cy + 235);
  } else {
    // Quantum Immutable Audit Vault
    ctx.fillStyle = '#fecdd3';
    ctx.font = '900 86px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 40;
    ctx.fillText('IMMUTABLE AUDIT VAULT', cx, cy - 120);
    ctx.font = '700 44px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fb7185';
    ctx.fillText('ZK-MERKLE FORENSIC SEAL', cx, cy - 30);
    ctx.shadowBlur = 0;

    // Merkle tree nodes
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 120);
    ctx.lineTo(cx - 240, cy + 260);
    ctx.moveTo(cx, cy + 120);
    ctx.lineTo(cx + 240, cy + 260);
    ctx.stroke();

    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.arc(cx, cy + 120, 36, 0, Math.PI * 2);
    ctx.arc(cx - 240, cy + 260, 28, 0, Math.PI * 2);
    ctx.arc(cx + 240, cy + 260, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Circular Octagonal HUD Bezel Frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = cx + Math.cos(angle) * 880;
    const y = cy + Math.sin(angle) * 880;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Tick marks
  ctx.strokeStyle = project.color;
  ctx.lineWidth = 6;
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const r1 = 860;
    const r2 = i % 4 === 0 ? 920 : 890;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

// Procedural 3D Floating Pill Badge texture
const createBadgeTexture = (text: string, bgColor: string): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 720, 160);

  const radius = 60;
  const x = 30;
  const y = 20;
  const width = 660;
  const height = 120;

  // Outer Neon Glow
  ctx.shadowColor = bgColor;
  ctx.shadowBlur = 32;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  // Glass Inner Fill
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, width - 8, height - 8, radius - 4);
  ctx.fill();

  // Border Stroke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Badge Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px "Space Grotesk", "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 360, 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearFilter;
  return texture;
};

// Helper to completely dispose Three.js Object3D hierarchies
function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            if ('map' in m && m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if ('map' in child.material && child.material.map) {
            child.material.map.dispose();
          }
          child.material.dispose();
        }
      }
    } else if (child instanceof THREE.Sprite) {
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    }
  });
}

// Web Audio API Sound Synthesizer
class CyberAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playCrystalHover() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Audio fallback
    }
  }

  playWarpZoom() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch {
      // Audio fallback
    }
  }

  playSwitchPulse() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  }
}

const audioEngine = new CyberAudioEngine();

export const NoomoCrystalCanvas: React.FC<NoomoCrystalCanvasProps> = ({
  projects,
  activeIndex,
  onSelectProject,
  onClickCrystal,
  isAudioMuted,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mesh & Object References
  const mainStageGroupRef = useRef<THREE.Group | null>(null);
  const crystalGroupRef = useRef<THREE.Group | null>(null);
  const crystalOuterMeshRef = useRef<THREE.Mesh | null>(null);
  const crystalWireframeRef = useRef<THREE.LineSegments | null>(null);
  const innerArtworkPlaneRef = useRef<THREE.Mesh | null>(null);
  const innerEnergyRing1Ref = useRef<THREE.Mesh | null>(null);
  const innerEnergyRing2Ref = useRef<THREE.Mesh | null>(null);
  const badgeSpriteRef = useRef<THREE.Sprite | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Raycasting & Interaction State
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseNormRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const isHoveredRef = useRef(false);
  const hoverProgressRef = useRef(0);
  const isZoomingRef = useRef(false);

  // Pre-cached textures for 0ms instantaneous project switching
  const artworkTexturesRef = useRef<Map<string, THREE.CanvasTexture>>(new Map());
  const badgeTexturesRef = useRef<Map<string, THREE.CanvasTexture>>(new Map());

  // Mouse physics & rotation
  const mouseScreenRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0.001, y: 0.002 });
  const animFrameIdRef = useRef<number>(0);

  // Stable references for event handlers
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const onSelectProjectRef = useRef(onSelectProject);
  onSelectProjectRef.current = onSelectProject;

  const onClickCrystalRef = useRef(onClickCrystal);
  onClickCrystalRef.current = onClickCrystal;

  const isAudioMutedRef = useRef(isAudioMuted);
  isAudioMutedRef.current = isAudioMuted;

  // 1. Initial Three.js Scene Setup (Mounts ONCE)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const artworkTextures = artworkTexturesRef.current;
    const badgeTextures = badgeTexturesRef.current;

    // Pre-cache all textures
    projects.forEach((proj) => {
      if (!artworkTextures.has(proj.id)) {
        artworkTextures.set(proj.id, createProjectArtworkTexture(proj));
      }
      if (!badgeTextures.has(proj.id)) {
        badgeTextures.set(proj.id, createBadgeTexture(proj.badge, proj.color));
      }
    });

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04050e, 0.018);
    sceneRef.current = scene;

    // Environment reflection map
    const envTexture = createCyberEnvTexture();
    scene.environment = envTexture;

    // 2. Camera Setup with Adaptive Viewport Calculation
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer with ACES Tone Mapping & Performance Tuning
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(12, 16, 14);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 2.5);
    rimLight.position.set(-14, -10, -10);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(0, -12, 10);
    scene.add(fillLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 4.5, 20);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // 5. Main Stage Group (Allows dynamic mobile Y-shift without disrupting crystal local rotation)
    const mainStage = new THREE.Group();
    scene.add(mainStage);
    mainStageGroupRef.current = mainStage;

    // 6. Crystal Assembly Group
    const crystalGroup = new THREE.Group();
    mainStage.add(crystalGroup);
    crystalGroupRef.current = crystalGroup;

    const initialProject = projects[activeIndexRef.current] || projects[0];

    // 6A. Inner Bounded Holographic Core Plane (Strictly sized within inradius, ZERO clipping)
    // Crystal radius = 2.75, inradius ~ 2.2. Inner plane = 2.4 x 2.4 (corners at r = 1.697)
    const initialTexture = artworkTextures.get(initialProject.id) || createProjectArtworkTexture(initialProject);
    const artworkGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const artworkMat = new THREE.MeshBasicMaterial({
      map: initialTexture,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const innerArtworkPlane = new THREE.Mesh(artworkGeo, artworkMat);
    innerArtworkPlane.position.set(0, 0, 0);
    crystalGroup.add(innerArtworkPlane);
    innerArtworkPlaneRef.current = innerArtworkPlane;

    // 6B. Concentric Holographic Energy Shield Rings (Inside the crystal)
    const ringGeo1 = new THREE.TorusGeometry(1.65, 0.02, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(initialProject.color),
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const innerRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    crystalGroup.add(innerRing1);
    innerEnergyRing1Ref.current = innerRing1;

    const ringGeo2 = new THREE.TorusGeometry(1.4, 0.015, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const innerRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    crystalGroup.add(innerRing2);
    innerEnergyRing2Ref.current = innerRing2;

    // 6C. Outer Multi-faceted Refractive Crystal (Faceted Diamond Gemstone)
    const outerGeo = new THREE.IcosahedronGeometry(2.75, 0);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialProject.color),
      emissive: new THREE.Color(initialProject.color),
      emissiveIntensity: 0.25,
      roughness: 0.04,
      metalness: 0.08,
      transmission: 0.9,
      thickness: 1.8,
      ior: 1.6,
      reflectivity: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      flatShading: true,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    crystalGroup.add(outerMesh);
    crystalOuterMeshRef.current = outerMesh;

    // 6D. Glowing Wireframe Edges (Scaled with Polygon Offset to Eliminate Z-Fighting)
    const wireGeo = new THREE.WireframeGeometry(outerGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.scale.set(1.008, 1.008, 1.008);
    crystalGroup.add(wireMesh);
    crystalWireframeRef.current = wireMesh;

    // 6E. Central Floating 3D Pill Badge
    const initialBadge = badgeTextures.get(initialProject.id) || createBadgeTexture(initialProject.badge, initialProject.color);
    const badgeMaterial = new THREE.SpriteMaterial({
      map: initialBadge,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
    });
    const badgeSprite = new THREE.Sprite(badgeMaterial);
    badgeSprite.scale.set(3.4, 0.75, 1);
    badgeSprite.position.set(0, 0, 0.2);
    crystalGroup.add(badgeSprite);
    badgeSpriteRef.current = badgeSprite;

    // 7. Surrounding Zero-Gravity Orbital Cyber Shards
    const shardSharedMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });

    const shardGeometries = [
      new THREE.TetrahedronGeometry(0.28, 0),
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.IcosahedronGeometry(0.22, 0),
    ];

    const shards: THREE.Mesh[] = [];
    const shardCount = 28;

    for (let i = 0; i < shardCount; i++) {
      const geo = shardGeometries[i % shardGeometries.length];
      const shard = new THREE.Mesh(geo, shardSharedMat);

      const angle = (i / shardCount) * Math.PI * 2;
      const radius = 3.6 + (i % 5) * 0.75;
      const height = ((i % 7) - 3) * 0.7;
      const depth = ((i % 4) - 1.5) * 0.8;

      shard.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius + depth
      );

      shard.rotation.set(
        (i * 0.6) % Math.PI,
        (i * 0.9) % Math.PI,
        (i * 0.4) % Math.PI
      );

      shard.userData = {
        orbitAngle: angle,
        orbitRadius: radius,
        orbitSpeed: (0.0016 + (i % 3) * 0.0008) * (i % 2 === 0 ? 1 : -1),
        rotSpeedX: 0.009 + (i % 3) * 0.004,
        rotSpeedY: 0.007 + (i % 4) * 0.003,
        floatOffset: i * 0.5,
      };

      mainStage.add(shard);
      shards.push(shard);
    }

    // 8. Cosmic Stardust Lattice
    const starCount = 240;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 32;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.09,
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.65,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 9. Dynamic Responsive Viewport Layout Function
    const updateResponsiveCamera = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const curW = containerRef.current.clientWidth || window.innerWidth;
      const curH = containerRef.current.clientHeight || window.innerHeight;
      const curAspect = curW / curH;

      cameraRef.current.aspect = curAspect;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(curW, curH);

      const isMobile = curW < 768;
      const isTablet = curW >= 768 && curW < 1024;

      // Adjust camera distance to fit crystal on portrait screens
      let targetZ = 10.0;
      if (curAspect < 0.7) {
        targetZ = 10.0 * (1.18 / curAspect);
      } else if (curAspect < 1.0) {
        targetZ = 10.0 * (1.12 / curAspect);
      } else if (curAspect < 1.35) {
        targetZ = 10.0 * (1.08 / curAspect);
      }

      // Elevate crystal stage on mobile viewports so bottom UI dock never collides with it
      if (mainStageGroupRef.current) {
        mainStageGroupRef.current.position.y = isMobile ? 0.75 : (isTablet ? 0.35 : 0);
      }

      return targetZ;
    };

    let targetBaseZ = updateResponsiveCamera() || 10.0;
    camera.position.set(0, 0, targetBaseZ);

    // 10. Pointer Movement & Raycasting Listeners
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Normalized device coordinates (-1 to +1) for raycasting
      mouseNormRef.current.x = (clientX / window.innerWidth) * 2 - 1;
      mouseNormRef.current.y = -(clientY / window.innerHeight) * 2 + 1;

      // Mouse position for camera parallax and crystal tilt
      mouseScreenRef.current.targetX = (clientX / window.innerWidth - 0.5) * 2;
      mouseScreenRef.current.targetY = (clientY / window.innerHeight - 0.5) * 2;

      // Dragging rotation
      if (isDraggingRef.current && crystalGroupRef.current) {
        const deltaX = clientX - prevMouseRef.current.x;
        const deltaY = clientY - prevMouseRef.current.y;

        rotationVelocityRef.current.y = deltaX * 0.005;
        rotationVelocityRef.current.x = deltaY * 0.005;

        prevMouseRef.current = { x: clientX, y: clientY };
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      prevMouseRef.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    // Click handler on the Crystal
    const handleClick = () => {
      if (isHoveredRef.current && !isZoomingRef.current) {
        isZoomingRef.current = true;
        if (!isAudioMutedRef.current) {
          audioEngine.playWarpZoom();
        }
        onClickCrystalRef.current?.(activeIndexRef.current);
        setTimeout(() => {
          isZoomingRef.current = false;
        }, 800);
      }
    };

    // Wheel navigation between projects with debouncing
    let wheelCooldown = false;
    const handleWheel = (e: WheelEvent) => {
      if (wheelCooldown) return;
      if (Math.abs(e.deltaY) > 25) {
        wheelCooldown = true;
        const total = projects.length;
        if (e.deltaY > 0) {
          onSelectProjectRef.current((activeIndexRef.current + 1) % total);
        } else {
          onSelectProjectRef.current((activeIndexRef.current - 1 + total) % total);
        }
        setTimeout(() => {
          wheelCooldown = false;
        }, 450);
      }
    };

    const handleResize = () => {
      const newZ = updateResponsiveCamera();
      if (newZ !== undefined) targetBaseZ = newZ;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    dom.addEventListener('click', handleClick);
    dom.addEventListener('wheel', handleWheel, { passive: true });

    // 11. Render & Physics Loop
    let lastTime = performance.now();
    let clockTime = 0;
    let wasHovered = false;

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      clockTime += dt;

      // 11A. Smooth Spring Mouse Parallax
      const mouse = mouseScreenRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // 11B. Raycasting: Check if mouse is hovering over the crystal
      if (cameraRef.current && crystalOuterMeshRef.current) {
        raycasterRef.current.setFromCamera(mouseNormRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObject(crystalOuterMeshRef.current);
        const hovered = intersects.length > 0;
        isHoveredRef.current = hovered;

        // Hover Sound trigger
        if (hovered && !wasHovered) {
          if (!isAudioMutedRef.current) {
            audioEngine.playCrystalHover();
          }
          if (containerRef.current) {
            containerRef.current.style.cursor = 'pointer';
          }
        } else if (!hovered && wasHovered) {
          if (containerRef.current) {
            containerRef.current.style.cursor = 'grab';
          }
        }
        wasHovered = hovered;
      }

      // Smooth Hover Transition Progress (0.0 = unhovered, 1.0 = fully hovered)
      const targetHover = isHoveredRef.current ? 1.0 : 0.0;
      hoverProgressRef.current += (targetHover - hoverProgressRef.current) * 0.12;
      const hProg = hoverProgressRef.current;

      // 11C. Crystal Motion, Dynamic Tilt & Rotation
      if (crystalGroupRef.current) {
        if (hProg > 0.05) {
          // Hovered: Align front face toward camera and tilt dynamically
          const targetTiltX = mouse.y * 0.35;
          const targetTiltY = mouse.x * 0.45;

          crystalGroupRef.current.rotation.x += (targetTiltX - crystalGroupRef.current.rotation.x) * 0.12;
          crystalGroupRef.current.rotation.y += (targetTiltY - crystalGroupRef.current.rotation.y) * 0.12;
          crystalGroupRef.current.rotation.z += (0 - crystalGroupRef.current.rotation.z) * 0.12;
        } else {
          // Unhovered: Smooth continuous 3D tumbling rotation with inertia
          crystalGroupRef.current.rotation.y += rotationVelocityRef.current.y;
          crystalGroupRef.current.rotation.x += rotationVelocityRef.current.x;

          if (!isDraggingRef.current) {
            rotationVelocityRef.current.y *= 0.94;
            rotationVelocityRef.current.x *= 0.94;
            crystalGroupRef.current.rotation.y += 0.003;
            crystalGroupRef.current.rotation.x += 0.001;
          }
        }

        // Float breathing animation
        crystalGroupRef.current.position.y = Math.sin(clockTime * 1.6) * 0.1;

        // Scale & Zoom-in click animation
        let targetScale = 1.0 + hProg * 0.05;
        if (isZoomingRef.current) {
          targetScale = 1.6;
        }
        const curScale = crystalGroupRef.current.scale.x;
        const newScale = curScale + (targetScale - curScale) * 0.12;
        crystalGroupRef.current.scale.set(newScale, newScale, newScale);
      }

      // 11D. Internal Energy Rings Counter-Rotation
      if (innerEnergyRing1Ref.current) {
        innerEnergyRing1Ref.current.rotation.x += 0.015;
        innerEnergyRing1Ref.current.rotation.y += 0.02;
      }
      if (innerEnergyRing2Ref.current) {
        innerEnergyRing2Ref.current.rotation.x -= 0.012;
        innerEnergyRing2Ref.current.rotation.z += 0.018;
      }

      // 11E. Floating Pill Badge Visibility & Smooth Fade
      if (badgeSpriteRef.current) {
        const targetBadgeOpacity = Math.max(0, 1.0 - hProg * 1.5);
        badgeSpriteRef.current.material.opacity = targetBadgeOpacity;
        badgeSpriteRef.current.visible = targetBadgeOpacity > 0.02;
      }

      // 11F. Orbiting Shards
      shards.forEach((shard) => {
        const u = shard.userData;
        u.orbitAngle += u.orbitSpeed;
        shard.position.x = Math.cos(u.orbitAngle) * u.orbitRadius;
        shard.position.z = Math.sin(u.orbitAngle) * u.orbitRadius;
        shard.position.y += Math.sin(clockTime * 1.2 + u.floatOffset) * 0.0025;

        shard.rotation.x += u.rotSpeedX;
        shard.rotation.y += u.rotSpeedY;
      });

      // 11G. Camera Interpolation
      if (cameraRef.current) {
        let camZ = targetBaseZ;
        if (isZoomingRef.current) {
          camZ = targetBaseZ * 0.55;
        }
        cameraRef.current.position.z += (camZ - cameraRef.current.position.z) * 0.1;

        const targetCamX = mouse.x * 0.45;
        const targetCamY = -mouse.y * 0.45;
        cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.06;
        cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.06;
        cameraRef.current.lookAt(0, mainStageGroupRef.current ? mainStageGroupRef.current.position.y : 0, 0);
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // 12. Complete GPU Memory Disposal on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      dom.removeEventListener('mousedown', handlePointerDown);
      dom.removeEventListener('touchstart', handlePointerDown);
      dom.removeEventListener('click', handleClick);
      dom.removeEventListener('wheel', handleWheel);

      cancelAnimationFrame(animFrameIdRef.current);

      if (sceneRef.current) {
        disposeObject3D(sceneRef.current);
      }

      envTexture.dispose();

      artworkTextures.forEach((t) => t.dispose());
      badgeTextures.forEach((t) => t.dispose());
      artworkTextures.clear();
      badgeTextures.clear();

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
      }
    };
  }, [projects]);

  // 2. Instantaneous Property Update on activeIndex change (0ms latency)
  useEffect(() => {
    const project = projects[activeIndex];
    if (!project) return;

    if (!isAudioMutedRef.current) {
      audioEngine.playSwitchPulse();
    }

    // 1. Swap Inner Artwork Texture
    if (innerArtworkPlaneRef.current) {
      const mat = innerArtworkPlaneRef.current.material as THREE.MeshBasicMaterial;
      const cached = artworkTexturesRef.current.get(project.id) || createProjectArtworkTexture(project);
      mat.map = cached;
      mat.needsUpdate = true;
    }

    // 2. Swap 3D Badge Texture
    if (badgeSpriteRef.current) {
      const spriteMat = badgeSpriteRef.current.material as THREE.SpriteMaterial;
      const cached = badgeTexturesRef.current.get(project.id) || createBadgeTexture(project.badge, project.color);
      spriteMat.map = cached;
      spriteMat.needsUpdate = true;
    }

    // 3. Update Outer Glass Glow & Energy Rings
    if (crystalOuterMeshRef.current) {
      const mat = crystalOuterMeshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.color.set(project.color);
      mat.emissive.set(project.color);
    }

    if (innerEnergyRing1Ref.current) {
      const mat = innerEnergyRing1Ref.current.material as THREE.MeshBasicMaterial;
      mat.color.set(project.color);
    }

    // 4. Update Core Point Light & Rim Light
    if (pointLightRef.current) {
      pointLightRef.current.color.set(project.color);
    }
    if (rimLightRef.current) {
      rimLightRef.current.color.set(project.secondaryColor || project.color);
    }
  }, [activeIndex, projects]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: 'grab',
        zIndex: 1,
        touchAction: 'none',
      }}
    />
  );
};
