import 'package:flutter/material.dart';

import '../../../core/constants/app_dimensions.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/secondary_button.dart';

/// Email verification screen with illustration, action buttons, and navigation.
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen>
    with SingleTickerProviderStateMixin {
  bool _isResending = false;

  late final AnimationController _animController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: Curves.easeOut,
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animController,
        curve: Curves.easeOutCubic,
      ),
    );

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _handleOpenEmailApp() {
    // Platform-specific email app launch integration point.
    // Replace with url_launcher or platform intent.
  }

  void _handleResendEmail() {
    setState(() => _isResending = true);

    // Authentication service integration point.
    // Replace with actual resend email call.
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isResending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Verification email has been resent',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textOnPrimary,
              ),
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusSM),
            ),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.gradientStart,
              AppColors.gradientEnd,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: AppDimensions.screenPaddingH,
              ),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(
                      maxWidth: AppDimensions.maxContentWidth,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: AppDimensions.spacingXL),

                        // ── Illustration ──────────────────────────────────
                        _buildIllustration(),

                        const SizedBox(height: AppDimensions.spacingXL),

                        // ── Title ─────────────────────────────────────────
                        Text(
                          AppStrings.verifyEmailTitle,
                          style: AppTextStyles.headlineLarge,
                          textAlign: TextAlign.center,
                        ),

                        const SizedBox(height: AppDimensions.spacingMD),

                        // ── Card with messages and actions ────────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(AppDimensions.spacingLG),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(
                              AppDimensions.radiusXL,
                            ),
                            boxShadow: const [
                              BoxShadow(
                                color: AppColors.shadowMedium,
                                blurRadius: 20,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // ── Email icon ────────────────────────────────
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: AppColors.primarySurface,
                                  borderRadius: BorderRadius.circular(
                                    AppDimensions.radiusMD,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.email_outlined,
                                  color: AppColors.primary,
                                  size: 28,
                                ),
                              ),

                              const SizedBox(height: AppDimensions.spacingMD),

                              Text(
                                AppStrings.verifyEmailMessage,
                                style: AppTextStyles.headlineSmall,
                                textAlign: TextAlign.center,
                              ),

                              const SizedBox(height: AppDimensions.spacingSM),

                              Text(
                                AppStrings.verifyEmailSubMessage,
                                style: AppTextStyles.bodyMedium,
                                textAlign: TextAlign.center,
                              ),

                              const SizedBox(height: AppDimensions.spacingLG),

                              // ── Open Email App Button ─────────────────────
                              PrimaryButton(
                                text: AppStrings.openEmailApp,
                                onPressed: _handleOpenEmailApp,
                              ),

                              const SizedBox(height: AppDimensions.spacingMD),

                              // ── Resend Email Button ───────────────────────
                              SecondaryButton(
                                text: AppStrings.resendEmail,
                                isLoading: _isResending,
                                onPressed: _handleResendEmail,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: AppDimensions.spacingLG),

                        // ── Back to Login ────────────────────────────────
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).pushNamedAndRemoveUntil(
                              AppRoutes.login,
                              (route) => false,
                            );
                          },
                          child: Text(
                            AppStrings.backToLogin,
                            style: AppTextStyles.linkText,
                          ),
                        ),

                        const SizedBox(height: AppDimensions.spacingXL),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Builds the shield + email illustration using composed icons and shapes.
  Widget _buildIllustration() {
    return SizedBox(
      height: 140,
      width: 140,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer glow
          Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.08),
                  AppColors.primary.withValues(alpha: 0.0),
                ],
              ),
            ),
          ),
          // Middle circle
          Container(
            width: 110,
            height: 110,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primarySurface,
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.15),
                width: 2,
              ),
            ),
          ),
          // Shield icon
          const Icon(
            Icons.verified_user_outlined,
            size: 52,
            color: AppColors.primary,
          ),
          // Email badge
          Positioned(
            right: 18,
            bottom: 18,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.mark_email_unread_outlined,
                size: 18,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
