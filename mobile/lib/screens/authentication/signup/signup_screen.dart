import 'package:flutter/material.dart';

import '../../../core/constants/app_dimensions.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/models/user_role.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/validation_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/password_field.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/section_title.dart';

/// Sign-up screen with full name, organization, email, password,
/// confirm password, and role dropdown.
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _organizationController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  UserRole? _selectedRole;
  bool _isLoading = false;

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
    _nameController.dispose();
    _organizationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleSignUp() {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Please select a role',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textOnPrimary,
            ),
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDimensions.radiusSM),
          ),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Authentication service integration point.
    // Replace with actual sign-up call.
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isLoading = false);
        Navigator.of(context).pushNamed(AppRoutes.verifyEmail);
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
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Logo ──────────────────────────────────────────
                          const AppLogo(),

                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Header ────────────────────────────────────────
                          const SectionTitle(
                            title: AppStrings.signUpTitle,
                            subtitle: AppStrings.signUpSubtitle,
                            alignment: CrossAxisAlignment.center,
                          ),

                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Full Name ─────────────────────────────────────
                          AppTextField(
                            label: AppStrings.fullName,
                            hint: 'Enter your full name',
                            controller: _nameController,
                            prefixIcon: Icons.person_outline,
                            validator: ValidationService.validateName,
                            autofillHints: const [AutofillHints.name],
                          ),

                          const SizedBox(height: AppDimensions.spacingMD),

                          // ── Organization ──────────────────────────────────
                          AppTextField(
                            label: AppStrings.organization,
                            hint: 'Enter your organization',
                            controller: _organizationController,
                            prefixIcon: Icons.business_outlined,
                            validator: ValidationService.validateOrganization,
                            autofillHints: const [
                              AutofillHints.organizationName
                            ],
                          ),

                          const SizedBox(height: AppDimensions.spacingMD),

                          // ── Email ─────────────────────────────────────────
                          AppTextField(
                            label: AppStrings.email,
                            hint: 'Enter your email address',
                            controller: _emailController,
                            prefixIcon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
                            validator: ValidationService.validateEmail,
                            autofillHints: const [AutofillHints.email],
                          ),

                          const SizedBox(height: AppDimensions.spacingMD),

                          // ── Password ──────────────────────────────────────
                          PasswordField(
                            label: AppStrings.password,
                            hint: 'Create a strong password',
                            controller: _passwordController,
                            validator:
                                ValidationService.validatePasswordStrength,
                          ),

                          const SizedBox(height: AppDimensions.spacingMD),

                          // ── Confirm Password ──────────────────────────────
                          PasswordField(
                            label: AppStrings.confirmPassword,
                            hint: 'Re-enter your password',
                            controller: _confirmPasswordController,
                            validator: (value) =>
                                ValidationService.validateConfirmPassword(
                              value,
                              _passwordController.text,
                            ),
                            textInputAction: TextInputAction.done,
                          ),

                          const SizedBox(height: AppDimensions.spacingMD),

                          // ── Role Dropdown ─────────────────────────────────
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AppStrings.selectRole,
                                style: AppTextStyles.inputLabel,
                              ),
                              const SizedBox(height: 8),
                              DropdownButtonFormField<UserRole>(
                                value: _selectedRole,
                                hint: Text(
                                  'Choose your role',
                                  style: AppTextStyles.inputHint,
                                ),
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(
                                    Icons.shield_outlined,
                                    size: 20,
                                  ),
                                ),
                                items: UserRole.values
                                    .map(
                                      (role) => DropdownMenuItem<UserRole>(
                                        value: role,
                                        child: Text(
                                          role.displayName,
                                          style: AppTextStyles.inputText,
                                        ),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) {
                                  setState(() => _selectedRole = value);
                                },
                                validator: (value) {
                                  if (value == null) {
                                    return AppStrings.fieldRequired;
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),

                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Sign Up Button ────────────────────────────────
                          PrimaryButton(
                            text: AppStrings.signUpButton,
                            isLoading: _isLoading,
                            onPressed: _handleSignUp,
                          ),

                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Already have account ──────────────────────────
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                AppStrings.alreadyHaveAccount,
                                style: AppTextStyles.bodyMedium,
                              ),
                              GestureDetector(
                                onTap: () {
                                  Navigator.of(context).pop();
                                },
                                child: Text(
                                  AppStrings.login,
                                  style: AppTextStyles.linkText,
                                ),
                              ),
                            ],
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
      ),
    );
  }
}
