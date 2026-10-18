import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Typography system for KAVACH using native Segoe UI / Inter typography.
class AppTextStyles {
  AppTextStyles._();

  static TextStyle _style({
    required double fontSize,
    required FontWeight fontWeight,
    required Color color,
    double? letterSpacing,
    double? height,
  }) {
    return TextStyle(
      fontFamily: 'Segoe UI',
      fontFamilyFallback: const ['Inter', 'Roboto', 'Arial', 'sans-serif'],
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  // ── Headings ────────────────────────────────────────────────────────────
  static TextStyle get h1 => displayLarge;
  static TextStyle get h2 => headlineLarge;
  static TextStyle get h3 => headlineSmall;

  static TextStyle get displayLarge => _style(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        letterSpacing: -0.5,
        height: 1.2,
      );

  static TextStyle get displayMedium => _style(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        letterSpacing: -0.3,
        height: 1.25,
      );

  static TextStyle get headlineLarge => _style(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
        height: 1.3,
      );

  static TextStyle get headlineMedium => _style(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
        height: 1.35,
      );

  static TextStyle get headlineSmall => _style(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
        height: 1.4,
      );

  // ── Body ────────────────────────────────────────────────────────────────

  static TextStyle get bodyLarge => _style(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.5,
      );

  static TextStyle get bodyMedium => _style(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: AppColors.textSecondary,
        height: 1.5,
      );

  static TextStyle get bodySmall => _style(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: AppColors.textTertiary,
        height: 1.5,
      );

  static TextStyle get caption => bodySmall;

  // ── Labels ──────────────────────────────────────────────────────────────

  static TextStyle get labelLarge => _style(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.textOnPrimary,
        height: 1.4,
      );

  static TextStyle get labelMedium => _style(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimary,
        height: 1.4,
      );

  static TextStyle get labelSmall => _style(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textSecondary,
        height: 1.4,
      );

  // ── Special ─────────────────────────────────────────────────────────────

  static TextStyle get splashTitle => _style(
        fontSize: 36,
        fontWeight: FontWeight.w800,
        color: AppColors.primary,
        letterSpacing: 4.0,
        height: 1.2,
      );

  static TextStyle get splashSubtitle => _style(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: AppColors.textSecondary,
        letterSpacing: 1.2,
        height: 1.5,
      );

  static TextStyle get buttonText => _style(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.textOnPrimary,
        letterSpacing: 0.3,
      );

  static TextStyle get linkText => _style(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.primary,
      );

  static TextStyle get inputText => _style(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.4,
      );

  static TextStyle get inputHint => _style(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: AppColors.inputHint,
        height: 1.4,
      );

  static TextStyle get inputLabel => _style(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimary,
        height: 1.4,
      );

  static TextStyle get errorText => _style(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: AppColors.error,
        height: 1.4,
      );
}
