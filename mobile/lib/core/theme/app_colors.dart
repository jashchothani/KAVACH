import 'package:flutter/material.dart';

/// Centralized color palette for KAVACH.
///
/// All colors are derived from the brand identity (deep crimson shield).
/// Change values here to retheme the entire application.
class AppColors {
  AppColors._();

  // ── Brand Primary (Deep Crimson from KAVACH logo) ───────────────────────
  static const Color primary = Color(0xFF8B1A1A);
  static const Color primaryLight = Color(0xFFB74C4C);
  static const Color primaryDark = Color(0xFF5C0E0E);
  static const Color primarySurface = Color(0xFFFDF2F2);

  // ── Secondary (Warm Neutral Grey) ───────────────────────────────────────
  static const Color secondary = Color(0xFF4A5568);
  static const Color secondaryLight = Color(0xFF718096);
  static const Color secondaryDark = Color(0xFF2D3748);

  // ── Background & Surface ────────────────────────────────────────────────
  static const Color background = Color(0xFFFAF8F6);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF7F5F3);
  static const Color scaffoldBackground = Color(0xFFFAF8F6);

  // ── Gradient Colors ─────────────────────────────────────────────────────
  static const Color gradientStart = Color(0xFFFFFBF7);
  static const Color gradientMiddle = Color(0xFFFDF5F0);
  static const Color gradientEnd = Color(0xFFFAEDE6);

  // ── Splash Gradient ─────────────────────────────────────────────────────
  static const Color splashGradientStart = Color(0xFFFFF9F5);
  static const Color splashGradientEnd = Color(0xFFF5E6DC);

  // ── Text Colors ─────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF1A202C);
  static const Color textSecondary = Color(0xFF4A5568);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // ── Border & Divider ────────────────────────────────────────────────────
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderFocused = Color(0xFF8B1A1A);
  static const Color divider = Color(0xFFEDF2F7);

  // ── Status Colors ───────────────────────────────────────────────────────
  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color success = Color(0xFF059669);
  static const Color successLight = Color(0xFFF0FDF4);
  static const Color warning = Color(0xFFD97706);

  // ── Input Field ─────────────────────────────────────────────────────────
  static const Color inputFill = Color(0xFFF9FAFB);
  static const Color inputBorder = Color(0xFFE5E7EB);
  static const Color inputFocusBorder = Color(0xFF8B1A1A);
  static const Color inputHint = Color(0xFF9CA3AF);

  // ── Shadow ──────────────────────────────────────────────────────────────
  static const Color shadowLight = Color(0x0A000000);
  static const Color shadowMedium = Color(0x14000000);

  // ── Glow (for splash animation) ─────────────────────────────────────────
  static const Color glowPrimary = Color(0x338B1A1A);
}
