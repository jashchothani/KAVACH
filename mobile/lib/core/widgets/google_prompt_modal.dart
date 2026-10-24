import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Ultra-Modern Google-Style 2-Digit Number Match Prompt Modal.
/// Automatically pops up over the active mobile screen when a desktop sign-in
/// challenge is detected, providing instant haptic alerts and one-tap approval.
class GooglePromptModal extends StatelessWidget {
  final Map<String, dynamic> challenge;
  final ValueChanged<int> onNumberSelected;
  final VoidCallback onReject;

  const GooglePromptModal({
    super.key,
    required this.challenge,
    required this.onNumberSelected,
    required this.onReject,
  });

  /// Presents the Google-style modal bottom sheet with immediate tactile haptic feedback.
  static Future<void> show({
    required BuildContext context,
    required Map<String, dynamic> challenge,
    required ValueChanged<int> onNumberSelected,
    required VoidCallback onReject,
  }) async {
    // Immediate tactile feedback to alert user
    HapticFeedback.heavyImpact();
    Future.delayed(const Duration(milliseconds: 150), () => HapticFeedback.heavyImpact());
    Future.delayed(const Duration(milliseconds: 320), () => HapticFeedback.vibrate());

    return showModalBottomSheet<void>(
      context: context,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => GooglePromptModal(
        challenge: challenge,
        onNumberSelected: (n) {
          Navigator.of(ctx, rootNavigator: true).pop();
          onNumberSelected(n);
        },
        onReject: () {
          Navigator.of(ctx, rootNavigator: true).pop();
          onReject();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final opts = (challenge['options'] as List<dynamic>?) ?? [19, 74, 83];
    final device = challenge['device']?.toString() ?? 'Desktop PC / Browser';
    final ip = challenge['ip']?.toString() ?? '192.168.1.105';
    final user = challenge['username']?.toString() ?? '';

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF38BDF8).withValues(alpha: 0.25),
            blurRadius: 32,
            spreadRadius: 4,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).padding.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag indicator bar
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),

          // Security Shield Badge & Title
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0284C7), Color(0xFF0EA5E9)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF38BDF8).withValues(alpha: 0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(Icons.shield_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(color: Color(0xFF10B981), blurRadius: 6),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          'KAVACH 2FA PROMPT',
                          style: TextStyle(
                            color: Color(0xFF38BDF8),
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      'Is it you trying to sign in?',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Attempt Details Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B).withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.computer_rounded, color: Color(0xFF94A3B8), size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        device,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'JUST NOW',
                        style: TextStyle(color: Color(0xFF38BDF8), fontSize: 9.5, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.language_rounded, color: Color(0xFF94A3B8), size: 18),
                    const SizedBox(width: 10),
                    Text(
                      'IP: $ip',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                    if (user.isNotEmpty) ...[
                      const Spacer(),
                      Text(
                        'User: $user',
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Prompt Instruction
          const Center(
            child: Text(
              'Tap the matching 2-digit number shown on your computer screen:',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFFE2E8F0),
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                height: 1.35,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 3 Big Google-Style Number Option Buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: opts.map((opt) {
              final n = int.tryParse(opt.toString()) ?? 0;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        HapticFeedback.selectionClick();
                        onNumberSelected(n);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1E293B), Color(0xFF334155)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.6), width: 1.8),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF38BDF8).withValues(alpha: 0.2),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            '$n',
                            style: const TextStyle(
                              color: Color(0xFF38BDF8),
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // "No, it's not me" Reject Button
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFF87171),
              side: BorderSide(color: const Color(0xFFEF4444).withValues(alpha: 0.4)),
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              HapticFeedback.heavyImpact();
              onReject();
            },
            icon: const Icon(Icons.block_rounded, size: 18),
            label: const Text(
              "No, it's not me (Deny Sign-In)",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
            ),
          ),
        ],
      ),
    );
  }
}
