import 'package:flutter/material.dart';

import 'shimmer_loading.dart';

/// Professional structural skeleton loading indicator (replaces old circular spinner).
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({
    super.key,
    this.size = 40.0,
    this.strokeWidth = 3.0,
  });

  final double size;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading(
      child: Center(
        child: Container(
          width: size * 3,
          height: size * 0.75,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              ShimmerCircle(size: 16),
              SizedBox(width: 8),
              Expanded(child: ShimmerBox(height: 10, borderRadius: 4)),
            ],
          ),
        ),
      ),
    );
  }
}
