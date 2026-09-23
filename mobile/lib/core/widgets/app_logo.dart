import 'package:flutter/material.dart';

import '../constants/app_assets.dart';
import '../constants/app_dimensions.dart';

/// Reusable KAVACH logo widget with configurable size.
class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    this.size = AppDimensions.logoScreen,
  });

  /// The height of the logo image.
  final double size;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      AppAssets.kavachLogo,
      height: size,
      fit: BoxFit.contain,
    );
  }
}
