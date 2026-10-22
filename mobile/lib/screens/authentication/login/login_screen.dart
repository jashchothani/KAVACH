import 'package:flutter/material.dart';

import '../../../core/constants/app_dimensions.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/validation_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/password_field.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/section_title.dart';

/// Login screen with email, password, remember me, and navigation to signup/forgot.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberMe = false;
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
    _emailController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ApiService.instance.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
      if (!mounted) return;
      setState(() => _isLoading = false);
      Navigator.of(context).pushReplacementNamed(AppRoutes.protectionDashboard);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _quickLogin(String username, String password) async {
    _emailController.text = username;
    _passwordController.text = password;
    setState(() => _isLoading = true);

    try {
      await ApiService.instance.login(username, password);
      if (!mounted) return;
      setState(() => _isLoading = false);
      Navigator.of(context).pushReplacementNamed(AppRoutes.home);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
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
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: AppDimensions.spacingXL),

                          // ── Logo ──────────────────────────────────────────
                          const AppLogo(),

                          const SizedBox(height: AppDimensions.spacingXL),

                          // ── Header ────────────────────────────────────────
                          const SectionTitle(
                            title: AppStrings.loginTitle,
                            subtitle: AppStrings.loginSubtitle,
                            alignment: CrossAxisAlignment.center,
                          ),

                          const SizedBox(height: AppDimensions.spacingXL),

                          // ── Email Field ───────────────────────────────────
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

                          // ── Password Field ────────────────────────────────
                          PasswordField(
                            label: AppStrings.password,
                            hint: 'Enter your password',
                            controller: _passwordController,
                            validator: ValidationService.validatePassword,
                            textInputAction: TextInputAction.done,
                          ),

                          const SizedBox(height: AppDimensions.spacingSM),

                          // ── Remember Me + Forgot Password ─────────────────
                          Row(
                            children: [
                              SizedBox(
                                height: 24,
                                width: 24,
                                child: Checkbox(
                                  value: _rememberMe,
                                  onChanged: (value) {
                                    setState(() {
                                      _rememberMe = value ?? false;
                                    });
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                AppStrings.rememberMe,
                                style: AppTextStyles.labelSmall,
                              ),
                              const Spacer(),
                              GestureDetector(
                                onTap: () {
                                  Navigator.of(context)
                                      .pushNamed(AppRoutes.forgotPassword);
                                },
                                child: Text(
                                  AppStrings.forgotPassword,
                                  style: AppTextStyles.linkText,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Login Button ──────────────────────────────────
                          PrimaryButton(
                            text: AppStrings.loginButton,
                            isLoading: _isLoading,
                            onPressed: _handleLogin,
                          ),

                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Divider ───────────────────────────────────────
                          Row(
                            children: [
                              const Expanded(child: Divider()),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppDimensions.spacingMD,
                                ),
                                child: Text(
                                  AppStrings.orDivider,
                                  style: AppTextStyles.bodySmall,
                                ),
                              ),
                              const Expanded(child: Divider()),
                            ],
                          ),

                          const SizedBox(height: AppDimensions.spacingMD),

                          // ── Quick Access Demo Buttons ──────────────────────
                          Text(
                            'Quick Sign-In',
                            style: AppTextStyles.caption.copyWith(
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            alignment: WrapAlignment.center,
                            children: [
                              ActionChip(
                                avatar: const Icon(Icons.admin_panel_settings, size: 16, color: Color(0xFF8B5CF6)),
                                label: const Text('Admin', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                backgroundColor: const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                                side: const BorderSide(color: Color(0xFF8B5CF6), width: 0.5),
                                onPressed: _isLoading ? null : () => _quickLogin('jash', 'KavachSecurePass2026!'),
                              ),
                              ActionChip(
                                avatar: const Icon(Icons.security, size: 16, color: Color(0xFF38BDF8)),
                                label: const Text('SOC Analyst', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                backgroundColor: const Color(0xFF38BDF8).withValues(alpha: 0.1),
                                side: const BorderSide(color: Color(0xFF38BDF8), width: 0.5),
                                onPressed: _isLoading ? null : () => _quickLogin('analyst', 'KavachSecurePass2026!'),
                              ),
                              ActionChip(
                                avatar: const Icon(Icons.verified_user, size: 16, color: Color(0xFF10B981)),
                                label: const Text('Workstation User', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1),
                                side: const BorderSide(color: Color(0xFF10B981), width: 0.5),
                                onPressed: _isLoading ? null : () => _quickLogin('user', 'KavachSecurePass2026!'),
                              ),
                            ],
                          ),

                          const SizedBox(height: AppDimensions.spacingLG),

                          // ── Create Account ────────────────────────────────
                          Wrap(
                            alignment: WrapAlignment.center,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                AppStrings.noAccount,
                                style: AppTextStyles.bodyMedium,
                              ),
                              const SizedBox(width: 4),
                              GestureDetector(
                                onTap: () {
                                  Navigator.of(context)
                                      .pushNamed(AppRoutes.signUp);
                                },
                                child: Text(
                                  AppStrings.createAccount,
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
