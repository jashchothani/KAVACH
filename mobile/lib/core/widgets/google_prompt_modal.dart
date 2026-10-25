import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Ultra-Modern Google-Style Full-Page Sign-In Verification Screen (Reference Image 4).
/// Completely Light Themed, pure white backdrop, professional typography,
/// device telemetry details, and instant one-tap 'Yes, it's me' / 'No, don't allow' actions.
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

  /// Presents the Google-style verification screen as a full-page modal with tactile haptic feedback.
  static Future<void> show({
    required BuildContext context,
    required Map<String, dynamic> challenge,
    required ValueChanged<int> onNumberSelected,
    required VoidCallback onReject,
  }) async {
    // Tactile alert haptics
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

  @override
  Widget build(BuildContext context) {
    final opts = (challenge['options'] as List<dynamic>?) ?? [19, 74, 83];
    final device = challenge['device']?.toString() ?? 'Windows 11 Workstation · Chrome';
    final user = challenge['username']?.toString() ?? '';
    final userEmail = challenge['email']?.toString() ??
        (user.isNotEmpty ? '$user@kavachcybertech.in' : 'user@kavachcybertech.in');
    final matchNumber = challenge['match_number']?.toString() ??
        (opts.isNotEmpty ? opts[0].toString() : '1');

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
                      onReject();
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
                  const SizedBox(width: 48), // Balance spacing with close button
                ],
              ),
            ),

            const Divider(color: Color(0xFFF1F5F9), height: 1, thickness: 1),

            // Main Content Area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Are you trying to sign in?',
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F1F1F),
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // User Account Avatar & Email Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor: const Color(0xFF8B1A1A),
                            child: Text(
                              (userEmail.isNotEmpty ? userEmail[0] : 'K').toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Flexible(
                            child: Text(
                              userEmail,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF334155),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Device Telemetry Details (Reference Image 4)
                    _buildMetaItem('Device', device),
                    const SizedBox(height: 20),
                    _buildMetaItem('Near', 'Mumbai, Maharashtra'),
                    const SizedBox(height: 20),
                    _buildMetaItem('Time', 'Just now'),

                    const SizedBox(height: 28),

                    // Google 2-Digit Number Matching Option
                    if (opts.isNotEmpty) ...[
                      const Text(
                        'Tap the matching number shown on your screen:',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 14),
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
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: const Color(0xFFCBD5E1),
                                        width: 1.5,
                                      ),
                                      boxShadow: const [
                                        BoxShadow(
                                          color: Color(0x06000000),
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
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF0F172A),
                                          letterSpacing: 1.0,
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
                    ],
                  ],
                ),
              ),
            ),

            // Bottom Action Buttons: '✕ No, don't allow' & '✓ Yes, it's me'
            Container(
              padding: EdgeInsets.fromLTRB(20, 14, 20, MediaQuery.of(context).padding.bottom + 16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFF1F5F9), width: 1)),
              ),
              child: Row(
                children: [
                  // '✕ No, don't allow'
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0F172A),
                        side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      ),
                      onPressed: () {
                        HapticFeedback.heavyImpact();
                        onReject();
                      },
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.close_rounded, size: 18, color: Color(0xFF64748B)),
                          SizedBox(width: 6),
                          Text(
                            "No, don't allow",
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // '✓ Yes, it's me' (One-tap verified approval)
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        shadowColor: const Color(0x3310B981),
                      ),
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        final matchN = int.tryParse(matchNumber) ?? 1;
                        onNumberSelected(matchN);
                      },
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_rounded, size: 18, color: Colors.white),
                          SizedBox(width: 6),
                          Text(
                            "Yes, it's me",
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
