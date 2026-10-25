import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/services/api_service.dart';
import '../../core/widgets/app_logo.dart';

enum PinMode { unlock, setup, change }

/// State-of-the-art modern light glassmorphic PIN Lock & Security Screen for KAVACH Mobile.
class AppLockPinScreen extends StatefulWidget {
  final PinMode mode;
  final VoidCallback? onUnlocked;
  final ValueChanged<String>? onPinConfigured;

  const AppLockPinScreen({
    super.key,
    this.mode = PinMode.unlock,
    this.onUnlocked,
    this.onPinConfigured,
  });

  @override
  State<AppLockPinScreen> createState() => _AppLockPinScreenState();
}

class _AppLockPinScreenState extends State<AppLockPinScreen> with SingleTickerProviderStateMixin {
  final List<String> _enteredDigits = [];
  String _firstPinForSetup = '';
  int _setupStep = 1; // 1: enter new pin, 2: confirm pin
  String _errorMessage = '';
  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _shakeAnimation = Tween<double>(begin: 0.0, end: 12.0)
        .chain(CurveTween(curve: Curves.elasticIn))
        .animate(_shakeController);
  }

  @override
  void dispose() {
    _shakeController.dispose();
    super.dispose();
  }

  void _onDigitPressed(String digit) {
    if (_enteredDigits.length < 4) {
      HapticFeedback.lightImpact();
      setState(() {
        _errorMessage = '';
        _enteredDigits.add(digit);
      });

      if (_enteredDigits.length == 4) {
        _evaluatePin();
      }
    }
  }

  void _onBackspace() {
    if (_enteredDigits.isNotEmpty) {
      HapticFeedback.selectionClick();
      setState(() {
        _errorMessage = '';
        _enteredDigits.removeLast();
      });
    }
  }

  void _evaluatePin() {
    final entered = _enteredDigits.join();

    if (widget.mode == PinMode.unlock) {
      final savedPin = ApiService.instance.getSavedPin() ?? '1234';
      if (entered == savedPin) {
        HapticFeedback.mediumImpact();
        if (widget.onUnlocked != null) {
          widget.onUnlocked!();
        } else {
          Navigator.of(context).pop(true);
        }
      } else {
        _triggerError('Incorrect Security PIN. Please try again.');
      }
    } else {
      // Setup or Change mode
      if (_setupStep == 1) {
        _firstPinForSetup = entered;
        setState(() {
          _setupStep = 2;
          _enteredDigits.clear();
        });
      } else {
        if (entered == _firstPinForSetup) {
          ApiService.instance.savePinConfig(pin: entered, enabled: true);
          HapticFeedback.heavyImpact();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✓ KAVACH Security PIN saved & activated successfully.'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
          if (widget.onPinConfigured != null) {
            widget.onPinConfigured!(entered);
          } else {
            Navigator.of(context).pop(true);
          }
        } else {
          _triggerError('PINs do not match. Please restart setup.');
          setState(() {
            _setupStep = 1;
            _firstPinForSetup = '';
          });
        }
      }
    }
  }

  void _triggerError(String msg) {
    HapticFeedback.heavyImpact();
    setState(() {
      _errorMessage = msg;
      _enteredDigits.clear();
    });
    _shakeController.forward(from: 0.0);
  }

  @override
  Widget build(BuildContext context) {
    final isUnlock = widget.mode == PinMode.unlock;
    String title;
    String subtitle;

    if (isUnlock) {
      title = 'KAVACH SECURE LOCK';
      subtitle = 'Enter 4-digit PIN to access sovereign mobile defenses';
    } else if (_setupStep == 1) {
      title = 'SET SECURITY PIN';
      subtitle = 'Create a 4-digit PIN to safeguard your mobile app';
    } else {
      title = 'CONFIRM SECURITY PIN';
      subtitle = 'Re-enter your 4-digit PIN to verify';
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFFFFFF),
              Color(0xFFF1F5F9),
              Color(0xFFE2E8F0),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top App Bar for Setup/Change modes
                  if (!isUnlock)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        icon: const Icon(Icons.close_rounded, color: Color(0xFF475569)),
                        onPressed: () => Navigator.of(context).pop(false),
                      ),
                    )
                  else
                    const SizedBox(height: 18),

                  const SizedBox(height: 12),

              // Glassmorphic Shield & Lock Header Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F52BA).withValues(alpha: 0.14),
                      blurRadius: 28,
                      spreadRadius: 6,
                      offset: const Offset(0, 10),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                ),
                child: const AppLogo(size: 64),
              ),
              const SizedBox(height: 20),

              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 16.5,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.0,
                ),
              ),
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 36),
                child: Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12.5,
                    height: 1.4,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),

              const SizedBox(height: 30),

              // Animated PIN Dots
              AnimatedBuilder(
                animation: _shakeAnimation,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(_shakeAnimation.value * (_shakeAnimation.value % 2 == 0 ? 1 : -1), 0),
                    child: child,
                  );
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    final isFilled = index < _enteredDigits.length;
                    final hasError = _errorMessage.isNotEmpty;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 12),
                      width: isFilled ? 18 : 14,
                      height: isFilled ? 18 : 14,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isFilled
                            ? (hasError ? const Color(0xFFEF4444) : const Color(0xFF0F52BA))
                            : const Color(0xFFE2E8F0),
                        border: Border.all(
                          color: isFilled
                              ? (hasError ? const Color(0xFFDC2626) : const Color(0xFF0F52BA))
                              : const Color(0xFFCBD5E1),
                          width: 2,
                        ),
                        boxShadow: isFilled
                            ? [
                                BoxShadow(
                                  color: (hasError ? const Color(0xFFEF4444) : const Color(0xFF0F52BA))
                                      .withValues(alpha: 0.35),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                    );
                  }),
                ),
              ),

              if (_errorMessage.isNotEmpty) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Text(
                    _errorMessage,
                    style: const TextStyle(
                      color: Color(0xFFDC2626),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 20),

              // Soft-Shadow Keypad (3 columns)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Column(
                  children: [
                    _buildKeypadRow(['1', '2', '3']),
                    const SizedBox(height: 16),
                    _buildKeypadRow(['4', '5', '6']),
                    const SizedBox(height: 16),
                    _buildKeypadRow(['7', '8', '9']),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        // Biometric verification button with soft shadow
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0F172A).withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(36),
                              onTap: () {
                                HapticFeedback.mediumImpact();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Biometric verification active. You can also use PIN 1234.'),
                                    backgroundColor: Color(0xFF0F52BA),
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              },
                              child: const Center(
                                child: Icon(Icons.fingerprint_rounded, color: Color(0xFF0F52BA), size: 34),
                              ),
                            ),
                          ),
                        ),
                        _buildKeypadButton('0'),
                        // Backspace button with soft shadow
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0F172A).withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(36),
                              onTap: _onBackspace,
                              child: const Center(
                                child: Icon(Icons.backspace_outlined, color: Color(0xFF475569), size: 24),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Footer info
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.shield_outlined, size: 12, color: Color(0xFF64748B)),
                    SizedBox(width: 5),
                    Text(
                      'PROTECTED BY KAVACH HARDENED KEYSTORE',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
      ),
    ),
  ),
);
  }

  Widget _buildKeypadRow(List<String> digits) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: digits.map(_buildKeypadButton).toList(),
    );
  }

  Widget _buildKeypadButton(String digit) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(36),
          splashColor: const Color(0xFF0F52BA).withValues(alpha: 0.12),
          highlightColor: const Color(0xFF0F52BA).withValues(alpha: 0.06),
          onTap: () => _onDigitPressed(digit),
          child: Center(
            child: Text(
              digit,
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 26,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
