import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// KAVACH animation toolkit.
/// Drop next to user_dashboard_screen.dart and import it:
///   import 'dashboard_animations.dart';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Staggered entrance: fade + slide up (+ optional scale)
// ─────────────────────────────────────────────────────────────────────────────
class FadeSlideIn extends StatefulWidget {
  final Widget child;
  final int index; // stagger position
  final Duration stagger;
  final Duration duration;
  final double dy; // start offset in logical pixels

  const FadeSlideIn({
    super.key,
    required this.child,
    this.index = 0,
    this.stagger = const Duration(milliseconds: 90),
    this.duration = const Duration(milliseconds: 650),
    this.dy = 28,
  });

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: widget.duration);
  late final Animation<double> _curve =
      CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.stagger * widget.index, () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curve,
      child: widget.child,
      builder: (_, child) => Opacity(
        opacity: _curve.value.clamp(0.0, 1.0),
        child: Transform.translate(
          offset: Offset(0, (1 - _curve.value) * widget.dy),
          child: Transform.scale(
            scale: 0.96 + 0.04 * _curve.value,
            child: child,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Press-bounce wrapper for any tappable tile / button
// ─────────────────────────────────────────────────────────────────────────────
class BounceTap extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double pressedScale;

  const BounceTap({
    super.key,
    required this.child,
    this.onTap,
    this.pressedScale = 0.94,
  });

  @override
  State<BounceTap> createState() => _BounceTapState();
}

class _BounceTapState extends State<BounceTap> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _down = true),
      onTapCancel: () => setState(() => _down = false),
      onTapUp: (_) => setState(() => _down = false),
      onTap: widget.onTap == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              widget.onTap!();
            },
      child: AnimatedScale(
        scale: _down ? widget.pressedScale : 1.0,
        duration: const Duration(milliseconds: 140),
        curve: _down ? Curves.easeOut : Curves.elasticOut,
        child: widget.child,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Count-up number text
// ─────────────────────────────────────────────────────────────────────────────
class CountUpText extends StatelessWidget {
  final num value;
  final TextStyle style;
  final String suffix;
  final int decimals;
  final Duration duration;

  const CountUpText({
    super.key,
    required this.value,
    required this.style,
    this.suffix = '',
    this.decimals = 0,
    this.duration = const Duration(milliseconds: 1400),
  });

  String _fmt(double v) {
    if (decimals > 0) return v.toStringAsFixed(decimals);
    final s = v.round().toString();
    final b = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
      b.write(s[i]);
    }
    return b.toString();
  }

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.toDouble()),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (_, v, _) => Text('${_fmt(v)}$suffix', style: style),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Pulsing live dot / glow
// ─────────────────────────────────────────────────────────────────────────────
class PulseDot extends StatefulWidget {
  final Color color;
  final double size;
  const PulseDot({super.key, this.color = const Color(0xFF10B981), this.size = 8});

  @override
  State<PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.size;
    return SizedBox(
      width: s * 3,
      height: s * 3,
      child: AnimatedBuilder(
        animation: _c,
        builder: (_, _) => Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: s + s * 2 * _c.value,
              height: s + s * 2 * _c.value,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color.withValues(alpha: 0.35 * (1 - _c.value)),
              ),
            ),
            Container(
              width: s,
              height: s,
              decoration:
                  BoxDecoration(shape: BoxShape.circle, color: widget.color),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Animated security gauge (gradient arc, count-up, breathing glow)
// ─────────────────────────────────────────────────────────────────────────────
class AnimatedScoreGauge extends StatefulWidget {
  final int score;
  final double size;
  final Widget Function(BuildContext context, int shownScore) builder;

  const AnimatedScoreGauge({
    super.key,
    required this.score,
    required this.builder,
    this.size = 196,
  });

  @override
  State<AnimatedScoreGauge> createState() => _AnimatedScoreGaugeState();
}

class _AnimatedScoreGaugeState extends State<AnimatedScoreGauge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _breath = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _breath.dispose();
    super.dispose();
  }

  Color _colorFor(double s) {
    if (s >= 90) return const Color(0xFF10B981);
    if (s >= 70) return const Color(0xFF0284C7);
    if (s >= 50) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: widget.score.toDouble()),
      duration: const Duration(milliseconds: 1800),
      curve: Curves.easeOutCubic,
      builder: (ctx, v, _) {
        final color = _colorFor(v);
        return AnimatedBuilder(
          animation: _breath,
          builder: (_, _) {
            final glow = 0.10 + 0.14 * _breath.value;
            return SizedBox(
              width: widget.size,
              height: widget.size,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: widget.size,
                    height: widget.size,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: color.withValues(alpha: glow),
                          blurRadius: 30 + 14 * _breath.value,
                          spreadRadius: 2 + 4 * _breath.value,
                        ),
                      ],
                    ),
                  ),
                  CustomPaint(
                    size: Size.square(widget.size - 18),
                    painter: _GaugePainter(progress: v / 100, color: color),
                  ),
                  widget.builder(ctx, v.round()),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double progress;
  final Color color;
  _GaugePainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = size.width / 2 - 6;
    const stroke = 9.0;

    final track = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    canvas.drawCircle(center, radius, track);

