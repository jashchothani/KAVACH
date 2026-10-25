import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/app_logo.dart';

/// Clean white, Jio-style animated splash screen for KAVACH.
/// Bright white canvas, soft sapphire radar grid, counter-rotating orbital
/// rings, floating shield emblem, shimmer brand title and a light boot HUD.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Brand palette
  static const Color _blue = Color(0xFF0F52BA); // electric sapphire
  static const Color _sky = Color(0xFF38BDF8);
  static const Color _red = Color(0xFFE5484D);
  static const Color _navy = Color(0xFF0B1F4B);
  static const Color _slate = Color(0xFF64748B);
  static const Color _green = Color(0xFF10B981);

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
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    );
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4500),
    )..repeat();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();
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
    _glowPulse = Tween<double>(begin: 0.35, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _contentFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.35, 0.7, curve: Curves.easeOut),
      ),
    );
    _contentSlide = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
        .animate(
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
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          children: [
            // ── Layer 1: Pure white → soft sky-blue wash ──
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: const [
                        Color(0xFFFFFFFF),
                        Color(0xFFF7FAFF),
                        Color(0xFFEAF2FF),
                      ],
                      stops: const [0.0, 0.55, 1.0],
                    ),
                  ),
                ),
              ),
            ),

            // ── Layer 2: Soft radar grid with sensor blips ──
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
                          blue: _blue,
                          red: _red,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),

            // ── Layer 3: Emblem, brand & boot HUD ──
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
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
                                // Outer clockwise reticle
                                Transform.rotate(
                                  angle: _orbitalController.value * 2 * math.pi,
                                  child: CustomPaint(
                                    size: const Size(190, 190),
                                    painter: _CyberReticlePainter(
                                      color: _blue.withValues(alpha: 0.32),
                                      tickCount: 24,
                                    ),
                                  ),
                                ),
                                // Counter-clockwise hex ring (red accent)
                                Transform.rotate(
                                  angle:
                                      -_orbitalController.value * 3 * math.pi,
                                  child: CustomPaint(
                                    size: const Size(156, 156),
                                    painter: _HexOrbitalPainter(
                                      color: _red.withValues(alpha: 0.45),
                                    ),
                                  ),
                                ),
                                // Breathing soft glow
                                Container(
                                  width: 128,
                                  height: 128,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: _sky.withValues(
                                          alpha: 0.35 * _glowPulse.value,
                                        ),
                                        blurRadius: 50,
                                        spreadRadius: 10,
                                      ),
                                      BoxShadow(
                                        color: _blue.withValues(
                                          alpha: 0.14 * _glowPulse.value,
                                        ),
                                        blurRadius: 30,
                                        spreadRadius: 4,
                                      ),
                                    ],
                                  ),
                                ),
                                // White emblem disc
                                Container(
                                  width: 126,
                                  height: 126,
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white,
                                    border: Border.all(
                                      color: _blue.withValues(alpha: 0.18),
                                      width: 2,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: _blue.withValues(alpha: 0.16),
                                        blurRadius: 24,
                                        offset: const Offset(0, 8),
                                      ),
                                    ],
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

                    SlideTransition(
                      position: _contentSlide,
                      child: FadeTransition(
                        opacity: _contentFade,
                        child: Column(
                          children: [
                            // Shimmer brand title (navy → blue → red glint)
                            AnimatedBuilder(
                              animation: _shimmerController,
                              builder: (context, child) {
                                final v = _shimmerController.value;
                                return ShaderMask(
                                  shaderCallback: (bounds) => LinearGradient(
                                    colors: const [
                                      _navy,
                                      _blue,
                                      _red,
                                      _blue,
                                      _navy,
                                    ],
                                    stops: [
                                      0.0,
                                      (v - 0.2).clamp(0.0, 1.0),
                                      v.clamp(0.0, 1.0),
                                      (v + 0.2).clamp(0.0, 1.0),
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

                            const SizedBox(height: 10),

                            // Tagline pill
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: _blue.withValues(alpha: 0.06),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: _blue.withValues(alpha: 0.18),
                                ),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.shield_outlined,
                                    size: 14,
                                    color: _blue,
                                  ),
                                  SizedBox(width: 7),
                                  Text(
                                    'SOVEREIGN SOAR-XDR · ZERO-TRUST DEFENSE',
                                    style: TextStyle(
                                      color: _navy,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 44),

                            // Boot console card (light)
                            Container(
                              constraints: const BoxConstraints(maxWidth: 420),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 18,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: _blue.withValues(alpha: 0.10),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: _blue.withValues(alpha: 0.10),
                                    blurRadius: 24,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      AnimatedBuilder(
                                        animation: _pulseController,
                                        builder: (context, child) {
                                          final ready = _bootStage == 3;
                                          final c = ready ? _green : _blue;
                                          return Container(
                                            width: 9,
                                            height: 9,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: c,
                                              boxShadow: [
                                                BoxShadow(
                                                  color: c.withValues(
                                                    alpha:
                                                        0.5 * _glowPulse.value,
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
                                          color: _slate,
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.1,
                                        ),
                                      ),
                                      const Spacer(),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 7,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _blue.withValues(alpha: 0.08),
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                        child: Text(
                                          'STAGE ${_bootStage + 1}/4',
                                          style: const TextStyle(
                                            color: _blue,
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
                                        color: _navy,
                                        fontFamily: 'monospace',
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                        height: 1.3,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  // Gradient progress bar (blue → sky → red tip)
                                  AnimatedBuilder(
                                    animation: _progressAnim,
                                    builder: (context, child) {
                                      return ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: Container(
                                          height: 5,
                                          color: _blue.withValues(alpha: 0.08),
                                          alignment: Alignment.centerLeft,
                                          child: FractionallySizedBox(
                                            widthFactor: _progressAnim.value
                                                .clamp(0.0, 1.0),
                                            child: const DecoratedBox(
                                              decoration: BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: [_blue, _sky, _red],
                                                  stops: [0.0, 0.7, 1.0],
                                                ),
                                              ),
                                              child: SizedBox.expand(),
                                            ),
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

            // ── Layer 4: Footer ──
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: SafeArea(
                top: false,
                child: FadeTransition(
                  opacity: _contentFade,
                  child: const Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Made in India · Crafted with love, Kavach ',
                          style: TextStyle(
                            color: _navy,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text('❤️', style: TextStyle(fontSize: 13)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Soft radar sweep, grid and pulsing sensor blips for a light background.
class _CyberRadarBackgroundPainter extends CustomPainter {
  final double angle;
  final Color blue;
  final Color red;

  _CyberRadarBackgroundPainter({
    required this.angle,
    required this.blue,
    required this.red,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.40);
    final maxRadius = math.max(size.width, size.height) * 0.68;

    final gridPaint = Paint()
      ..color = blue.withValues(alpha: 0.045)
      ..strokeWidth = 1.0;
    const step = 42.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final circlePaint = Paint()
      ..color = blue.withValues(alpha: 0.09)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    for (double r = 60; r <= maxRadius; r += 70) {
      canvas.drawCircle(center, r, circlePaint);
    }

    final axisPaint = Paint()
      ..color = blue.withValues(alpha: 0.10)
      ..strokeWidth = 1.0;
    canvas.drawLine(
      Offset(center.dx - maxRadius, center.dy),
      Offset(center.dx + maxRadius, center.dy),
      axisPaint,
    );
    canvas.drawLine(
      Offset(center.dx, center.dy - maxRadius),
      Offset(center.dx, center.dy + maxRadius),
      axisPaint,
    );

    final sweepPaint = Paint()
      ..shader = SweepGradient(
        center: Alignment.center,
        startAngle: 0.0,
        endAngle: math.pi / 2,
        colors: [blue.withValues(alpha: 0.14), Colors.transparent],
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

    final blipOffsets = [
      Offset(center.dx + 85, center.dy - 75),
      Offset(center.dx - 110, center.dy - 60),
      Offset(center.dx - 90, center.dy + 120),
      Offset(center.dx + 120, center.dy + 80),
    ];

    for (int i = 0; i < blipOffsets.length; i++) {
      final p = blipOffsets[i];
      final blipAngle = math.atan2(p.dy - center.dy, p.dx - center.dx);
      final normalized = blipAngle < 0 ? blipAngle + 2 * math.pi : blipAngle;
      final diff = (angle - normalized).abs();
      final lit = diff < 0.6 || (2 * math.pi - diff) < 0.6;
      final intensity = lit ? 0.9 : 0.25;
      final c = lit && i.isOdd ? red : blue;

      canvas.drawCircle(
        p,
        3.5,
        Paint()
          ..style = PaintingStyle.fill
          ..color = c.withValues(alpha: intensity),
      );
      canvas.drawCircle(
        p,
        7.0,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5
          ..color = c.withValues(alpha: intensity * 0.4),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _CyberRadarBackgroundPainter old) =>
      old.angle != angle;
}

/// Outer reticle ring with tick marks.
class _CyberReticlePainter extends CustomPainter {
  final Color color;
  final int tickCount;

  _CyberReticlePainter({required this.color, required this.tickCount});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );

    final tickPaint = Paint()
      ..color = color.withValues(alpha: 0.85)
      ..strokeWidth = 1.5;

    for (int i = 0; i < tickCount; i++) {
      final theta = (i * 2 * math.pi) / tickCount;
      final isMajor = i % 6 == 0;
      final innerR = radius - (isMajor ? 9.0 : 4.0);
      canvas.drawLine(
        Offset(
          center.dx + innerR * math.cos(theta),
          center.dy + innerR * math.sin(theta),
        ),
        Offset(
          center.dx + radius * math.cos(theta),
          center.dy + radius * math.sin(theta),
        ),
        tickPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _CyberReticlePainter old) =>
      old.color != color || old.tickCount != tickCount;
}

/// Hexagonal ring with vertex nodes.
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
      i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    }
    path.close();

    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.4,
    );

    final nodePaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    for (int i = 0; i < 6; i++) {
      final theta = (i * 2 * math.pi) / 6;
      canvas.drawCircle(
        Offset(
          center.dx + radius * math.cos(theta),
          center.dy + radius * math.sin(theta),
        ),
        2.5,
        nodePaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _HexOrbitalPainter old) => old.color != color;
}
