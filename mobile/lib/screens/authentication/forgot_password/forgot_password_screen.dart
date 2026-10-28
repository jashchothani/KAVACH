import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/constants/app_dimensions.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/validation_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/password_field.dart';
import '../../../core/widgets/primary_button.dart';

/// Ultra-Modern Light-Themed Multi-Step Forgot Password Screen with 3D Card Flip.
///
/// Step 1 (Front): Email entry → Dispatches 6-digit OTP
/// [3D FLIP ANIMATION]
/// Step 2 (Back): OTP verification + New password entry → Resets password
/// Step 3: Celebratory success with animated checkmark
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with TickerProviderStateMixin {
  final _emailFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  int _step = 1; // 1: Email, 2: OTP + New Password, 3: Success
  bool _isLoading = false;
  String? _errorMessage;

  // 3D Flip Animation
  late final AnimationController _flipController;
  late final Animation<double> _flipAnimation;

  // Page entrance animation
  late final AnimationController _entranceController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  // Success animation
  late final AnimationController _successController;
  late final Animation<double> _successScale;

  @override
  void initState() {
    super.initState();

    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _flipAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOutCubic),
    );

    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOut),
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
      CurvedAnimation(
          parent: _entranceController, curve: Curves.easeOutCubic),
    );

    _successController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _successScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _successController, curve: Curves.elasticOut),
    );

    _entranceController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _flipController.dispose();
    _entranceController.dispose();
    _successController.dispose();
    super.dispose();
  }

  void _flipToBack() {
    _flipController.forward();
  }

  void _flipToFront() {
    _flipController.reverse();
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

      // Flip card to reveal OTP + New Password side
      _flipToBack();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'A 6-digit password reset verification code has been dispatched to your email.',
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
    }
  }

  Future<void> _handleResetPassword() async {
    if (!_resetFormKey.currentState!.validate()) return;

    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              const Text('Passwords do not match. Please verify your entries.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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

      _successController.forward();
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
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFFFBF7),
              Color(0xFFF8FAFC),
              Color(0xFFF1F5F9),
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
                    child: _step == 3
                        ? _buildSuccessStep()
                        : _buildFlipCard(),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// The 3D flip card containing front (email) and back (OTP + reset).
  Widget _buildFlipCard() {
    return AnimatedBuilder(
      animation: _flipAnimation,
      builder: (context, child) {
        final angle = _flipAnimation.value * math.pi;
        final isFrontVisible = angle < math.pi / 2;

        return Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.0008) // perspective
            ..rotateY(angle),
          child: isFrontVisible
              ? _buildEmailStep()
              : Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()..rotateY(math.pi),
                  child: _buildNewPasswordStep(),
                ),
        );
      },
    );
  }

  // ── Step 1: Email Form (Front of Flip Card) ────────────────────────────────
  Widget _buildEmailStep() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFEAEFF5)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Form(
        key: _emailFormKey,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: AppDimensions.spacingMD),

            // Shield icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.accentSurface,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.accent.withValues(alpha: 0.15),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                Icons.lock_reset_rounded,
                size: 36,
                color: AppColors.accent,
              ),
            ),

            const SizedBox(height: AppDimensions.spacingLG),

            // Title
            const Text(
              'Reset Password',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Enter your registered email address to receive a 6-digit password reset OTP.',
              style: TextStyle(
                fontSize: 13.5,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: AppDimensions.spacingLG),

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
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.arrow_back_rounded,
                      size: 15, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text(AppStrings.backToLogin, style: AppTextStyles.linkText),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.spacingMD),
          ],
        ),
      ),
    );
  }

  // ── Step 2: OTP & New Password Form (Back of Flip Card) ────────────────────
  Widget _buildNewPasswordStep() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFEAEFF5)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Form(
        key: _resetFormKey,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: AppDimensions.spacingSM),

            // Small header icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.accentSurface,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.vpn_key_rounded,
                size: 28,
                color: AppColors.accent,
              ),
            ),

            const SizedBox(height: AppDimensions.spacingMD),

            const Text(
              'Create New Password',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              'Enter the 6-digit code sent to ${_emailController.text.trim()} and choose a new password.',
              style: const TextStyle(
                fontSize: 12.5,
                color: Color(0xFF64748B),
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: AppDimensions.spacingLG),

            // 6-digit OTP code field
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

            // New Password field
            PasswordField(
              label: 'New Password',
              hint: 'Enter your new secure password',
              controller: _newPasswordController,
              validator: ValidationService.validatePassword,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: AppDimensions.spacingMD),

            // Confirm New Password field
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

            // Actions row: Resend, Change Email, Back
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 4,
              children: [
                TextButton(
                  onPressed: _handleSendResetOtp,
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.accent,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  ),
                  child: const Text(
                    'Resend Code',
                    style:
                        TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                  ),
                ),
                const Text('·',
                    style:
                        TextStyle(color: Color(0xFFCBD5E1), fontSize: 16)),
                TextButton(
                  onPressed: () {
                    setState(() => _step = 1);
                    _flipToFront();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF64748B),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  ),
                  child: const Text(
                    'Change Email',
                    style:
                        TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppDimensions.spacingSM),

            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.arrow_back_rounded,
                      size: 15, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text(AppStrings.backToLogin, style: AppTextStyles.linkText),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.spacingSM),
          ],
        ),
      ),
    );
  }

  // ── Step 3: Success Screen ─────────────────────────────────────────────────
  Widget _buildSuccessStep() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFEAEFF5)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: AppDimensions.spacingLG),
          ScaleTransition(
            scale: _successScale,
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: AppColors.successLight,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.success.withValues(alpha: 0.25),
                    blurRadius: 24,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: const Icon(
                Icons.lock_reset_rounded,
                size: 44,
                color: AppColors.success,
              ),
            ),
          ),
          const SizedBox(height: AppDimensions.spacingLG),
          const Text(
            'Password Reset Successfully!',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.success,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppDimensions.spacingSM),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              'Your new password has been verified and securely updated in the KAVACH keystore. You may now sign in to access your cyber defense shield.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: const Color(0xFF475569),
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: AppDimensions.spacingXL),
          PrimaryButton(
            text: 'Sign In With New Password',
            onPressed: () => Navigator.of(context).pop(),
          ),
          const SizedBox(height: AppDimensions.spacingLG),
        ],
      ),
    );
  }
}
