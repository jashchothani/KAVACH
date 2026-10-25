import 'package:flutter/material.dart';

import '../../../core/constants/app_dimensions.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/validation_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/password_field.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/section_title.dart';

/// Complete multi-step Forgot Password & New Password Creation screen for KAVACH Desktop.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _emailFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  int _step = 1; // 1: Email, 2: OTP + New Password, 3: Success
  bool _isLoading = false;
  String? _errorMessage;

  late final AnimationController _animController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );

    _animController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleSendResetOtp() async {
    if (!_emailFormKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final email = _emailController.text.trim();
      await ApiService.instance.forgotPassword(email);

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _step = 2;
      });

      _animController.forward(from: 0.0);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('A 6-digit password reset verification code has been dispatched to your email.'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_errorMessage ?? 'Failed to send reset code'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _handleResetPassword() async {
    if (!_resetFormKey.currentState!.validate()) return;

    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match. Please verify your entries.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final email = _emailController.text.trim();
      final code = _otpController.text.trim();
      final newPw = _newPasswordController.text;

      await ApiService.instance.resetPassword(
        email: email,
        resetCode: code,
        newPassword: newPw,
      );

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _step = 3;
      });

      _animController.forward(from: 0.0);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_errorMessage ?? 'Password reset failed'),
          backgroundColor: AppColors.error,
        ),
      );
    }
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
                vertical: 24,
              ),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(
                      maxWidth: AppDimensions.maxContentWidth,
                    ),
                    child: switch (_step) {
                      1 => _buildEmailStep(),
                      2 => _buildNewPasswordStep(),
                      3 => _buildSuccessStep(),
                      _ => _buildEmailStep(),
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Step 1: Email Form ──────────────────────────────────────────────────────
  Widget _buildEmailStep() {
    return Form(
      key: _emailFormKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: AppDimensions.spacingXL),
          const AppLogo(),
          const SizedBox(height: AppDimensions.spacingXL),
          const SectionTitle(
            title: AppStrings.forgotPasswordTitle,
            subtitle: 'Enter your registered email address to receive a 6-digit password reset OTP.',
            alignment: CrossAxisAlignment.center,
          ),
          const SizedBox(height: AppDimensions.spacingXL),
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
          PrimaryButton(
            text: 'Send Verification OTP',
            isLoading: _isLoading,
            onPressed: _handleSendResetOtp,
          ),
          const SizedBox(height: AppDimensions.spacingLG),
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

  // ── Step 2: OTP & New Password Form ─────────────────────────────────────────
  Widget _buildNewPasswordStep() {
    return Form(
      key: _resetFormKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: AppDimensions.spacingLG),
          const AppLogo(size: 60),
          const SizedBox(height: AppDimensions.spacingLG),
          SectionTitle(
            title: 'Create New Password',
            subtitle: 'Enter the 6-digit code dispatched to ${_emailController.text.trim()} and choose a secure new password.',
            alignment: CrossAxisAlignment.center,
          ),
          const SizedBox(height: AppDimensions.spacingLG),
          AppTextField(
            label: '6-Digit Reset Code',
            hint: 'Enter 6-digit OTP code',
            controller: _otpController,
            prefixIcon: Icons.pin_outlined,
            keyboardType: TextInputType.number,
            validator: (v) {
              if (v == null || v.trim().length != 6) {
                return 'Please enter the complete 6-digit verification code';
              }
              return null;
            },
          ),
          const SizedBox(height: AppDimensions.spacingMD),
          PasswordField(
            label: 'New Password',
            hint: 'Enter your new secure password',
            controller: _newPasswordController,
            validator: ValidationService.validatePassword,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: AppDimensions.spacingMD),
          PasswordField(
            label: 'Confirm New Password',
            hint: 'Re-enter your new secure password',
            controller: _confirmPasswordController,
            validator: (v) {
              if (v == null || v.isEmpty) {
                return 'Please confirm your new password';
              }
              if (v != _newPasswordController.text) {
                return 'Passwords do not match';
              }
              return null;
            },
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: AppDimensions.spacingLG),
          PrimaryButton(
            text: 'Save & Set New Password',
            isLoading: _isLoading,
            onPressed: _handleResetPassword,
          ),
          const SizedBox(height: AppDimensions.spacingMD),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                onPressed: _handleSendResetOtp,
                child: const Text('Resend Code', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0284C7))),
              ),
              const Text('·', style: TextStyle(color: Colors.white30)),
              TextButton(
                onPressed: () {
                  setState(() => _step = 1);
                  _animController.forward(from: 0.0);
                },
                child: const Text('Change Email', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
              ),
            ],
          ),
          const SizedBox(height: AppDimensions.spacingMD),
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

  // ── Step 3: Success Screen ──────────────────────────────────────────────────
  Widget _buildSuccessStep() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: AppDimensions.spacingXL),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withValues(alpha: 0.25),
                blurRadius: 20,
                spreadRadius: 4,
              ),
            ],
          ),
          child: const Icon(
            Icons.lock_reset_rounded,
            size: 42,
            color: Color(0xFF059669),
          ),
        ),
        const SizedBox(height: AppDimensions.spacingLG),
        const Text(
          'Password Reset Successfully!',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF059669),
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppDimensions.spacingSM),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Your new password has been verified and securely updated in the KAVACH keystore. You may now sign in to access your cyber defense shield.',
            style: AppTextStyles.bodyMedium.copyWith(color: const Color(0xFF475569)),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: AppDimensions.spacingXL),
        PrimaryButton(
          text: 'Sign In With New Password',
          onPressed: () => Navigator.of(context).pop(),
        ),
        const SizedBox(height: AppDimensions.spacingXL),
      ],
    );
  }
}
