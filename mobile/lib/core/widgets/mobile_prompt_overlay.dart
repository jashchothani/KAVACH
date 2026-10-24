import 'dart:async';
import 'package:flutter/material.dart';

import '../services/api_service.dart';
import 'google_prompt_modal.dart';

/// Global App-Wide Overlay Listener that monitors for pending desktop login challenges
/// and automatically presents the Google-Style 2-Digit Verification Modal over any active screen.
class MobilePromptOverlay extends StatefulWidget {
  final Widget child;

  const MobilePromptOverlay({super.key, required this.child});

  @override
  State<MobilePromptOverlay> createState() => _MobilePromptOverlayState();
}

class _MobilePromptOverlayState extends State<MobilePromptOverlay> {
  Timer? _pollTimer;
  bool _isModalShowing = false;
  String? _activeChallengeId;
  BuildContext? _modalContext;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _checkPendingChallenge();
    // Poll every 1.5 seconds for instantaneous prompt appearance
    _pollTimer = Timer.periodic(const Duration(milliseconds: 1500), (_) {
      if (mounted) _checkPendingChallenge();
    });
  }

  Future<void> _checkPendingChallenge() async {
    try {
      final res = await ApiService.instance.getPendingMobileChallenge();
      if (!mounted) return;

      if (res['has_pending'] == true) {
        final chId = res['challenge_id']?.toString() ?? '';
        if (!_isModalShowing && chId.isNotEmpty && chId != _activeChallengeId) {
          _activeChallengeId = chId;
          _showGooglePrompt(res);
        }
      } else {
        // If challenge was resolved or expired, close the active modal
        if (_isModalShowing && _modalContext != null) {
          if (Navigator.of(_modalContext!, rootNavigator: true).canPop()) {
            Navigator.of(_modalContext!, rootNavigator: true).pop();
          }
          _isModalShowing = false;
          _activeChallengeId = null;
          _modalContext = null;
        }
      }
    } catch (_) {}
  }

  void _showGooglePrompt(Map<String, dynamic> challenge) {
    if (!mounted) return;
    _isModalShowing = true;
    final chId = challenge['challenge_id']?.toString() ?? '';

    // Use current context to show modal bottom sheet
    GooglePromptModal.show(
      context: context,
      challenge: challenge,
      onNumberSelected: (n) => _handleVerify(chId, n),
      onReject: () => _handleVerify(chId, -1),
    ).then((_) {
      if (mounted) {
        _isModalShowing = false;
      }
    });
  }

  Future<void> _handleVerify(String chId, int chosenNumber) async {
    try {
      final res = await ApiService.instance.verifyMobileChallenge(
        challengeId: chId,
        chosenNumber: chosenNumber,
      );
      if (!mounted) return;

      _isModalShowing = false;
      _activeChallengeId = null;

      final ok = res['success'] == true;
      final msg = res['message']?.toString() ??
          (chosenNumber == -1
              ? 'Desktop sign-in attempt blocked.'
              : ok
                  ? '✓ Desktop Sign-in Approved! Your computer is now signed in.'
                  : 'Incorrect match number. Sign-in denied.');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: ok ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          duration: const Duration(seconds: 4),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _isModalShowing = false;
      _activeChallengeId = null;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Verification failed: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
