import 'package:flutter/material.dart';

import '../../../core/constants/app_dimensions.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/validation_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/section_title.dart';

/// Forgot password screen with email field and send verification button.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

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
    _emailController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleSendVerification() {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // Authentication service integration point.
    // Replace with actual password reset call.
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _emailSent = true;
        });
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
                    child: _emailSent
                        ? _buildSuccessState()
                        : _buildFormState(),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormState() {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: AppDimensions.spacingXL),

          // ── Logo ──────────────────────────────────────────
          const AppLogo(),

          const SizedBox(height: AppDimensions.spacingXL),

          // ── Header ────────────────────────────────────────
          const SectionTitle(
            title: AppStrings.forgotPasswordTitle,
            subtitle: AppStrings.forgotPasswordSubtitle,
            alignment: CrossAxisAlignment.center,
          ),

          const SizedBox(height: AppDimensions.spacingXL),

          // ── Email Field ───────────────────────────────────
          AppTextField(
            label: AppStrings.email,
            hint: 'Enter your registered email',
            controller: _emailController,
            prefixIcon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
            validator: ValidationService.validateEmail,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.email],
          ),

          const SizedBox(height: AppDimensions.spacingLG),

          // ── Send Button ───────────────────────────────────
          PrimaryButton(
            text: AppStrings.sendVerification,
            isLoading: _isLoading,
            onPressed: _handleSendVerification,
          ),

          const SizedBox(height: AppDimensions.spacingLG),

          // ── Back to Login ─────────────────────────────────
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Text(
              AppStrings.backToLogin,
              style: AppTextStyles.linkText,
            ),
          ),

          const SizedBox(height: AppDimensions.spacingXL),
        ],
      ),
    );
  }

  Widget _buildSuccessState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: AppDimensions.spacingXL),

        // ── Success Icon ──────────────────────────────────
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.successLight,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.success.withValues(alpha: 0.2),
                blurRadius: 20,
                spreadRadius: 4,
              ),
            ],
          ),
          child: const Icon(
            Icons.mark_email_read_outlined,
            size: 40,
            color: AppColors.success,
          ),
        ),

        const SizedBox(height: AppDimensions.spacingLG),

        // ── Success Title ─────────────────────────────────
        Text(
          AppStrings.resetEmailSent,
          style: AppTextStyles.headlineLarge.copyWith(
            color: AppColors.success,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: AppDimensions.spacingSM),

        // ── Success Message ───────────────────────────────
        Text(
          AppStrings.resetEmailSentMessage,
          style: AppTextStyles.bodyMedium,
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: AppDimensions.spacingXL),

        // ── Back to Login Button ──────────────────────────
        PrimaryButton(
          text: AppStrings.backToLogin,
          onPressed: () => Navigator.of(context).pop(),
        ),

        const SizedBox(height: AppDimensions.spacingXL),
      ],
    );
  }
}
