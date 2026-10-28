import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Ultra-Modern Light-Themed 6-Digit OTP Email Verification Screen.
/// Features segmented digit boxes with warm accent glow, animated
/// countdown timer, auto-focus, paste auto-fill, and success celebration.
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen>
    with TickerProviderStateMixin {
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

  late final AnimationController _successAnimController;
  late final Animation<double> _successScale;
  bool _showSuccess = false;

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

    _successAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _successScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _successAnimController, curve: Curves.elasticOut),
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
    _successAnimController.dispose();
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
      final nextIdx =
          digits.length < _pinLength ? digits.length : _pinLength - 1;
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

  KeyEventResult _onKeyDown(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _controllers[index - 1].clear();
      _focusNodes[index - 1].requestFocus();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  Future<void> _handleVerifyOtp() async {
    final code = _getCombinedCode();
    if (code.length < _pinLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              const Text('Please enter the full 6-digit verification code.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
      return;
    }

    setState(() => _isVerifying = true);

    try {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      final ident = args?['email'] ?? args?['username'] ?? '';
      await ApiService.instance.verifyOtp(ident, code);
      if (!mounted) return;
      setState(() {
        _isVerifying = false;
        _showSuccess = true;
      });
      _successAnimController.forward();

      // Navigate after brief celebration
      await Future.delayed(const Duration(milliseconds: 1200));
      if (!mounted) return;

      // On Mobile, strictly ONE mode exists: User Mode
      Navigator.of(context).pushNamedAndRemoveUntil(
        AppRoutes.userDashboard,
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
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
    }
  }

  Future<void> _handleResendEmail() async {
    if (!_canResend || _isResending) return;

    setState(() => _isResending = true);
    try {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      final ident = args?['email'] ?? args?['username'] ?? '';
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
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final displayEmail =
        args?['email'] ?? args?['masked_email'] ?? 'your registered email';

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
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: _showSuccess
                        ? _buildSuccessView()
                        : _buildOtpView(displayEmail, args?['otp_code']?.toString()),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOtpView(String displayEmail, [String? devOtp]) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // ── Shield Hero Badge (Light) ────────────────────────────
        _buildShieldHero(),

        const SizedBox(height: 20),

        // ── Security Tag Pill ────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: AppColors.accentSurface,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(
              color: AppColors.accent.withValues(alpha: 0.25),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_clock_rounded,
                  color: AppColors.accent, size: 13),
              const SizedBox(width: 6),
              Text(
                'TWO-FACTOR VERIFICATION',
                style: TextStyle(
                  color: AppColors.accent,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // ── Title & Subtitle ──────────────────────────────────
        const Text(
          'Security Verification',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
            letterSpacing: -0.5,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(
          'A 6-digit authentication code was sent to:',
          style: TextStyle(
            fontSize: 13.5,
            color: const Color(0xFF64748B),
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),

        // ── Recipient Email Pill ──────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.mark_email_read_rounded,
                color: AppColors.accent,
                size: 15,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  displayEmail,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w700,
                    fontSize: 12.5,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        if (devOtp != null && devOtp.isNotEmpty) ...[
          const SizedBox(height: 10),
          InkWell(
            onTap: () {
              final digits = devOtp.replaceAll(RegExp(r'\D'), '');
              for (int i = 0; i < _pinLength && i < digits.length; i++) {
                _controllers[i].text = digits[i];
              }
              if (_focusNodes.isNotEmpty) {
                _focusNodes.last.unfocus();
              }
              _handleVerifyOtp();
            },
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF93C5FD)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.flash_on_rounded, size: 14, color: Color(0xFF2563EB)),
                  const SizedBox(width: 4),
                  Text(
                    'Autofill Code ($devOtp)',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],

        const SizedBox(height: 28),

        // ── Credential Card ───────────────────────────────────
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
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
              BoxShadow(
                color: Color(0x04000000),
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              // ── 6 Digit Segmented Input Boxes ──────────────
              _buildPinBoxes(),

              const SizedBox(height: 28),

              // ── Verify & Proceed Button ────────────────────
              SizedBox(
                width: double.infinity,
                height: 52,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: _isVerifying ? null : _handleVerifyOtp,
                      child: Center(
                        child: _isVerifying
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.shield_rounded,
                                      size: 18, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text(
                                    'Verify & Access KAVACH',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.2,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 22),

              // ── Resend Code Section ────────────────────────
              _buildResendRow(),

              const SizedBox(height: 18),

              // ── Security Footnote ──────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_rounded,
                      size: 11, color: const Color(0xFF94A3B8)),
                  const SizedBox(width: 6),
                  const Text(
                    'AES-256 DPAPI Vault · Sovereign Indian Cyber Architecture',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // ── Back to Login Link ──────────────────────────────
        InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            Navigator.of(context).pushNamedAndRemoveUntil(
              AppRoutes.login,
              (route) => false,
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.arrow_back_rounded,
                  color: AppColors.primary,
                  size: 15,
                ),
                const SizedBox(width: 6),
                Text(
                  'Wrong account? Back to Sign In',
                  style: AppTextStyles.linkText.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Success celebration view.
  Widget _buildSuccessView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        ScaleTransition(
          scale: _successScale,
          child: Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.successLight,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.success.withValues(alpha: 0.25),
                  blurRadius: 28,
                  spreadRadius: 6,
                ),
              ],
            ),
            child: const Icon(
              Icons.check_rounded,
              size: 52,
              color: AppColors.success,
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Verification Successful!',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: AppColors.success,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Redirecting to your dashboard...',
          style: AppTextStyles.bodyMedium.copyWith(
            color: const Color(0xFF475569),
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  /// Builds the 6 individual PIN digit boxes with segmented center separator.
  Widget _buildPinBoxes() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final totalGaps = (4 * 8.0) + 18.0;
        final boxWidth =
            ((constraints.maxWidth - totalGaps) / 6).clamp(38.0, 50.0);

        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // First 3 Digits
            _buildDigitBox(0, boxWidth),
            const SizedBox(width: 8),
            _buildDigitBox(1, boxWidth),
            const SizedBox(width: 8),
            _buildDigitBox(2, boxWidth),

            // Center Dash Divider
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 6),
              width: 10,
              height: 3,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Last 3 Digits
            _buildDigitBox(3, boxWidth),
            const SizedBox(width: 8),
            _buildDigitBox(4, boxWidth),
            const SizedBox(width: 8),
            _buildDigitBox(5, boxWidth),
          ],
        );
      },
    );
  }

  Widget _buildDigitBox(int i, double boxWidth) {
    final isFocused = _focusNodes[i].hasFocus;
    final hasValue = _controllers[i].text.isNotEmpty;

    return Focus(
      onKeyEvent: (node, event) => _onKeyDown(i, event),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        width: boxWidth,
        height: 58,
        decoration: BoxDecoration(
          color: isFocused
              ? AppColors.otpBoxActive
              : hasValue
                  ? const Color(0xFFFFF9F5)
                  : AppColors.otpBoxIdle,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isFocused
                ? AppColors.otpBoxBorderActive
                : hasValue
                    ? AppColors.accent.withValues(alpha: 0.4)
                    : AppColors.otpBoxBorderIdle,
            width: isFocused ? 2.2 : 1.5,
          ),
          boxShadow: isFocused
              ? [
                  BoxShadow(
                    color: AppColors.accent.withValues(alpha: 0.2),
                    blurRadius: 14,
                    spreadRadius: 1,
                  ),
                ]
              : hasValue
                  ? [
                      BoxShadow(
                        color: AppColors.accent.withValues(alpha: 0.08),
                        blurRadius: 6,
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
            cursorColor: AppColors.accent,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              fontFamily: 'monospace',
            ),
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              counterText: '',
              fillColor: Colors.transparent,
              filled: true,
              hintText: !isFocused && !hasValue ? '•' : null,
              hintStyle: const TextStyle(
                color: Color(0xFFCBD5E1),
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            onChanged: (val) => _onDigitChanged(i, val),
          ),
        ),
      ),
    );
  }

  /// Builds the resend countdown or active button.
  Widget _buildResendRow() {
    if (_isResending) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.accent,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Dispatching fresh 6-digit code...',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
            ),
          ],
        ),
      );
    }

    if (_canResend) {
      return TextButton.icon(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.accent,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          backgroundColor: AppColors.accentSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
            side: BorderSide(
                color: AppColors.accent.withValues(alpha: 0.25)),
          ),
        ),
        onPressed: _handleResendEmail,
        icon: const Icon(Icons.refresh_rounded, size: 16),
        label: const Text(
          'Resend Security Code',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 12.5,
          ),
        ),
      );
    }

    final mins = _resendCountdown ~/ 60;
    final secs = _resendCountdown % 60;
    final timeStr =
        '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.timer_outlined,
            size: 14,
            color: const Color(0xFF94A3B8),
          ),
          const SizedBox(width: 8),
          Text(
            'Resend code in $timeStr',
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  /// Builds the hero shield illustration (light theme).
  Widget _buildShieldHero() {
    return SizedBox(
      height: 90,
      width: 90,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer Glow
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppColors.accent.withValues(alpha: 0.15),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          // Middle Glass Ring
          Container(
            width: 74,
            height: 74,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(
                color: AppColors.accent.withValues(alpha: 0.2),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.accent.withValues(alpha: 0.12),
                  blurRadius: 18,
                ),
              ],
            ),
          ),
          // Inner Emblem
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Icon(
              Icons.verified_user_rounded,
              size: 28,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
