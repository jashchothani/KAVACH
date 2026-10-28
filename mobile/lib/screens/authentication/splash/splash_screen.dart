import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/app_logo.dart';

/// Clean, high-tech, Jio-style animated splash screen for KAVACH.
/// Ref Image 1: Centered circular brand emblem flanked by dual animated
/// dot-matrix breathing grids (sapphire blue & coral magenta dots)
/// with "With love, KAVACH ❤️" footer branding.
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
  static const Color _coral = Color(0xFFE5484D); // Jio magenta/coral
  static const Color _navy = Color(0xFF0B1F4B);
  static const Color _slate = Color(0xFF64748B);
  static const Color _green = Color(0xFF10B981);

  late final AnimationController _mainController;
  late final AnimationController _dotMatrixController;
  late final AnimationController _pulseController;
  late final AnimationController _shimmerController;

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
    _dotMatrixController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
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
    _glowPulse = Tween<double>(begin: 0.4, end: 1.0).animate(
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
    _dotMatrixController.dispose();
    _pulseController.dispose();
    _shimmerController.dispose();
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
            // ── Background: Light airy gradient canvas ──
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: const [
                      Color(0xFFFFFFFF),
                      Color(0xFFF8FAFC),
                      Color(0xFFEFF6FF),
                    ],
                    stops: const [0.0, 0.6, 1.0],
                  ),
                ),
              ),
            ),

            // ── Main Content: Jio-style Center Emblem with Flanking Dot Grids ──
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // ── Jio Reference (Image 1): Centered Emblem + Flanking Dot Matrix ──
                    AnimatedBuilder(
                      animation: Listenable.merge([
                        _mainController,
                        _dotMatrixController,
                        _pulseController,
                      ]),
                      builder: (context, child) {
                        return FadeTransition(
                          opacity: _logoFade,
                          child: ScaleTransition(
                            scale: _logoScale,
                            child: SizedBox(
                              height: 140,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // Left Animated Dot Matrix Grid
                                  Expanded(
                                    child: Align(
                                      alignment: Alignment.centerRight,
                                      child: CustomPaint(
                                        size: const Size(110, 80),
                                        painter: _JioDotMatrixGridPainter(
                                          progress: _dotMatrixController.value,
                                          isLeft: true,
                                        ),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(width: 14),

                                  // Central Circular Brand Emblem Pill
                                  Container(
                                    width: 104,
                                    height: 104,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: const Color(0xFF0F52BA),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF0F52BA)
                                              .withValues(
                                                alpha: 0.35 * _glowPulse.value,
                                              ),
                                          blurRadius: 36,
                                          spreadRadius: 6,
                                          offset: const Offset(0, 6),
                                        ),
                                        BoxShadow(
                                          color: const Color(0xFF38BDF8)
                                              .withValues(
                                                alpha: 0.25 * _glowPulse.value,
                                              ),
                                          blurRadius: 20,
                                        ),
                                      ],
                                      border: Border.all(
                                        color: Colors.white,
                                        width: 3.5,
                                      ),
                                    ),
                                    child: Center(
                                      child: Container(
                                        width: 86,
                                        height: 86,
                                        padding: const EdgeInsets.all(12),
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Color(0xFF0F52BA),
                                        ),
                                        child: const AppLogo(size: 62),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(width: 14),

                                  // Right Animated Dot Matrix Grid
                                  Expanded(
                                    child: Align(
                                      alignment: Alignment.centerLeft,
                                      child: CustomPaint(
                                        size: const Size(110, 80),
                                        painter: _JioDotMatrixGridPainter(
                                          progress: _dotMatrixController.value,
                                          isLeft: false,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 36),

                    // ── Brand Title, Badges & Boot Sequence ──
                    SlideTransition(
                      position: _contentSlide,
                      child: FadeTransition(
                        opacity: _contentFade,
                        child: Column(
                          children: [
                            // Shimmer brand title
                            AnimatedBuilder(
                              animation: _shimmerController,
                              builder: (context, child) {
                                final v = _shimmerController.value;
                                return ShaderMask(
                                  shaderCallback: (bounds) => LinearGradient(
                                    colors: const [
                                      _navy,
                                      _blue,
                                      _coral,
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
                                      fontSize: 38,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 8.0,
                                      color: Colors.white,
                                    ),
                                  ),
                                );
                              },
                            ),

                            const SizedBox(height: 8),

                            // Subtitle pill
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F52BA).withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: const Color(0xFF0F52BA).withValues(alpha: 0.2),
                                ),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.shield_rounded,
                                    size: 13,
                                    color: _blue,
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    'SOVEREIGN AI MOBILE PROTECTION',
                                    style: TextStyle(
                                      color: _navy,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 38),

                            // Boot console card
                            Container(
                              constraints: const BoxConstraints(maxWidth: 390),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 18,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: const Color(0xFFE2E8F0),
                                  width: 1.2,
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x0A000000),
                                    blurRadius: 20,
                                    offset: Offset(0, 6),
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
                                            width: 8,
                                            height: 8,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: c,
                                              boxShadow: [
                                                BoxShadow(
                                                  color: c.withValues(
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
                                          color: _slate,
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.0,
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
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'STAGE ${_bootStage + 1}/4',
                                          style: const TextStyle(
                                            color: _blue,
                                            fontFamily: 'monospace',
                                            fontSize: 9.5,
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
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                        height: 1.3,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  // Progress bar
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
                                                  colors: [_blue, _sky, _coral],
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

            // ── Footer: "With love, KAVACH ❤️" ──
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: SafeArea(
                top: false,
                child: FadeTransition(
                  opacity: _contentFade,
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'With love, KAVACH ',
                              style: TextStyle(
                                color: _navy,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text('❤️', style: TextStyle(fontSize: 14)),
                          ],
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Sovereign Cyber Defense · India',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 0.6,
                          ),
                        ),
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

/// Jio-style animated dot-matrix grid painter (Ref Image 1).
/// Renders 5 rows x 7 cols of pulsating electric sapphire and magenta/coral dots.
class _JioDotMatrixGridPainter extends CustomPainter {
  final double progress;
  final bool isLeft;

  static const Color _sapphire = Color(0xFF0F52BA);
  static const Color _coral = Color(0xFFE5484D);

  _JioDotMatrixGridPainter({
    required this.progress,
    required this.isLeft,
  });

  @override
  void paint(Canvas canvas, Size size) {
    const int rows = 5;
    const int cols = 7;

    final double colSpacing = size.width / (cols - 1);
    final double rowSpacing = size.height / (rows - 1);

    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final double x = c * colSpacing;
        final double y = r * rowSpacing;

        // Wave phase offset based on distance from center
        final double colOffset = isLeft ? (cols - 1 - c).toDouble() : c.toDouble();
        final double phase = (progress * 2 * math.pi) + (colOffset * 0.45) + (r * 0.3);
        final double wave = (math.sin(phase) + 1.0) / 2.0; // 0.0 to 1.0

        // Alternating dot color pattern matching Reference Image 1:
        // Rows 0, 2, 4 are predominantly sapphire blue.
        // Rows 1 and 3 feature alternating coral/magenta dots.
        final bool isCoral = (r == 1 && (c == 2 || c == 5)) ||
            (r == 2 && (c == 1 || c == 4)) ||
            (r == 3 && (c == 3 || c == 6));

        final Color baseColor = isCoral ? _coral : _sapphire;
        final double radius = 2.4 + (wave * 1.6);
        final double opacity = 0.35 + (wave * 0.65);

        final paint = Paint()
          ..color = baseColor.withValues(alpha: opacity.clamp(0.1, 1.0))
          ..style = PaintingStyle.fill;

        canvas.drawCircle(Offset(x, y), radius, paint);

        // Subtle glow for active dots
        if (wave > 0.75) {
          final glowPaint = Paint()
            ..color = baseColor.withValues(alpha: 0.25 * wave)
            ..style = PaintingStyle.fill;
          canvas.drawCircle(Offset(x, y), radius + 2.5, glowPaint);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _JioDotMatrixGridPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
