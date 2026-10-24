import 'dart:math' as math;
import 'package:flutter/material.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_logo.dart';

/// Ultra-Modern Animated Cyber Splash Screen for KAVACH.
/// Features a multi-layered radar matrix with interactive telemetry blips,
/// dual counter-rotating orbital reticles, breathing hexagonal cyber shield,
/// dynamic holographic shimmer typography, and live boot sequence ticker.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _mainController;
  late final AnimationController _radarController;
  late final AnimationController _pulseController;
  late final AnimationController _shimmerController;
  late final AnimationController _orbitalController;

  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _glowPulse;
  late final Animation<double> _contentFade;
  late final Animation<Offset> _contentSlide;
  late final Animation<double> _progressAnim;

  int _bootStage = 0;
  final List<String> _bootMessages = [
    'Initializing Raksha AI Neural Threat Engine...',
    'Calibrating 16 Kernel Telemetry Probes & WFP...',
    'Synchronizing Sovereign Threat Defense Matrix...',
    'Zero-Trust Perimeter Armed · Defense Online.',
  ];

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _startBootSequence();
  }

  void _initAnimations() {
    // 1. Main entrance controller (orchestrates overall entry)
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    );

    // 2. Continuous ambient radar sweep
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4000),
    )..repeat();

    // 3. Shield breathing glow pulse
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    // 4. Shimmer sweep across brand title
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();

    // 5. Dual counter-rotating orbital reticles
    _orbitalController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 12000),
    )..repeat();

    _logoScale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.45, curve: Curves.easeOutBack),
      ),
    );

    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.35, curve: Curves.easeIn),
      ),
    );

    _glowPulse = Tween<double>(begin: 0.35, end: 0.95).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _contentFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.35, 0.7, curve: Curves.easeOut),
      ),
    );

    _contentSlide = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.35, 0.7, curve: Curves.easeOutCubic),
      ),
    );

    _progressAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.1, 0.95, curve: Curves.easeInOut),
      ),
    );

    _mainController.forward();
  }

  void _startBootSequence() {
    Future.delayed(const Duration(milliseconds: 550), () {
      if (mounted) setState(() => _bootStage = 1);
    });
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) setState(() => _bootStage = 2);
    });
    Future.delayed(const Duration(milliseconds: 1950), () {
      if (mounted) setState(() => _bootStage = 3);
    });
    Future.delayed(const Duration(milliseconds: 2900), () {
      if (!mounted) return;
      if (ApiService.instance.isAuthenticated) {
        if (ApiService.instance.isPinEnabled()) {
          Navigator.of(context).pushReplacementNamed(AppRoutes.appLockPin);
        } else {
          Navigator.of(context).pushReplacementNamed(AppRoutes.home);
        }
      } else {
        Navigator.of(context).pushReplacementNamed(AppRoutes.login);
      }
    });
  }

  @override
  void dispose() {
    _mainController.dispose();
    _radarController.dispose();
    _pulseController.dispose();
    _shimmerController.dispose();
    _orbitalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      body: Stack(
        children: [
          // ── Layer 1: Ambient Cyber Radar Grid with Active Sensor Blips ──
          Positioned.fill(
            child: IgnorePointer(
              child: RepaintBoundary(
                child: AnimatedBuilder(
                  animation: _radarController,
                  builder: (context, child) {
                    return CustomPaint(
                      size: Size.infinite,
                      painter: _CyberRadarBackgroundPainter(
                        angle: _radarController.value * 2 * math.pi,
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          // ── Layer 2: Deep Cyber Vignette Gradient Glow ──────────────────
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment.center,
                    radius: 0.9,
                    colors: [
                      AppColors.primary.withValues(alpha: 0.14),
                      const Color(0xFF0284C7).withValues(alpha: 0.05),
                      const Color(0xFF030712).withValues(alpha: 0.85),
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),
          ),

          // ── Layer 3: Central Animated Shield, Orbitals & Ticker ─────────
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ── Multi-Layered Orbital Shield Emblem ──────────────────
                  AnimatedBuilder(
                    animation: Listenable.merge([
                      _mainController,
                      _pulseController,
                      _orbitalController,
                    ]),
                    builder: (context, child) {
                      return FadeTransition(
                        opacity: _logoFade,
                        child: ScaleTransition(
                          scale: _logoScale,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // 1. Outer Clockwise Cyber Reticle Ring (184px)
                              Transform.rotate(
                                angle: _orbitalController.value * 2 * math.pi,
                                child: CustomPaint(
                                  size: const Size(184, 184),
                                  painter: _CyberReticlePainter(
                                    color: AppColors.primary.withValues(alpha: 0.35),
                                    tickCount: 24,
                                  ),
                                ),
                              ),

                              // 2. Middle Counter-Clockwise Hex Orbital Ring (154px)
                              Transform.rotate(
                                angle: -_orbitalController.value * 3 * math.pi,
                                child: CustomPaint(
                                  size: const Size(154, 154),
                                  painter: _HexOrbitalPainter(
                                    color: const Color(0xFF38BDF8).withValues(alpha: 0.4),
                                  ),
                                ),
                              ),

                              // 3. Pulsing Neon Shield Aura Shadow
                              Container(
                                width: 136,
                                height: 136,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(
                                        alpha: 0.55 * _glowPulse.value,
                                      ),
                                      blurRadius: 55,
                                      spreadRadius: 16,
                                    ),
                                    BoxShadow(
                                      color: const Color(0xFF38BDF8).withValues(
                                        alpha: 0.3 * _glowPulse.value,
                                      ),
                                      blurRadius: 36,
                                      spreadRadius: 10,
                                    ),
                                  ],
                                ),
                              ),

                              // 4. Inner Glassmorphic Emblem Container
                              Container(
                                width: 122,
                                height: 122,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: const LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Color(0xFF1E293B),
                                      Color(0xFF0F172A),
                                      Color(0xFF030712),
                                    ],
                                  ),
                                  border: Border.all(
                                    color: AppColors.primary.withValues(alpha: 0.65),
                                    width: 2.2,
                                  ),
                                ),
                                child: const AppLogo(size: 86),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 38),

                  // ── Animated Brand Typography & HUD ───────────────────────
                  SlideTransition(
                    position: _contentSlide,
                    child: FadeTransition(
                      opacity: _contentFade,
                      child: Column(
                        children: [
                          // Animated Shimmer Gradient Brand Title
                          AnimatedBuilder(
                            animation: _shimmerController,
                            builder: (context, child) {
                              final shimmerVal = _shimmerController.value;
                              return ShaderMask(
                                shaderCallback: (bounds) => LinearGradient(
                                  colors: const [
                                    Color(0xFFFFFFFF),
                                    Color(0xFFFF8A8D),
                                    Color(0xFFE5484D),
                                    Color(0xFF38BDF8),
                                    Color(0xFFFFFFFF),
                                  ],
                                  stops: [
                                    0.0,
                                    (shimmerVal - 0.2).clamp(0.0, 1.0),
                                    shimmerVal.clamp(0.0, 1.0),
                                    (shimmerVal + 0.2).clamp(0.0, 1.0),
                                    1.0,
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ).createShader(bounds),
                                child: const Text(
                                  'KAVACH',
                                  style: TextStyle(
                                    fontSize: 40,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 9.0,
                                    color: Colors.white,
                                    fontFamily: 'Poppins',
                                  ),
                                ),
                              );
                            },
                          ),

                          const SizedBox(height: 8),

                          // Sovereign Sovereign Cyber Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: const Color(0xFF38BDF8).withValues(alpha: 0.25),
                              ),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.shield_outlined, size: 14, color: Color(0xFF38BDF8)),
                                SizedBox(width: 7),
                                Text(
                                  'SOVEREIGN SOAR-XDR · ZERO-TRUST DEFENSE',
                                  style: TextStyle(
                                    color: Color(0xFFCBD5E1),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 44),

                          // ── Live Security Boot Sequence Console HUD ─────────
                          Container(
                            constraints: const BoxConstraints(maxWidth: 420),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A).withValues(alpha: 0.92),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFF38BDF8).withValues(alpha: 0.2),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.5),
                                  blurRadius: 20,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    // Animated Pulsing Beacon LED
                                    AnimatedBuilder(
                                      animation: _pulseController,
                                      builder: (context, child) {
                                        final isReady = _bootStage == 3;
                                        final color = isReady
                                            ? const Color(0xFF10B981)
                                            : const Color(0xFF38BDF8);
                                        return Container(
                                          width: 9,
                                          height: 9,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: color,
                                            boxShadow: [
                                              BoxShadow(
                                                color: color.withValues(
                                                  alpha: 0.6 * _glowPulse.value,
                                                ),
                                                blurRadius: 8,
                                                spreadRadius: 2,
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                    const SizedBox(width: 10),
                                    const Text(
                                      'SYSTEM BOOT SEQUENCE',
                                      style: TextStyle(
                                        color: Color(0xFF94A3B8),
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.1,
                                      ),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF38BDF8).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        'STAGE ${_bootStage + 1}/4',
                                        style: const TextStyle(
                                          color: Color(0xFF38BDF8),
                                          fontFamily: 'monospace',
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 250),
                                  child: Text(
                                    _bootMessages[_bootStage],
                                    key: ValueKey<int>(_bootStage),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontFamily: 'monospace',
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                // Glowing Dual-Color Progress Bar
                                AnimatedBuilder(
                                  animation: _progressAnim,
                                  builder: (context, child) {
                                    return ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: _progressAnim.value,
                                        minHeight: 4.0,
                                        backgroundColor: Colors.white.withValues(alpha: 0.08),
                                        valueColor: const AlwaysStoppedAnimation<Color>(
                                          Color(0xFF38BDF8),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Layer 4: Footer Sovereign Copyright & CERT-In Compliance ──
          Positioned(
            bottom: 22,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                '© 2026 KAVACH · Built with Sovereign Intelligence · CERT-In Aligned',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.35),
                  fontSize: 10,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom radar sweep, cyber-grid, and pulsing sensor blips painter.
class _CyberRadarBackgroundPainter extends CustomPainter {
  final double angle;

  _CyberRadarBackgroundPainter({required this.angle});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.42);
    final maxRadius = math.max(size.width, size.height) * 0.68;

    // Draw subtle cyber grid
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.022)
      ..strokeWidth = 1.0;

    const step = 42.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Concentric range rings
    final circlePaint = Paint()
      ..color = const Color(0xFF38BDF8).withValues(alpha: 0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (double r = 60; r <= maxRadius; r += 70) {
      canvas.drawCircle(center, r, circlePaint);
    }

    // Crosshair axes
    final axisPaint = Paint()
      ..color = const Color(0xFF38BDF8).withValues(alpha: 0.07)
      ..strokeWidth = 1.0;
    canvas.drawLine(Offset(center.dx - maxRadius, center.dy), Offset(center.dx + maxRadius, center.dy), axisPaint);
    canvas.drawLine(Offset(center.dx, center.dy - maxRadius), Offset(center.dx, center.dy + maxRadius), axisPaint);

    // Rotating radar sector
    final sweepPaint = Paint()
      ..shader = SweepGradient(
        center: Alignment.center,
        startAngle: 0.0,
        endAngle: math.pi / 2,
        colors: [
          const Color(0xFF38BDF8).withValues(alpha: 0.18),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(center: center, radius: maxRadius))
      ..style = PaintingStyle.fill;

    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(angle);
    canvas.drawArc(
      Rect.fromCircle(center: Offset.zero, radius: maxRadius),
      0,
      math.pi / 2,
      true,
      sweepPaint,
    );
    canvas.restore();

    // 4 Animated sensor blips (light up based on radar proximity)
    final blipOffsets = [
      Offset(center.dx + 85, center.dy - 75),
      Offset(center.dx - 110, center.dy - 60),
      Offset(center.dx - 90, center.dy + 120),
      Offset(center.dx + 120, center.dy + 80),
    ];

    final blipPaint = Paint()..style = PaintingStyle.fill;
    for (int i = 0; i < blipOffsets.length; i++) {
      final p = blipOffsets[i];
      final blipAngle = math.atan2(p.dy - center.dy, p.dx - center.dx);
      final normalizedBlipAngle = (blipAngle < 0 ? blipAngle + 2 * math.pi : blipAngle);
      final diff = (angle - normalizedBlipAngle).abs();
      final intensity = (diff < 0.6 || (2 * math.pi - diff) < 0.6) ? 0.9 : 0.25;

      blipPaint.color = const Color(0xFF38BDF8).withValues(alpha: intensity);
      canvas.drawCircle(p, 3.5, blipPaint);

      final glowPaint = Paint()
        ..color = const Color(0xFF38BDF8).withValues(alpha: intensity * 0.4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;
      canvas.drawCircle(p, 7.0, glowPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _CyberRadarBackgroundPainter oldDelegate) {
    return oldDelegate.angle != angle;
  }
}

/// Custom painter for the outer clockwise cyber reticle with tick marks.
class _CyberReticlePainter extends CustomPainter {
  final Color color;
  final int tickCount;

  _CyberReticlePainter({required this.color, required this.tickCount});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final ringPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    canvas.drawCircle(center, radius, ringPaint);

    final tickPaint = Paint()
      ..color = color.withValues(alpha: 0.8)
      ..strokeWidth = 1.5;

    for (int i = 0; i < tickCount; i++) {
      final theta = (i * 2 * math.pi) / tickCount;
      final isMajor = i % 6 == 0;
      final innerR = radius - (isMajor ? 8.0 : 4.0);
      final p1 = Offset(center.dx + innerR * math.cos(theta), center.dy + innerR * math.sin(theta));
      final p2 = Offset(center.dx + radius * math.cos(theta), center.dy + radius * math.sin(theta));
      canvas.drawLine(p1, p2, tickPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _CyberReticlePainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.tickCount != tickCount;
  }
}

/// Custom painter for the counter-clockwise hexagonal cyber ring with corner brackets.
class _HexOrbitalPainter extends CustomPainter {
  final Color color;

  _HexOrbitalPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final path = Path();
    for (int i = 0; i < 6; i++) {
      final theta = (i * 2 * math.pi) / 6;
      final x = center.dx + radius * math.cos(theta);
      final y = center.dy + radius * math.sin(theta);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;

    canvas.drawPath(path, paint);

    // Draw vertex corner nodes
    final nodePaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    for (int i = 0; i < 6; i++) {
      final theta = (i * 2 * math.pi) / 6;
      final p = Offset(center.dx + radius * math.cos(theta), center.dy + radius * math.sin(theta));
      canvas.drawCircle(p, 2.5, nodePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _HexOrbitalPainter oldDelegate) {
    return oldDelegate.color != color;
  }
}
