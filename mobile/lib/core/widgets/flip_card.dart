import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// A smooth 3D card flip widget with configurable front/back views,
/// perspective depth, flip axis, and animation curve.
///
/// Usage:
/// ```dart
/// final _flipKey = GlobalKey<FlipCardState>();
/// FlipCard(
///   key: _flipKey,
///   front: EmailEntryWidget(),
///   back: OtpVerificationWidget(),
/// );
/// // To flip programmatically:
/// _flipKey.currentState?.flip();
/// ```
class FlipCard extends StatefulWidget {
  const FlipCard({
    super.key,
    required this.front,
    required this.back,
    this.duration = const Duration(milliseconds: 600),
    this.curve = Curves.easeInOutCubic,
    this.flipAxis = FlipAxis.horizontal,
    this.flipOnTap = false,
    this.onFlipComplete,
  });

  /// Widget displayed on the front face of the card.
  final Widget front;

  /// Widget displayed on the back face of the card.
  final Widget back;

  /// Duration of the flip animation.
  final Duration duration;

  /// Animation curve for the flip transition.
  final Curve curve;

  /// Axis around which the card flips.
  final FlipAxis flipAxis;

  /// Whether tapping the card automatically triggers a flip animation.
  final bool flipOnTap;

  /// Callback fired when a flip animation completes.
  final VoidCallback? onFlipComplete;

  @override
  State<FlipCard> createState() => FlipCardState();
}

enum FlipAxis { horizontal, vertical }

class FlipCardState extends State<FlipCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  bool _showFront = true;

  bool get isFront => _showFront;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: widget.curve),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed ||
          status == AnimationStatus.dismissed) {
        widget.onFlipComplete?.call();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Flip the card to the opposite face.
  void flip() {
    if (_showFront) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
    setState(() => _showFront = !_showFront);
  }

  /// Flip to show the front face.
  void showFront() {
    if (!_showFront) flip();
  }

  /// Flip to show the back face.
  void showBack() {
    if (_showFront) flip();
  }

  @override
  Widget build(BuildContext context) {
    final cardWidget = AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        final angle = _animation.value * math.pi;
        final isFrontVisible = angle < math.pi / 2;

        return Transform(
          alignment: Alignment.center,
          transform: _buildTransformMatrix(angle),
          child: isFrontVisible
              ? widget.front
              : Transform(
                  alignment: Alignment.center,
                  transform: _mirrorMatrix(),
                  child: widget.back,
                ),
        );
      },
    );

    if (widget.flipOnTap) {
      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          flip();
        },
        child: cardWidget,
      );
    }

    return cardWidget;
  }

  Matrix4 _buildTransformMatrix(double angle) {
    final matrix = Matrix4.identity()
      ..setEntry(3, 2, 0.001); // perspective

    if (widget.flipAxis == FlipAxis.horizontal) {
      matrix.rotateY(angle);
    } else {
      matrix.rotateX(angle);
    }

    return matrix;
  }

  Matrix4 _mirrorMatrix() {
    if (widget.flipAxis == FlipAxis.horizontal) {
      return Matrix4.identity()..rotateY(math.pi);
    } else {
      return Matrix4.identity()..rotateX(math.pi);
    }
  }
}
