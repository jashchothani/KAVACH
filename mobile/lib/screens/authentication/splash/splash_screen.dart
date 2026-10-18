import 'dart:math' as math;
import 'package:flutter/material.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_logo.dart';

/// Next-Generation Animated Cyber Splash Screen for KAVACH.
/// Features a rotating radar matrix, glowing shield emblem, live telemetry
/// boot sequence ticker, and smooth hero navigation.
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

  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _glowPulse;
  late final Animation<double> _contentFade;
  late final Animation<Offset> _contentSlide;
  late final Animation<double> _progressAnim;

  int _bootStage = 0;
  final List<String> _bootMessages = [
    'Initializing Raksha AI Neural Defense Engine...',
    'Mounting 16 Kernel Telemetry Probes & WFP Hooks...',
    'Synchronizing Sovereign Threat Intelligence Matrix...',
    'Zero-Trust Perimeter Armed · Defense Online.',
  ];

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _startBootSequence();
  }

  void _initAnimations() {
    // Main entrance controller
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    );

    // Continuous ambient radar sweep
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4000),
    )..repeat();

    // Shield glow pulse
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _logoScale = Tween<double>(begin: 0.5, end: 1.0).animate(
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

    _glowPulse = Tween<double>(begin: 0.3, end: 0.85).animate(
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
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) setState(() => _bootStage = 1);
    });
    Future.delayed(const Duration(milliseconds: 1100), () {
      if (mounted) setState(() => _bootStage = 2);
    });
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) setState(() => _bootStage = 3);
    });
    Future.delayed(const Duration(milliseconds: 2700), () {
      if (!mounted) return;
      if (ApiService.instance.isAuthenticated) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.home);
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      body: Stack(
        children: [
          // ── Cyber Radar Grid Background ─────────────────────────────────
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

          // ── Radial Cyber Vignette Glow ──────────────────────────────────
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.85,
                  colors: [
                    AppColors.primary.withValues(alpha: 0.12),
                    Colors.transparent,
                    const Color(0xFF030712).withValues(alpha: 0.8),
                  ],
                  stops: const [0.0, 0.55, 1.0],
                ),
              ),
            ),
          ),
          ),

          // ── Central Brand & Emblem Column ───────────────────────────────
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ── Multi-Ring Glowing Shield Emblem ──────────────────────
                  AnimatedBuilder(
                    animation: Listenable.merge([_mainController, _pulseController]),
                    builder: (context, child) {
                      return FadeTransition(
                        opacity: _logoFade,
                        child: ScaleTransition(
                          scale: _logoScale,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Outer rotating ring with radar tick marks
                              IgnorePointer(
                                child: RepaintBoundary(
                                  child: AnimatedBuilder(
                                    animation: _radarController,
                                    builder: (context, child) {
                                      return Transform.rotate(
                                        angle: _radarController.value * 2 * math.pi,
                                        child: Container(
                                          width: 170,
                                          height: 170,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: AppColors.primary.withValues(alpha: 0.25),
                                              width: 1.5,
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),

                              // Glowing aura shadow
                              Container(
                                width: 140,
                                height: 140,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(alpha: 0.45 * _glowPulse.value),
                                      blurRadius: 50,
                                      spreadRadius: 15,
                                    ),
                                    BoxShadow(
                                      color: const Color(0xFF38BDF8).withValues(alpha: 0.25 * _glowPulse.value),
                                      blurRadius: 30,
                                      spreadRadius: 8,
                                    ),
                                  ],
                                ),
                              ),

                              // Inner cyber badge container
                              Container(
                                width: 124,
                                height: 124,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: const LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Color(0xFF1E293B),
                                      Color(0xFF0F172A),
                                    ],
                                  ),
                                  border: Border.all(
                                    color: AppColors.primary.withValues(alpha: 0.6),
                                    width: 2,
                                  ),
                                ),
                                child: const AppLogo(size: 88),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 36),

                  // ── Cyber Title & Subtitle ──────────────────────────────
                  SlideTransition(
                    position: _contentSlide,
                    child: FadeTransition(
                      opacity: _contentFade,
                      child: Column(
                        children: [
                          // Gradient Metallic Brand Name
                          ShaderMask(
                            shaderCallback: (bounds) => const LinearGradient(
                              colors: [
                                Color(0xFFFFFFFF),
                                Color(0xFFFF8A8D),
                                Color(0xFFE5484D),
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ).createShader(bounds),
                            child: const Text(
                              'KAVACH',
                              style: TextStyle(
                                fontSize: 38,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 8.0,
                                color: Colors.white,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ),

                          const SizedBox(height: 6),

                          // Sovereign Subtitle
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.shield_outlined, size: 13, color: Color(0xFF38BDF8)),
                                SizedBox(width: 6),
                                Text(
                                  'SOVEREIGN SOAR-XDR · THREAT DEFENSE MATRIX',
                                  style: TextStyle(
                                    color: Color(0xFFCBD5E1),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 48),

                          // ── Real-Time Boot Sequence Console Ticker ─────────
                          Container(
                            constraints: const BoxConstraints(maxWidth: 420),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A).withValues(alpha: 0.9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.4),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: _bootStage == 3 ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
                                        boxShadow: [
                                          BoxShadow(
                                            color: (_bootStage == 3 ? const Color(0xFF10B981) : const Color(0xFF38BDF8))
                                                .withValues(alpha: 0.8),
                                            blurRadius: 6,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'SYSTEM BOOT SEQUENCE',
                                      style: TextStyle(
                                        color: Color(0xFF94A3B8),
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                    const Spacer(),
                                    Text(
                                      'STAGE ${_bootStage + 1}/4',
                                      style: const TextStyle(
                                        color: Color(0xFF38BDF8),
                                        fontFamily: 'monospace',
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _bootMessages[_bootStage],
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                // Glowing Progress Bar
                                AnimatedBuilder(
                                  animation: _progressAnim,
                                  builder: (context, child) {
                                    return ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: _progressAnim.value,
                                        minHeight: 3.5,
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

          // ── Footer Copyright ───────────────────────────────────────────
          Positioned(
            bottom: 24,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                '© 2026 KAVACH · Built with Sovereign Intelligence · CERT-In Aligned',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.35),
                  fontSize: 10,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom radar sweep and cyber-grid painter for the splash screen background.
class _CyberRadarBackgroundPainter extends CustomPainter {
  final double angle;

  _CyberRadarBackgroundPainter({required this.angle});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.42);
    final maxRadius = math.max(size.width, size.height) * 0.65;

    // Draw grid lines
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.025)
      ..strokeWidth = 1.0;

    const step = 40.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Concentric radar circles
    final circlePaint = Paint()
      ..color = const Color(0xFF38BDF8).withValues(alpha: 0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (double r = 60; r <= maxRadius; r += 70) {
      canvas.drawCircle(center, r, circlePaint);
    }

    // Radar rotating sweep sector
    final sweepPaint = Paint()
      ..shader = SweepGradient(
        center: Alignment.center,
        startAngle: 0.0,
        endAngle: math.pi / 2,
        colors: [
          const Color(0xFF38BDF8).withValues(alpha: 0.16),
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
  }

  @override
  bool shouldRepaint(covariant _CyberRadarBackgroundPainter oldDelegate) {
    return oldDelegate.angle != angle;
  }
}
