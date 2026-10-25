import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/constants/app_dimensions.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/primary_button.dart';

/// Next-Generation 6-Digit OTP Email Verification Screen for Desktop.
/// Features segmented digit boxes, active 60s resend timer, auto-focus,
/// master bypass auto-fill, and multi-role routing to Admin/SOC/User dashboards.
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen>
    with SingleTickerProviderStateMixin {
  static const int _pinLength = 6;
  final List<TextEditingController> _controllers =
      List.generate(_pinLength, (_) => TextEditingController());
  final List<FocusNode> _focusNodes =
      List.generate(_pinLength, (_) => FocusNode());

  bool _isResending = false;
  bool _isVerifying = false;
  int _resendCountdown = 60;
  Timer? _timer;
  bool _canResend = false;

  late final AnimationController _animController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
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
    _startCountdown();

    // Auto-focus first box after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _focusNodes.isNotEmpty) {
        _focusNodes[0].requestFocus();
      }
    });
  }

  void _startCountdown() {
    _timer?.cancel();
    setState(() {
      _resendCountdown = 60;
      _canResend = false;
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendCountdown > 1) {
        setState(() => _resendCountdown--);
      } else {
        timer.cancel();
        setState(() {
          _resendCountdown = 0;
          _canResend = true;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    _animController.dispose();
    super.dispose();
  }

  String _getCombinedCode() {
    return _controllers.map((c) => c.text.trim()).join();
  }

  void _onDigitChanged(int index, String value) {
    if (value.length > 1) {
      // Handle paste: distribute characters across all boxes
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (int i = 0; i < _pinLength; i++) {
        if (i < digits.length) {
          _controllers[i].text = digits[i];
        }
      }
      final nextIdx = digits.length < _pinLength ? digits.length : _pinLength - 1;
      _focusNodes[nextIdx].requestFocus();
      if (digits.length >= _pinLength) {
        _handleVerifyOtp();
      }
      return;
    }

    if (value.isNotEmpty) {
      if (index < _pinLength - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        if (_getCombinedCode().length == _pinLength) {
          _handleVerifyOtp();
        }
      }
    }
  }

  void _onKeyDown(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _controllers[index - 1].clear();
      _focusNodes[index - 1].requestFocus();
    }
  }


  Future<void> _handleVerifyOtp() async {
    final code = _getCombinedCode();
    if (code.length < _pinLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please enter all 6 digits of the verification code.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    setState(() => _isVerifying = true);

    try {
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      final ident = args?['email'] ?? args?['username'] ?? 'user@kavach.io';
      await ApiService.instance.verifyOtp(ident, code);
      if (!mounted) return;
      setState(() => _isVerifying = false);

      // On Desktop, protectionDashboard routes based on currentUserRole:
      // admin -> AdminDashboardScreen, soc_analyst -> SocDashboardScreen, user -> UserDashboardScreen
      Navigator.of(context).pushNamedAndRemoveUntil(
        AppRoutes.protectionDashboard,
        (r) => false,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isVerifying = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  Future<void> _handleResendEmail() async {
    if (!_canResend || _isResending) return;

    setState(() => _isResending = true);
    try {
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      final ident = args?['email'] ?? args?['username'] ?? 'user@kavach.io';
      await ApiService.instance.requestOtp(ident);
      if (!mounted) return;
      setState(() => _isResending = false);
      _startCountdown();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'A new 6-digit code has been dispatched to your email.',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isResending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final displayEmail = args?['email'] ?? args?['masked_email'] ?? 'your registered email';

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
                      maxWidth: 460,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // ── Shield Icon Hero ──────────────────────────────
                        _buildShieldHero(),

                        const SizedBox(height: 24),

                        // ── Title & Subtitle ──────────────────────────────
                        const Text(
                          'Two-Factor Authentication',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Enter the 6-digit security code dispatched to:',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withValues(alpha: 0.7),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),

                        // ── Recipient Email Pill ──────────────────────────
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F52BA).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF0F52BA).withValues(alpha: 0.4),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.mark_email_read_rounded,
                                color: Color(0xFF60A5FA),
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  displayEmail,
                                  style: const TextStyle(
                                    color: Color(0xFF93C5FD),
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 28),

                        // ── Card with 6-PIN Entry ─────────────────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                          decoration: BoxDecoration(
                            color: const Color(0xFF161B22),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.08),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.4),
                                blurRadius: 28,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // ── 6 Digit Input Boxes ──────────────────────
                              _buildPinBoxes(),

                              const SizedBox(height: 26),

                              // ── Verify & Continue Button ──────────────────
                              PrimaryButton(
                                text: 'Verify Code & Enter KAVACH',
                                isLoading: _isVerifying,
                                onPressed: _handleVerifyOtp,
                              ),

                              const SizedBox(height: 20),

                              // ── Resend Code Section ───────────────────────
                              _buildResendRow(),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // ── Back to Login Link ────────────────────────────
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).pushNamedAndRemoveUntil(
                              AppRoutes.login,
                              (route) => false,
                            );
                          },
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.arrow_back_rounded,
                                color: Color(0xFF60A5FA),
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Wrong account? Back to Sign In',
                                style: AppTextStyles.linkText.copyWith(
                                  color: const Color(0xFF60A5FA),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),
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

  /// Builds the 6 individual PIN digit boxes for Desktop.
  Widget _buildPinBoxes() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boxWidth = ((constraints.maxWidth - (5 * 10)) / 6).clamp(42.0, 56.0);

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(_pinLength, (i) {
            final isFocused = _focusNodes[i].hasFocus;
            final hasValue = _controllers[i].text.isNotEmpty;

            return KeyboardListener(
              focusNode: FocusNode(),
              onKeyEvent: (event) => _onKeyDown(i, event),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: boxWidth,
                height: 60,
                decoration: BoxDecoration(
                  color: isFocused
                      ? const Color(0xFF0F52BA).withValues(alpha: 0.12)
                      : const Color(0xFF0D1117),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isFocused
                        ? const Color(0xFF38BDF8)
                        : hasValue
                            ? const Color(0xFF0F52BA)
                            : Colors.white.withValues(alpha: 0.12),
                    width: isFocused ? 2 : 1.2,
                  ),
                  boxShadow: isFocused
                      ? [
                          BoxShadow(
                            color: const Color(0xFF38BDF8).withValues(alpha: 0.25),
                            blurRadius: 10,
                            spreadRadius: 1,
                          ),
                        ]
                      : null,
                ),
                child: Center(
                  child: TextField(
                    controller: _controllers[i],
                    focusNode: _focusNodes[i],
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 0,
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      counterText: '',
                    ),
                    onChanged: (val) => _onDigitChanged(i, val),
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }

  /// Builds the resend countdown or active button.
  Widget _buildResendRow() {
    if (_isResending) {
      return const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Color(0xFF60A5FA),
            ),
          ),
          SizedBox(width: 8),
          Text(
            'Dispatching new code...',
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          ),
        ],
      );
    }

    if (_canResend) {
      return TextButton.icon(
        onPressed: _handleResendEmail,
        icon: const Icon(Icons.refresh_rounded, size: 16, color: Color(0xFF38BDF8)),
        label: const Text(
          'Resend Verification Code',
          style: TextStyle(
            color: Color(0xFF38BDF8),
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.timer_outlined,
          size: 15,
          color: Colors.white.withValues(alpha: 0.4),
        ),
        const SizedBox(width: 6),
        Text(
          'Resend code in ${_resendCountdown}s',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }


  /// Builds the hero shield illustration.
  Widget _buildShieldHero() {
    return SizedBox(
      height: 100,
      width: 100,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  const Color(0xFF0F52BA).withValues(alpha: 0.25),
                  const Color(0xFF0F52BA).withValues(alpha: 0.0),
                ],
              ),
            ),
          ),
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF161B22),
              border: Border.all(
                color: const Color(0xFF0F52BA).withValues(alpha: 0.4),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F52BA).withValues(alpha: 0.3),
                  blurRadius: 16,
                ),
              ],
            ),
            child: const Icon(
              Icons.verified_user_rounded,
              size: 38,
              color: Color(0xFF60A5FA),
            ),
          ),
        ],
      ),
    );
  }
}
