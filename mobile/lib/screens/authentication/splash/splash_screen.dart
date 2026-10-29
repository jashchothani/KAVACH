import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/app_logo.dart';

/// KAVACH splash — cinematic intro.
///
/// Timeline (single master controller, ~3.2s):
///   0.05–0.40  emblem scales in on a clean white disc
///   0.15–0.55  brand ring draws itself around the emblem
///   0.20+      arrows streak in from both sides toward the shield
///   0.40–0.65  title reveals (solid colour, letter-spacing tightens)
///   0.50–0.72  tagline fades in
///   0.30–0.95  progress bar fills, boot status updates
///   0.60–0.85  footer fades in
/// After completion the screen fades out and routes onward.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Brand palette — matches the logo (deep navy shield + crimson K)
  static const Color _navy = Color(0xFF0B1F4B);
  static const Color _crimson = Color(0xFFD6333A);
  static const Color _slate = Color(0xFF64748B);

  /// Title font. The logo uses a heavy, wide display face with a large "K".
  /// If you have that font file, add it to pubspec.yaml and put its family
  /// name here (e.g. 'KavachDisplay'). null = default app font.
  static const String? _brandFont = null;

  static const List<String> _bootMessages = [
    'Initializing Raksha AI threat engine',
    'Calibrating kernel telemetry probes',
    'Synchronizing sovereign defense matrix',
    'Zero-trust perimeter armed',
  ];

  late final AnimationController _main; // one-shot intro
  late final AnimationController _loop; // continuous arrows / ripple / ring
  late final AnimationController _pulse; // soft glow breathing
  late final AnimationController _exit; // fade-out before navigating

  late final Animation<double> _emblemScale;
  late final Animation<double> _emblemFade;
  late final Animation<double> _ringDraw;
  late final Animation<double> _titleFade;
  late final Animation<double> _titleSpacing;
  late final Animation<Offset> _titleSlide;
  late final Animation<double> _taglineFade;
  late final Animation<double> _progress;
  late final Animation<double> _footerFade;
  late final Animation<double> _glow;
  late final Animation<double> _screenOpacity;

  @override
  void initState() {
    super.initState();

    _main = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    );
    _loop = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _exit = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );

    Animation<double> seg(double a, double b, Curve c) => CurvedAnimation(
      parent: _main,
      curve: Interval(a, b, curve: c),
    );

    _emblemScale = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(seg(0.05, 0.40, Curves.easeOutBack));
    _emblemFade = seg(0.05, 0.28, Curves.easeOut);
    _ringDraw = seg(0.15, 0.55, Curves.easeInOutCubic);
    _titleFade = seg(0.40, 0.65, Curves.easeOut);
    _titleSpacing = Tween<double>(
      begin: 16.0,
      end: 7.0,
    ).animate(seg(0.40, 0.70, Curves.easeOutCubic));
    _titleSlide = Tween<Offset>(
      begin: const Offset(0, 0.25),
      end: Offset.zero,
    ).animate(seg(0.40, 0.65, Curves.easeOutCubic));
    _taglineFade = seg(0.50, 0.72, Curves.easeOut);
    _progress = seg(0.30, 0.95, Curves.easeInOut);
    _footerFade = seg(0.60, 0.85, Curves.easeOut);
    _glow = Tween<double>(
      begin: 0.45,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));
    _screenOpacity = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _exit, curve: Curves.easeIn));

    _main.addStatusListener((status) async {
      if (status == AnimationStatus.completed) {
        await Future.delayed(const Duration(milliseconds: 150));
        if (!mounted) return;
        await _exit.forward();
        _navigate();
      }
    });
    _main.forward();
  }

  void _navigate() {
    if (!mounted) return;
    final nav = Navigator.of(context);
    if (ApiService.instance.isAuthenticated) {
      if (ApiService.instance.isPinEnabled()) {
        nav.pushReplacementNamed(AppRoutes.appLockPin);
      } else {
        nav.pushReplacementNamed(AppRoutes.home);
      }
    } else {
      nav.pushReplacementNamed(AppRoutes.login);
    }
  }

  @override
  void dispose() {
    _main.dispose();
    _loop.dispose();
    _pulse.dispose();
    _exit.dispose();
    super.dispose();
  }

  int get _bootStage {
    final v = _main.value;
    if (v < 0.30) return 0;
    if (v < 0.60) return 1;
    if (v < 0.85) return 2;
    return 3;
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
        body: FadeTransition(
          opacity: _screenOpacity,
          child: AnimatedBuilder(
            animation: Listenable.merge([_main, _loop, _pulse]),
            builder: (context, _) {
              return Stack(
                children: [
                  // Soft neutral backdrop
                  const Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Color(0xFFFFFFFF),
                            Color(0xFFF8FAFC),
                            Color(0xFFEEF2F8),
                          ],
                          stops: [0.0, 0.6, 1.0],
                        ),
                      ),
                    ),
                  ),

                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildHero(),
                        const SizedBox(height: 34),
                        _buildTitleBlock(),
                        const SizedBox(height: 44),
                        _buildProgress(),
                      ],
                    ),
                  ),

                  _buildFooter(),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  // ── Emblem with arrows flying in from both sides ──
  Widget _buildHero() {
    const double stage = 160;
    final arrowVisibility = ((_emblemFade.value - 0.4) / 0.6).clamp(0.0, 1.0);

    return SizedBox(
      height: 176,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left arrow lane (flies left → right)
          Expanded(
            child: CustomPaint(
              size: Size.infinite,
              painter: _ArrowFlightPainter(
                t: _loop.value,
                visibility: arrowVisibility,
                fromLeft: true,
                navy: _navy,
                crimson: _crimson,
              ),
            ),
          ),
          SizedBox(
            width: stage,
            height: stage,
            child: Stack(
              alignment: Alignment.center,
              clipBehavior: Clip.none,
              children: [
                // Soft ripples
                CustomPaint(
                  size: const Size(stage, stage),
                  painter: _RipplePainter(
                    t: _loop.value,
                    visibility: _emblemFade.value,
                    color: _navy,
                  ),
                ),
                // Self-drawing brand ring
                CustomPaint(
                  size: const Size(stage, stage),
                  painter: _RingPainter(
                    draw: _ringDraw.value,
                    rotation: _loop.value * 2 * math.pi,
                    navy: _navy,
                    crimson: _crimson,
                  ),
                ),
                // Emblem: clean white disc so the logo's own colours show
                Opacity(
                  opacity: _emblemFade.value.clamp(0.0, 1.0),
                  child: Transform.scale(
                    scale: _emblemScale.value,
                    child: Container(
                      width: 132,
                      height: 132,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const RadialGradient(
                          colors: [Color(0xFFFFFFFF), Color(0xFFF1F5FB)],
                        ),
                        border: Border.all(
                          color: const Color(0xFFE3E9F3),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _navy.withValues(alpha: 0.14 * _glow.value),
                            blurRadius: 30,
                            spreadRadius: 2,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: const Center(child: AppLogo(size: 84)),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Right arrow lane (flies right → left)
          Expanded(
            child: CustomPaint(
              size: Size.infinite,
              painter: _ArrowFlightPainter(
                t: _loop.value,
                visibility: arrowVisibility,
                fromLeft: false,
                navy: _navy,
                crimson: _crimson,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Solid-colour title (big K, logo style) + tagline pill ──
  Widget _buildTitleBlock() {
    return Column(
      children: [
        SlideTransition(
          position: _titleSlide,
          child: Opacity(
            opacity: _titleFade.value.clamp(0.0, 1.0),
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: 'K', style: _titleStyle(52)),
                  TextSpan(text: 'AVACH', style: _titleStyle(38)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Opacity(
          opacity: _taglineFade.value.clamp(0.0, 1.0),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: _navy.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _navy.withValues(alpha: 0.12)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.shield_rounded, size: 13, color: _navy),
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
        ),
      ],
    );
  }

  TextStyle _titleStyle(double size) => TextStyle(
    fontFamily: _brandFont,
    fontSize: size,
    fontWeight: FontWeight.w900,
    letterSpacing: _titleSpacing.value,
    color: _navy,
    height: 1.0,
    shadows: [
      Shadow(
        color: _navy.withValues(alpha: 0.18),
        blurRadius: 8,
        offset: const Offset(0, 3),
      ),
    ],
  );

  // ── Slim progress line + one-line boot status ──
  Widget _buildProgress() {
    return Opacity(
      opacity: _taglineFade.value.clamp(0.0, 1.0),
      child: Column(
        children: [
          SizedBox(
            width: 220,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Container(
                height: 4,
                color: _navy.withValues(alpha: 0.08),
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: _progress.value.clamp(0.0, 1.0),
                  child: const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [_navy, _crimson]),
                    ),
                    child: SizedBox.expand(),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: Text(
              '${_bootMessages[_bootStage]}…',
              key: ValueKey<int>(_bootStage),
              style: const TextStyle(
                color: _slate,
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Positioned(
      bottom: 24,
      left: 0,
      right: 0,
      child: SafeArea(
        top: false,
        child: Opacity(
          opacity: _footerFade.value.clamp(0.0, 1.0),
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
    );
  }
}

/// Arrows that streak in from the screen edge and converge on the shield.
/// Each arrow accelerates (ease-in), has a fading tail, and is absorbed
/// as it reaches the emblem.
class _ArrowFlightPainter extends CustomPainter {
  final double t; // 0..1 looping
  final double visibility; // 0..1 intro gate
  final bool fromLeft;
  final Color navy;
  final Color crimson;

  _ArrowFlightPainter({
    required this.t,
    required this.visibility,
    required this.fromLeft,
    required this.navy,
    required this.crimson,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (visibility <= 0) return;
    final w = size.width;
    final h = size.height;
    final cy = h / 2;
    const n = 6;

    for (int i = 0; i < n; i++) {
      final startY = h * (0.08 + i * (0.84 / (n - 1)));
      final endY = cy + (startY - cy) * 0.25; // converge toward centre line

      // Two flights per loop; staggered so arrows never move in lockstep.
      final phase = (i * 0.41 + (fromLeft ? 0.0 : 0.17)) % 1.0;
      final p = (t * 2 + phase) % 1.0;
      final e = Curves.easeIn.transform(p);

      final startX = fromLeft ? -16.0 : w + 16.0;
      final endX = fromLeft ? w + 24.0 : -24.0;
      final x = startX + (endX - startX) * e;
      final y = startY + (endY - startY) * e;
      final angle = math.atan2(endY - startY, endX - startX);

      final fadeIn = (p / 0.12).clamp(0.0, 1.0);
      final fadeOut = ((1 - p) / 0.20).clamp(0.0, 1.0);
      final alpha = fadeIn * fadeOut * visibility * 0.85;
      if (alpha <= 0.01) continue;

      final color = i.isEven ? navy : crimson;
      final tail = 26.0 + (i % 3) * 8.0;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(angle);

      // Fading tail
      canvas.drawLine(
        Offset(-tail, 0),
        const Offset(-3, 0),
        Paint()
          ..strokeWidth = 2.2
          ..strokeCap = StrokeCap.round
          ..shader = LinearGradient(
            colors: [
              color.withValues(alpha: 0.0),
              color.withValues(alpha: alpha),
            ],
          ).createShader(Rect.fromLTRB(-tail, -2, 0, 2)),
      );

      // Notched arrowhead
      final head = Path()
        ..moveTo(6, 0)
        ..lineTo(-5, -4)
        ..lineTo(-2, 0)
        ..lineTo(-5, 4)
        ..close();
      canvas.drawPath(head, Paint()..color = color.withValues(alpha: alpha));

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ArrowFlightPainter old) =>
      old.t != t || old.visibility != visibility;
}

/// Soft sonar rings expanding from the emblem.
class _RipplePainter extends CustomPainter {
  final double t;
  final double visibility;
  final Color color;

  _RipplePainter({
    required this.t,
    required this.visibility,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (visibility < 0.6) return;
    final center = size.center(Offset.zero);
    const minR = 78.0;
    const maxR = 136.0;

    for (int i = 0; i < 3; i++) {
      final p = (t + i / 3) % 1.0;
      final r = minR + (maxR - minR) * Curves.easeOut.transform(p);
      final a = (1 - p) * 0.14 * ((visibility - 0.6) / 0.4).clamp(0.0, 1.0);
      canvas.drawCircle(
        center,
        r,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.4
          ..color = color.withValues(alpha: a),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _RipplePainter old) =>
      old.t != t || old.visibility != visibility;
}

/// Brand ring that draws itself clockwise, then keeps a gradient rotating.
class _RingPainter extends CustomPainter {
  final double draw; // 0..1
  final double rotation; // radians
  final Color navy;
  final Color crimson;

  _RingPainter({
    required this.draw,
    required this.rotation,
    required this.navy,
    required this.crimson,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (draw <= 0) return;
    final center = size.center(Offset.zero);
    const radius = 76.0;
    final rect = Rect.fromCircle(center: center, radius: radius);

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..color = navy.withValues(alpha: 0.08 * draw),
    );

    final shader = SweepGradient(
      colors: [navy, crimson, navy],
      transform: GradientRotation(rotation),
    ).createShader(rect);

    canvas.drawArc(
      rect,
      -math.pi / 2,
      2 * math.pi * draw,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = 3.0
        ..shader = shader,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) =>
      old.draw != draw || old.rotation != rotation;
}
