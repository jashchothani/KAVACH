import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

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
      backgroundColor: const Color(0xFF070B14),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF070B14),
              Color(0xFF0F172A),
              Color(0xFF090D1A),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // ── Shield Hero Badge ──────────────────────────────
                        _buildShieldHero(),

                        const SizedBox(height: 20),

                        // ── Security Tag Pill ──────────────────────────────
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF0284C7).withValues(alpha: 0.35),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.lock_clock_rounded, color: Color(0xFF38BDF8), size: 13),
                              SizedBox(width: 6),
                              Text(
                                'TWO-FACTOR VERIFICATION',
                                style: TextStyle(
                                  color: Color(0xFF38BDF8),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 14),

                        // ── Title & Subtitle ──────────────────────────────
                        const Text(
                          'Security Verification',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -0.6,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'A 6-digit authentication code was sent to:',
                          style: TextStyle(
                            fontSize: 13.5,
                            color: Colors.white.withValues(alpha: 0.65),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 10),

                        // ── Recipient Email Pill ──────────────────────────
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: const Color(0xFF131D33),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.mark_email_read_rounded,
                                color: Color(0xFF38BDF8),
                                size: 15,
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  displayEmail,
                                  style: const TextStyle(
                                    color: Color(0xFFE2E8F0),
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12.5,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'VERIFIED',
                                  style: TextStyle(
                                    color: Color(0xFF34D399),
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 28),

                        // ── Credential Card ───────────────────────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0D1527),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: const Color(0xFF1E293B),
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.6),
                                blurRadius: 36,
                                offset: const Offset(0, 16),
                              ),
                              BoxShadow(
                                color: const Color(0xFF0F52BA).withValues(alpha: 0.12),
                                blurRadius: 40,
                                spreadRadius: -4,
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // ── 6 Digit Segmented Input Boxes ───────────
                              _buildPinBoxes(),

                              const SizedBox(height: 26),

                              // ── Verify & Proceed Button ─────────────────
                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0F52BA),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    shadowColor: const Color(0xFF0F52BA).withValues(alpha: 0.5),
                                  ),
                                  onPressed: _isVerifying ? null : _handleVerifyOtp,
                                  child: _isVerifying
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.shield_rounded, size: 18),
                                            SizedBox(width: 8),
                                            Text(
                                              'Verify & Access KAVACH',
                                              style: TextStyle(
                                                fontSize: 14.5,
                                                fontWeight: FontWeight.w800,
                                                letterSpacing: 0.2,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),

                              const SizedBox(height: 22),

                              // ── Resend Code Section ───────────────────────
                              _buildResendRow(),

                              const SizedBox(height: 18),

                              // ── Security Cert Footnote ────────────────────
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.lock_rounded, size: 11, color: Color(0xFF64748B)),
                                  SizedBox(width: 6),
                                  Text(
                                    'AES-256 DPAPI Vault · Sovereign Indian Cyber Architecture',
                                    style: TextStyle(
                                      color: Color(0xFF64748B),
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 26),

                        // ── Back to Login Link ────────────────────────────
                        InkWell(
                          borderRadius: BorderRadius.circular(8),
                          onTap: () {
                            Navigator.of(context).pushNamedAndRemoveUntil(
                              AppRoutes.login,
                              (route) => false,
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.arrow_back_rounded,
                                  color: Color(0xFF60A5FA),
                                  size: 15,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Wrong account? Back to Sign In',
                                  style: AppTextStyles.linkText.copyWith(
                                    color: const Color(0xFF60A5FA),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
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

  /// Builds the 6 individual PIN digit boxes with segmented center separator.
  Widget _buildPinBoxes() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final totalGaps = (4 * 8.0) + 20.0;
        final boxWidth = ((constraints.maxWidth - totalGaps) / 6).clamp(42.0, 56.0);

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
              margin: const EdgeInsets.symmetric(horizontal: 8),
              width: 10,
              height: 2.5,
              decoration: BoxDecoration(
                color: const Color(0xFF475569),
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
        duration: const Duration(milliseconds: 180),
        width: boxWidth,
        height: 62,
        decoration: BoxDecoration(
          color: isFocused
              ? const Color(0xFF0F264E)
              : hasValue
                  ? const Color(0xFF0B1B38)
                  : const Color(0xFF091122),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isFocused
                ? const Color(0xFF38BDF8)
                : hasValue
                    ? const Color(0xFF0284C7)
                    : const Color(0xFF23314A),
            width: isFocused ? 2.0 : 1.3,
          ),
          boxShadow: isFocused
              ? [
                  BoxShadow(
                    color: const Color(0xFF38BDF8).withValues(alpha: 0.35),
                    blurRadius: 14,
                    spreadRadius: 1,
                  ),
                ]
              : hasValue
                  ? [
                      BoxShadow(
                        color: const Color(0xFF0284C7).withValues(alpha: 0.15),
                        blurRadius: 8,
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
            cursorColor: const Color(0xFF38BDF8),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Colors.white,
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
              hintText: !isFocused && !hasValue ? '•' : null,
              hintStyle: const TextStyle(
                color: Color(0xFF334155),
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
          color: const Color(0xFF131D33),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Color(0xFF60A5FA),
              ),
            ),
            SizedBox(width: 10),
            Text(
              'Dispatching fresh 6-digit code...',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12.5),
            ),
          ],
        ),
      );
    }

    if (_canResend) {
      return TextButton.icon(
        style: TextButton.styleFrom(
          foregroundColor: const Color(0xFF38BDF8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          backgroundColor: const Color(0xFF0284C7).withValues(alpha: 0.12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: const Color(0xFF0284C7).withValues(alpha: 0.3)),
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
    final timeStr = '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFF131D33),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.timer_outlined,
            size: 14,
            color: Color(0xFF94A3B8),
          ),
          const SizedBox(width: 8),
          Text(
            'Resend code in $timeStr',
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  /// Builds the hero shield illustration.
  Widget _buildShieldHero() {
    return SizedBox(
      height: 96,
      width: 96,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer Glow Pulse
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  const Color(0xFF0284C7).withValues(alpha: 0.28),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          // Middle Glass Ring
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF0D1527),
              border: Border.all(
                color: const Color(0xFF38BDF8).withValues(alpha: 0.3),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.25),
                  blurRadius: 18,
                ),
              ],
            ),
          ),
          // Inner Emblem
          Container(
            width: 60,
            height: 60,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFF0284C7), Color(0xFF0F52BA)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Icon(
              Icons.verified_user_rounded,
              size: 30,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
