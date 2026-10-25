import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Ultra-Modern Google-Style 2-Step Sign-In Verification Screen.
/// Matches the exact reference design:
/// Step 1: 'Trying to sign in from another computer?' with 'NO' and 'YES'.
/// Step 2: 'Which number do you see on your other screen?' with 3 circular number chips and 'CANCEL'.
class GooglePromptModal extends StatefulWidget {
  final Map<String, dynamic> challenge;
  final ValueChanged<int> onNumberSelected;
  final VoidCallback onReject;

  const GooglePromptModal({
    super.key,
    required this.challenge,
    required this.onNumberSelected,
    required this.onReject,
  });

  /// Presents the Google-style verification screen as a full-page modal with tactile haptic feedback.
  static Future<void> show({
    required BuildContext context,
    required Map<String, dynamic> challenge,
    required ValueChanged<int> onNumberSelected,
    required VoidCallback onReject,
  }) async {
    HapticFeedback.heavyImpact();
    Future.delayed(const Duration(milliseconds: 140), () => HapticFeedback.heavyImpact());
    Future.delayed(const Duration(milliseconds: 300), () => HapticFeedback.vibrate());

    return Navigator.of(context, rootNavigator: true).push<void>(
      PageRouteBuilder<void>(
        opaque: true,
        transitionDuration: const Duration(milliseconds: 300),
        reverseTransitionDuration: const Duration(milliseconds: 240),
        pageBuilder: (ctx, anim, secAnim) => GooglePromptModal(
          challenge: challenge,
          onNumberSelected: (n) {
            Navigator.of(ctx).pop();
            onNumberSelected(n);
          },
          onReject: () {
            Navigator.of(ctx).pop();
            onReject();
          },
        ),
        transitionsBuilder: (ctx, anim, secAnim, child) {
          final slide = Tween<Offset>(
            begin: const Offset(0, 0.08),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic));
          return SlideTransition(
            position: slide,
            child: FadeTransition(opacity: anim, child: child),
          );
        },
      ),
    );
  }

  @override
  State<GooglePromptModal> createState() => _GooglePromptModalState();
}

class _GooglePromptModalState extends State<GooglePromptModal> {
  // Step 1: Prompt ('Trying to sign in from another computer?')
  // Step 2: Number Matching ('Which number do you see on your other screen?')
  int _currentStep = 1;

  Widget _buildMetaItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Color(0xFF5F6368),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1F1F1F),
            letterSpacing: -0.1,
          ),
        ),
      ],
    );
  }

  Widget _buildAccountPill(String userEmail) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 11,
            backgroundColor: const Color(0xFF8B1A1A),
            child: Text(
              (userEmail.isNotEmpty ? userEmail[0] : 'K').toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              userEmail,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Color(0xFF334155),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final opts = (widget.challenge['options'] as List<dynamic>?) ?? [19, 74, 83];
    final device = widget.challenge['device']?.toString() ?? 'Windows 11 Workstation · Chrome';
    final user = widget.challenge['username']?.toString() ?? '';
    final userEmail = widget.challenge['email']?.toString() ??
        (user.isNotEmpty ? '$user@kavachcybertech.in' : 'user@kavachcybertech.in');

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar with Close icon on left and Centered KAVACH Logo
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 26, color: Color(0xFF1F1F1F)),
                    tooltip: 'Dismiss',
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      widget.onReject();
                    },
                  ),
                  Expanded(
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.asset(
                            'assets/images/kavach_logo.png',
                            height: 26,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.shield_rounded,
                              color: Color(0xFF8B1A1A),
                              size: 26,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'KAVACH',
                            style: TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF8B1A1A),
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            const Divider(color: Color(0xFFF1F5F9), height: 1, thickness: 1),

            // Animated Screen Switching: Step 1 vs Step 2
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                transitionBuilder: (child, anim) {
                  return FadeTransition(
                    opacity: anim,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.04, 0),
                        end: Offset.zero,
                      ).animate(anim),
                      child: child,
                    ),
                  );
                },
                child: _currentStep == 1
                    ? _buildStepOne(userEmail, device)
                    : _buildStepTwo(userEmail, opts),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 1: Trying to sign in from another computer? (Ref Image 1 Phone Screen 1) ──
  Widget _buildStepOne(String userEmail, String device) {
    return KeyedSubtree(
      key: const ValueKey<int>(1),
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Trying to sign in from another computer?',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1F1F1F),
                      letterSpacing: -0.3,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildAccountPill(userEmail),
                  const SizedBox(height: 32),
                  _buildMetaItem('Device', device),
                  const SizedBox(height: 20),
                  _buildMetaItem('Near', 'Mumbai, Maharashtra'),
                  const SizedBox(height: 20),
                  _buildMetaItem('Time', 'Just now'),
                ],
              ),
            ),
          ),

          // Bottom Action Row: 'NO' and 'YES' (Matching Reference Image 1)
          Container(
            padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).padding.bottom + 20),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFF1F5F9), width: 1)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF1F1F1F),
                      side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.4),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                    onPressed: () {
                      HapticFeedback.heavyImpact();
                      widget.onReject();
                    },
                    child: const Text(
                      'NO',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 0.5),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A73E8),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      setState(() => _currentStep = 2);
                    },
                    child: const Text(
                      'YES',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Step 2: Which number do you see on your other screen? (Ref Image 1 Phone Screen 2) ──
  Widget _buildStepTwo(String userEmail, List<dynamic> opts) {
    return KeyedSubtree(
      key: const ValueKey<int>(2),
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Which number do you see on your other screen?',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1F1F1F),
                      letterSpacing: -0.3,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildAccountPill(userEmail),
                  const SizedBox(height: 24),
                  const Text(
                    'This extra step helps KAVACH make sure it’s really you.',
                    style: TextStyle(
                      fontSize: 13.5,
                      color: Color(0xFF5F6368),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 48),

                  // 3 Circular / Rounded Number Pills
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: opts.map((opt) {
                      final n = int.tryParse(opt.toString()) ?? 0;
                      return Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(40),
                          onTap: () {
                            HapticFeedback.heavyImpact();
                            widget.onNumberSelected(n);
                          },
                          child: Container(
                            width: 76,
                            height: 76,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x0A000000),
                                  blurRadius: 10,
                                  offset: Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                '$n',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1F1F1F),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),

          // Bottom 'CANCEL' link (Matching Reference Image 1)
          Container(
            padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).padding.bottom + 20),
            alignment: Alignment.center,
            child: TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                widget.onReject();
              },
              child: const Text(
                'CANCEL',
                style: TextStyle(
                  color: Color(0xFF1A73E8),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