    final sweep = 2 * math.pi * progress.clamp(0.0, 1.0);
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        startAngle: -math.pi / 2,
        endAngle: -math.pi / 2 + 2 * math.pi,
        colors: [color.withValues(alpha: 0.35), color],
        transform: const GradientRotation(0),
      ).createShader(Rect.fromCircle(center: center, radius: radius));

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweep,
      false,
      arc,
    );

    // glowing head dot
    if (progress > 0.01) {
      final a = -math.pi / 2 + sweep;
      final p = Offset(center.dx + radius * math.cos(a),
          center.dy + radius * math.sin(a));
      canvas.drawCircle(
          p, 9, Paint()..color = color.withValues(alpha: 0.25));
      canvas.drawCircle(p, 5, Paint()..color = Colors.white);
      canvas.drawCircle(p, 3.2, Paint()..color = color);
    }
  }

  @override
  bool shouldRepaint(covariant _GaugePainter old) =>
      old.progress != progress || old.color != color;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Animated bar chart (bars grow with stagger, tap to highlight)
// ─────────────────────────────────────────────────────────────────────────────
class AnimatedBarChart extends StatefulWidget {
  final List<String> labels;
  final List<double> values; // 0..1
  final double maxHeight;
  final int highlight;

  const AnimatedBarChart({
    super.key,
    required this.labels,
    required this.values,
    this.maxHeight = 100,
    this.highlight = 3,
  });

  @override
  State<AnimatedBarChart> createState() => _AnimatedBarChartState();
}

class _AnimatedBarChartState extends State<AnimatedBarChart> {
  late int _hi = widget.highlight;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(widget.values.length, (i) {
        final selected = i == _hi;
        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => _hi = i);
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 16,
                child: AnimatedOpacity(
                  opacity: selected ? 1 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Text(
                    '${(widget.values[i] * 100).round()}',
                    style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFFF6B35)),
                  ),
                ),
              ),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: widget.values[i]),
                duration: Duration(milliseconds: 700 + i * 120),
                curve: Curves.easeOutBack,
                builder: (_, v, _) => AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: selected ? 32 : 26,
                  height: (widget.maxHeight * v).clamp(2.0, 200.0),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: selected
                          ? const [Color(0xFFFF6B35), Color(0xFFFFA033)]
                          : const [Color(0xFF0F52BA), Color(0xFF3B82F6)],
                    ),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: selected
                        ? [
                            BoxShadow(
                              color: const Color(0xFFFF6B35)
                                  .withValues(alpha: 0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ]
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.labels[i],
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                  color: selected
                      ? const Color(0xFFFF6B35)
                      : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Floating ambient gradient blobs (put behind the Shield tab)
// ─────────────────────────────────────────────────────────────────────────────
class AmbientBlobs extends StatefulWidget {
  final Widget child;
  const AmbientBlobs({super.key, required this.child});

  @override
  State<AmbientBlobs> createState() => _AmbientBlobsState();
}

class _AmbientBlobsState extends State<AmbientBlobs>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 14),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  Widget _blob(double size, Color color, double dx, double dy, double phase) {
    final t = _c.value * 2 * math.pi + phase;
    return Positioned(
      left: dx + 40 * math.cos(t),
      top: dy + 40 * math.sin(t * 0.8),
      child: IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [
              color.withValues(alpha: 0.22),
              color.withValues(alpha: 0),
            ]),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: AnimatedBuilder(
            animation: _c,
            builder: (_, _) => Stack(
              clipBehavior: Clip.hardEdge,
              children: [
                _blob(260, const Color(0xFF38BDF8), -60, -40, 0),
                _blob(220, const Color(0xFFFF6B35), 180, 120, 2),
                _blob(240, const Color(0xFF8B5CF6), 20, 420, 4),
              ],
            ),
          ),
        ),
        widget.child,
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Shimmer sweep over any card (use on hero cards)
// ─────────────────────────────────────────────────────────────────────────────
class ShimmerSweep extends StatefulWidget {
  final Widget child;
  final BorderRadius radius;
  const ShimmerSweep({super.key, required this.child, required this.radius});

  @override
  State<ShimmerSweep> createState() => _ShimmerSweepState();
}

class _ShimmerSweepState extends State<ShimmerSweep>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3200),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: widget.radius,
      child: Stack(
        children: [
          widget.child,
          Positioned.fill(
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _c,
                builder: (_, _) => FractionallySizedBox(
                  alignment: Alignment(-1.6 + 3.2 * _c.value, 0),
                  widthFactor: 0.35,
                  child: Transform(
                    transform: Matrix4.skewX(-0.35),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [
                          Colors.white.withValues(alpha: 0),
                          Colors.white.withValues(alpha: 0.22),
                          Colors.white.withValues(alpha: 0),
                        ]),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Live ticker: number that keeps incrementing like real telemetry
// ─────────────────────────────────────────────────────────────────────────────
class LiveCounter extends StatefulWidget {
  final int start;
  final TextStyle style;
  final Duration every;
  const LiveCounter({
    super.key,
    required this.start,
    required this.style,
    this.every = const Duration(seconds: 3),
  });

  @override
  State<LiveCounter> createState() => _LiveCounterState();
}

class _LiveCounterState extends State<LiveCounter> {
  late int _v = widget.start;
  late final math.Random _r = math.Random();
  bool _alive = true;

  @override
  void initState() {
    super.initState();
    _tick();
  }

  void _tick() async {
    while (_alive) {
      await Future.delayed(widget.every);
      if (!mounted || !_alive) return;
      setState(() => _v += 1 + _r.nextInt(4));
    }
  }

  @override
  void dispose() {
    _alive = false;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      transitionBuilder: (c, a) => FadeTransition(
        opacity: a,
        child: SlideTransition(
          position:
              Tween(begin: const Offset(0, 0.4), end: Offset.zero).animate(a),
          child: c,
        ),
      ),
      child: CountUpText(
        key: ValueKey(_v),
        value: _v,
        style: widget.style,
        duration: const Duration(milliseconds: 1),
      ),
    );
  }
}
