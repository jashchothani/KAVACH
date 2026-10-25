import 'package:flutter/material.dart';

/// Pure Flutter 60fps Shimmer Animation Controller without external dependencies.
class ShimmerLoading extends StatefulWidget {
  final Widget child;
  final Duration duration;

  const ShimmerLoading({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 1500),
  });

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: const [
                Color(0xFFE2E8F0),
                Color(0xFFF8FAFC),
                Color(0xFFE2E8F0),
              ],
              stops: [
                _controller.value - 0.3,
                _controller.value,
                _controller.value + 0.3,
              ].map((s) => s.clamp(0.0, 1.0)).toList(),
            ).createShader(bounds);
          },
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// Structural Shimmer Box Placeholder with rounded corners.
class ShimmerBox extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

/// Structural Shimmer Circle (e.g. for avatars and circular icons).
class ShimmerCircle extends StatelessWidget {
  final double size;

  const ShimmerCircle({super.key, required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: Color(0xFFE2E8F0),
        shape: BoxShape.circle,
      ),
    );
  }
}

/// Structural Shimmer Card placeholder.
class ShimmerCard extends StatelessWidget {
  final double height;
  final double borderRadius;
  final EdgeInsetsGeometry padding;

  const ShimmerCard({
    super.key,
    this.height = 100,
    this.borderRadius = 20,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const ShimmerCircle(size: 36),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    ShimmerBox(width: 140, height: 14, borderRadius: 6),
                    SizedBox(height: 6),
                    ShimmerBox(width: 90, height: 10, borderRadius: 4),
                  ],
                ),
              ),
            ],
          ),
          const Spacer(),
          const ShimmerBox(width: double.infinity, height: 12, borderRadius: 6),
        ],
      ),
    );
  }
}

/// Complete Structural Dashboard Skeleton (no circle loading).
class StructuralDashboardSkeleton extends StatelessWidget {
  const StructuralDashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading(
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          // 1. Top clearance banner skeleton
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: const [
                ShimmerCircle(size: 24),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShimmerBox(width: 180, height: 12, borderRadius: 4),
                      SizedBox(height: 6),
                      ShimmerBox(width: 240, height: 10, borderRadius: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Hero Security Score Card Skeleton
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerBox(width: 160, height: 18, borderRadius: 6),
                        SizedBox(height: 8),
                        ShimmerBox(width: 110, height: 12, borderRadius: 4),
                      ],
                    ),
                    ShimmerCircle(size: 64),
                  ],
                ),
                const SizedBox(height: 20),
                const ShimmerBox(width: double.infinity, height: 14, borderRadius: 6),
                const SizedBox(height: 8),
                const ShimmerBox(width: 200, height: 14, borderRadius: 6),
                const SizedBox(height: 20),
                Row(
                  children: const [
                    Expanded(child: ShimmerBox(height: 40, borderRadius: 12)),
                    SizedBox(width: 12),
                    Expanded(child: ShimmerBox(height: 40, borderRadius: 12)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 3. Quick Action Pills Row Skeleton
          Row(
            children: const [
              Expanded(child: ShimmerBox(height: 70, borderRadius: 16)),
              SizedBox(width: 10),
              Expanded(child: ShimmerBox(height: 70, borderRadius: 16)),
              SizedBox(width: 10),
              Expanded(child: ShimmerBox(height: 70, borderRadius: 16)),
            ],
          ),
          const SizedBox(height: 16),

          // 4. Feature Cards Skeletons
          const ShimmerCard(height: 110),
          const SizedBox(height: 12),
          const ShimmerCard(height: 110),
          const SizedBox(height: 12),
          const ShimmerCard(height: 110),
        ],
      ),
    );
  }
}
