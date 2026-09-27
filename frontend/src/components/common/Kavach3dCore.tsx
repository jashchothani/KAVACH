import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Kavach3dCoreProps {
  height?: number | string;
  isDark?: boolean;
}

export const Kavach3dCore: React.FC<Kavach3dCoreProps> = ({ height = 500, isDark = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 520;
    const h = typeof height === 'number' ? height : container.clientHeight || 500;

    // ─── Scene, Camera, Renderer ──────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.4 : 1.35;
    container.appendChild(renderer.domElement);

    // ─── Lighting ─────────────────────────────────────────────────────────
    // Ambient light tailored for both themes
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.5 : 2.4);
    scene.add(ambientLight);

    // Main directional specular light to catch crystal facets
    const mainSpot = new THREE.DirectionalLight(0xffffff, isDark ? 3.2 : 3.8);
    mainSpot.position.set(3, 5, 6);
    scene.add(mainSpot);

    // Ruby back glow to illuminate the core from within
    const crimsonCoreLight = new THREE.PointLight(0xdc2626, isDark ? 12 : 9, 20);
    crimsonCoreLight.position.set(0, 0, 0.2);
    scene.add(crimsonCoreLight);

    // Crimson side fill
    const sideFillLight = new THREE.PointLight(0xef4444, 4, 15);
    sideFillLight.position.set(-4, -2, 3);
    scene.add(sideFillLight);

    // Cyan rim light for high-tech contrast
    const cyanRimLight = new THREE.PointLight(0x38bdf8, isDark ? 2.5 : 1.8, 12);
    cyanRimLight.position.set(0, -3.5, -2);
    scene.add(cyanRimLight);

    // ─── 1. Background Rotating 3D Red Core & Ring Systems ─────────────────
    // This group rotates freely in 3D (pitch, yaw, roll) BEHIND the logo
    const rotatingCoreGroup = new THREE.Group();
    scene.add(rotatingCoreGroup);

    // Faceted Ruby Red Crystal Core (Substantial, gleaming, rich presence in both themes!)
    const coreGeo = new THREE.IcosahedronGeometry(1.65, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: isDark ? 0.6 : 0.45,
      roughness: 0.12,
      metalness: 0.25,
      transmission: isDark ? 0.35 : 0.2, // Keep rich, solid ruby body so it pops in light theme!
      ior: 1.65,
      thickness: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.95,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rotatingCoreGroup.add(coreMesh);

    // Inner pulsating geometric octahedron wireframe
    const innerGeo = new THREE.OctahedronGeometry(1.05, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xff3b3b,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.75 : 0.6,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    rotatingCoreGroup.add(innerMesh);

    // Inner glowing energy core center
    const nucleusGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: isDark ? 0.7 : 0.5,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    rotatingCoreGroup.add(nucleusMesh);

    // Outer cyber shield wireframe lattice (enclosing the core)
    const cageGeo = new THREE.IcosahedronGeometry(2.35, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0xff6b6b : 0xdc2626,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.22 : 0.28, // Crisp visibility in light theme!
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    rotatingCoreGroup.add(cageMesh);

    // Rotating Telemetry Orbit Rings (Fine, elegant cyber rings)
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isDark ? 0.55 : 0.65,
    });
    const ringGeo1 = new THREE.RingGeometry(2.85, 2.88, 64);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    rotatingCoreGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isDark ? 0.4 : 0.5,
    });
    const ringGeo2 = new THREE.RingGeometry(3.25, 3.28, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = Math.PI / 6;
    rotatingCoreGroup.add(ring2);

    // Small data micro-nodes along the rings (contained and subtle, no rogue dots)
    const satGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const satMat1 = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const satellite1 = new THREE.Mesh(satGeo, satMat1);
    satellite1.position.x = 2.865;
    ring1.add(satellite1);

    const satMat2 = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
    const satellite2 = new THREE.Mesh(satGeo, satMat2);
    satellite2.position.x = -3.265;
    ring2.add(satellite2);

    // Swarm of telemetry particles
    const particleCount = 140;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.2 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = radius * Math.cos(phi);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: isDark ? 0xff7171 : 0xdc2626,
      transparent: true,
      opacity: isDark ? 0.8 : 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    rotatingCoreGroup.add(particles);

    // ─── 2. Front-Facing KAVACH Logo Hologram (DOES NOT SPIN / NEVER MIRRORED) ───
    // User commandment:
    // "that red core should be there on top of it there should be the the kavach logo not moving keeping front code can more but not the logo it should have animtion but not turning make it nice best"
    const frontLogoGroup = new THREE.Group();
    frontLogoGroup.position.set(0, 0, 1.45); // Hovering prominently directly in front of the red core!
    scene.add(frontLogoGroup);

    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load('/kavach-logo-transparent.png');
    logoTexture.generateMipmaps = true;
    logoTexture.minFilter = THREE.LinearMipmapLinearFilter;
    logoTexture.magFilter = THREE.LinearFilter;

    // Crisp, perfectly front-facing KAVACH Logo plane (Strictly FrontSide - never flips!)
    const logoWidth = 2.25;
    const logoHeight = 2.25;
    const logoGeo = new THREE.PlaneGeometry(logoWidth, logoHeight);
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      opacity: 1.0,
      side: THREE.FrontSide, // strictly front-facing!
      depthTest: true,
      depthWrite: false,
    });
    const logoMesh = new THREE.Mesh(logoGeo, logoMat);
    logoMesh.renderOrder = 100;
    frontLogoGroup.add(logoMesh);

    // Radial illuminated back-glow directly behind the logo
    const glowGeo = new THREE.PlaneGeometry(2.7, 2.7);
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const gCtx = glowCanvas.getContext('2d')!;
    const radGrad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    radGrad.addColorStop(0, isDark ? 'rgba(220, 38, 38, 0.55)' : 'rgba(220, 38, 38, 0.35)');
    radGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.18)');
    radGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    gCtx.fillStyle = radGrad;
    gCtx.fillRect(0, 0, 128, 128);

    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.z = -0.08;
    glowMesh.renderOrder = 90;
    frontLogoGroup.add(glowMesh);

    // ─── Mouse Movement Parallax Physics ──────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX = (x / (rect.width / 2)) * 0.4;
      mouseY = (y / (rect.height / 2)) * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // ─── Resize Handler ───────────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = typeof height === 'number' ? height : container.clientHeight || 500;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // ─── Animation Loop ───────────────────────────────────────────────────
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth mouse follow interpolation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // 1. RED CRYSTAL CORE & RINGS: Move & Rotate in 3D freely behind the logo ("core can move")!
      rotatingCoreGroup.rotation.y = elapsedTime * 0.35 + targetX * 0.8;
      rotatingCoreGroup.rotation.x = Math.sin(elapsedTime * 0.25) * 0.15 + targetY * 0.6;

      // Internal facets counter-rotation
      coreMesh.rotation.y = elapsedTime * 0.22;
      coreMesh.rotation.z = Math.sin(elapsedTime * 0.2) * 0.1;
      innerMesh.rotation.x = -elapsedTime * 0.55;
      innerMesh.rotation.y = -elapsedTime * 0.75;
      nucleusMesh.scale.setScalar(1 + Math.sin(elapsedTime * 3) * 0.15);

      // Outer lattice slow counter-spin
      cageMesh.rotation.y = -elapsedTime * 0.15;
      cageMesh.rotation.z = Math.sin(elapsedTime * 0.3) * 0.08;

      // Rings spin along their planes
      ring1.rotation.z = elapsedTime * 0.4;
      ring2.rotation.z = -elapsedTime * 0.3;

      // Core breathing pulse
      const corePulse = 1 + Math.sin(elapsedTime * 2.5) * 0.045;
      coreMesh.scale.set(corePulse, corePulse, corePulse);

      // Particles drift
      particles.rotation.y = -elapsedTime * 0.08;

      // 2. FRONT KAVACH LOGO: NEVER SPINS OR MIRRORS AWAY!
      // Floating hover bob on Y
      const logoHoverY = Math.sin(elapsedTime * 1.8) * 0.08;
      frontLogoGroup.position.y = logoHoverY + targetY * 0.12;
      frontLogoGroup.position.x = targetX * 0.12;

      // Gentle breathing 2D scale pulse (animation without turning!)
      const logoPulse = 1 + Math.sin(elapsedTime * 2.2) * 0.035;
      logoMesh.scale.set(logoPulse, logoPulse, 1);
      glowMesh.scale.set(logoPulse * 1.05, logoPulse * 1.05, 1);

      // Parallax holographic micro-tilt: STRICTLY CLAMPED within ±4 degrees
      // It reacts subtly to mouse movement like a high-tech badge, but NEVER flips or rotates around!
      frontLogoGroup.rotation.x = Math.max(-0.07, Math.min(0.07, targetY * 0.07));
      frontLogoGroup.rotation.y = Math.max(-0.07, Math.min(0.07, targetX * 0.07));
      frontLogoGroup.rotation.z = 0;

      renderer.render(scene, camera);
    };

    animate();

    // ─── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      satGeo.dispose();
      satMat1.dispose();
      satMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      logoGeo.dispose();
      logoMat.dispose();
      logoTexture.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      glowTex.dispose();
    };
  }, [height, isDark]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    />
  );
};

export default Kavach3dCore;
