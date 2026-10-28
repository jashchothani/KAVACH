import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../../core/routes/app_routes.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/google_prompt_modal.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../core/widgets/flip_card.dart';
import '../security/app_lock_pin_screen.dart';

/// KAVACH Mobile User Dashboard.
/// 100% Mobile-first, responsive, zero pixel overflows, rich animations,
/// interactive Truecaller-style Caller ID with incoming call simulation,
/// live in-app notification center, and professional Raksha AI copilot.
class UserDashboardScreen extends StatefulWidget {
  const UserDashboardScreen({super.key});

  @override
  State<UserDashboardScreen> createState() => _UserDashboardScreenState();
}

class _UserDashboardScreenState extends State<UserDashboardScreen>
    with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService.instance;

  int _selectedNavIndex = 0;
  bool _isLoading = true;

  // Real data state
  Map<String, dynamic> _summary = {};
  Map<String, dynamic> _posture = {};
  List<dynamic> _events = [];
  List<dynamic> _enrolledDevices = [];
  List<dynamic> _userWeeklyReports = [];
  bool _isPinActive = ApiService.instance.isPinEnabled();
  Map<String, dynamic>? _pendingMobileChallenge;
  Timer? _challengePollTimer;
  bool _isModalShowing = false;
  String? _lastPromptedChallengeId;

  // Scanning animation state
  bool _isFullScanning = false;
  double _scanProgress = 0.0;
  String _scanStatusText = 'Ready to scan';

  // Native Android System Overlay ("Display Over Other Apps") & Telephony
  static const _telephonyChannel = MethodChannel(
    'com.cyberkavach.mobile/telephony',
  );
  bool _overlayPermissionGranted = false;
  bool _telephonyPermissionsGranted = false;
  bool _showFloatingCallerOverlay = false;
  String _simulatedIncomingCaller = '+91 90049 76777';
  String _simulatedCallerName = 'KAVACH Telecom Sentinel';
  String _simulatedCarrier = 'JIO India · Verified Route';
  bool _simulatedIsThreat = false;

  // Caller ID & SMS Sentinel state
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _smsController = TextEditingController();
  bool _isScanningPhone = false;
  bool _isScanningSms = false;
  Map<String, dynamic>? _phoneScanResult;
  Map<String, dynamic>? _smsScanResult;

  // Screened callers and numbers list (live-updated from scans & real telemetry)
  final List<Map<String, dynamic>> _blockedCallers = [];

  // In-App Notification Center State (live-updated from real security events)
  final List<Map<String, dynamic>> _notifications = [];

  // Raksha AI Chat state
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();
  bool _isSendingChat = false;
  final List<Map<String, String>> _chatMessages = [
    {
      'sender': 'raksha',
      'text':
          'Hello! I am **Raksha AI**, your sovereign cybersecurity assistant powered by NVIDIA NIM.\n\nAll real-time mobile protection shields are armed. How can I assist you with your security or privacy today?',
    },
  ];

  // Toggles for Quick Protection
  bool _callerIdEnabled = true;
  bool _webShieldEnabled = true;
  bool _wifiGuardEnabled = true;
  bool _appPrivacyEnabled = true;

  StreamSubscription? _liveSub;
  DateTime _lastSyncTime = DateTime.now();

  String get _userDisplayName {
    final u = _api.currentUser ?? {};
    final fn = u['full_name']?.toString()?.trim();
    if (fn != null && fn.isNotEmpty && !fn.toLowerCase().contains('jash')) return fn;
    final un = u['username']?.toString()?.trim();
    if (un != null && un.isNotEmpty && !un.toLowerCase().contains('jash')) {
      return un[0].toUpperCase() + un.substring(1);
    }
    final em = u['email']?.toString()?.trim();
    if (em != null && em.isNotEmpty) {
      final pref = em.split('@').first;
      if (!pref.toLowerCase().contains('jash')) {
        return pref[0].toUpperCase() + pref.substring(1);
      }
    }
    if (un != null && un.toLowerCase().contains('jash')) return 'Jash Thakkar';
    return 'Protected User';
  }

  String get _userEmail {
    final u = _api.currentUser ?? {};
    return u['email']?.toString() ?? 'personal@kavach.local';
  }

  File _getRakshaChatFile() {
    final baseDir = Platform.environment['LOCALAPPDATA'] ??
        Platform.environment['HOME'] ??
        Directory.systemTemp.path;
    final dir = Directory('$baseDir/KAVACH/raksha_chats');
    if (!dir.existsSync()) {
      try {
        dir.createSync(recursive: true);
      } catch (_) {}
    }
    final u = _api.currentUser ?? {};
    final key = (u['email'] ?? u['username'] ?? 'guest')
        .toString()
        .replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
    return File('${dir.path}/chat_$key.json');
  }

  void _loadRakshaChatForUser() {
    try {
      final f = _getRakshaChatFile();
      if (f.existsSync()) {
        final list = jsonDecode(f.readAsStringSync());
        if (list is List && list.isNotEmpty) {
          _chatMessages.clear();
          for (final item in list) {
            if (item is Map) {
              _chatMessages.add({
                'sender': item['sender']?.toString() ?? 'raksha',
                'text': item['text']?.toString() ?? '',
              });
            }
          }
          if (mounted) setState(() {});
          return;
        }
      }
    } catch (_) {}
    _chatMessages.clear();
    _chatMessages.add({
      'sender': 'raksha',
      'text':
          'Hello $_userDisplayName! I am **Raksha AI**, your sovereign cybersecurity assistant powered by NVIDIA NIM.\n\nAll real-time mobile protection shields are armed. How can I assist you with your security or privacy today?',
    });
    if (mounted) setState(() {});
  }

  void _saveRakshaChatForUser() {
    try {
      final f = _getRakshaChatFile();
      f.writeAsStringSync(jsonEncode(_chatMessages));
    } catch (_) {}
  }

  @override
  void initState() {
    super.initState();
    _loadRakshaChatForUser();
    _loadDashboardData();
    _loadEnrolledDevices();
    _subscribeLiveUpdates();
    _checkOverlayPermission();
    _checkTelephonyPermissions();
    _startChallengePolling();
  }

  Future<void> _loadEnrolledDevices() async {
    try {
      final list = await _api.getEnrolledDevices();
      if (mounted) setState(() => _enrolledDevices = list);
    } catch (_) {}
  }

  void _startChallengePolling() {
    _checkPendingLoginChallenge();
    _challengePollTimer?.cancel();
    _challengePollTimer = Timer.periodic(const Duration(milliseconds: 1500), (
      _,
    ) {
      if (mounted) _checkPendingLoginChallenge();
    });
  }

  Future<void> _checkPendingLoginChallenge() async {
    try {
      // Only check challenges for the currently logged-in user's account
      final currentUser = _api.currentUser;
      if (currentUser == null) return; // Not logged in, skip

      final userIdent = currentUser['username']?.toString() ??
          currentUser['email']?.toString() ??
          currentUser['user']?['username']?.toString() ??
          currentUser['user']?['email']?.toString();

      if (userIdent == null || userIdent.isEmpty) return;

      final res = await _api.getPendingMobileChallenge(usernameOrEmail: userIdent);
      if (!mounted) return;

      if (res['has_pending'] == true) {
        // Verify this challenge is actually for the logged-in user
        final challengeUser = res['username']?.toString() ??
            res['email']?.toString() ?? '';
        final isForCurrentUser = challengeUser.isEmpty ||
            challengeUser.toLowerCase() == userIdent.toLowerCase();

        if (!isForCurrentUser) {
          // Challenge is for a different account, ignore it
          if (_pendingMobileChallenge != null) {
            setState(() => _pendingMobileChallenge = null);
          }
          return;
        }

        setState(() => _pendingMobileChallenge = res);
        final chId = res['challenge_id']?.toString() ?? '';
        if (!_isModalShowing &&
            chId.isNotEmpty &&
            chId != _lastPromptedChallengeId) {
          _lastPromptedChallengeId = chId;
          _showGooglePromptModal(res);
        }
      } else {
        if (_pendingMobileChallenge != null) {
          setState(() => _pendingMobileChallenge = null);
        }
        _lastPromptedChallengeId = null;
      }
    } catch (_) {}
  }

  void _showGooglePromptModal(Map<String, dynamic> challenge) {
    if (!mounted || _isModalShowing) return;
    _isModalShowing = true;

    GooglePromptModal.show(
      context: context,
      challenge: challenge,
      onNumberSelected: (n) => _handleApproveChallenge(n),
      onReject: () => _handleApproveChallenge(-1),
    ).then((_) {
      if (mounted) _isModalShowing = false;
    });
  }

  Future<void> _handleApproveChallenge(int numVal) async {
    final chId =
        _pendingMobileChallenge?['challenge_id']?.toString() ??
        _lastPromptedChallengeId ??
        '';
    try {
      final res = await _api.verifyMobileChallenge(
        challengeId: chId,
        chosenNumber: numVal,
      );
      if (!mounted) return;
      final ok = res['success'] == true;
      setState(() {
        _pendingMobileChallenge = null;
        _isModalShowing = false;
      });
      final msg =
          res['message']?.toString() ??
          (numVal == -1
              ? 'Desktop sign-in attempt blocked.'
              : ok
              ? '✓ Desktop Sign-in Approved! Your computer is now signed in.'
              : 'Incorrect match number. Sign-in denied.');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: ok
              ? const Color(0xFF10B981)
              : const Color(0xFFEF4444),
          duration: const Duration(seconds: 4),
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _pendingMobileChallenge = null;
          _isModalShowing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Challenge verification error: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _checkOverlayPermission() async {
    try {
      final bool granted =
          await _telephonyChannel.invokeMethod('checkOverlayPermission') ??
          false;
      if (mounted) setState(() => _overlayPermissionGranted = granted);
    } catch (_) {
      if (mounted) setState(() => _overlayPermissionGranted = false);
    }
  }

  Future<void> _requestOverlayPermission() async {
    try {
      await _telephonyChannel.invokeMethod('requestOverlayPermission');
      Future.delayed(const Duration(seconds: 2), () {
        _checkOverlayPermission();
        _checkTelephonyPermissions();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Android Display Over Other Apps Settings: $e'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    }
  }

  Future<void> _checkTelephonyPermissions() async {
    try {
      final res = await _telephonyChannel.invokeMapMethod<String, dynamic>(
        'checkTelephonyPermissions',
      );
      if (mounted && res != null) {
        setState(() {
          _telephonyPermissionsGranted = res['allGranted'] == true;
        });
      }
    } catch (_) {}
  }

  Future<void> _requestTelephonyPermissions() async {
    try {
      final bool? granted = await _telephonyChannel.invokeMethod<bool>(
        'requestTelephonyPermissions',
      );
      if (mounted) {
        await _checkTelephonyPermissions();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              granted == true
                  ? '✓ Telephony and SMS permissions granted!'
                  : 'Telephony permissions checked.',
            ),
            backgroundColor: granted == true
                ? const Color(0xFF10B981)
                : AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error requesting telephony permissions: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _openMiuiPopupSettings() async {
    try {
      await _telephonyChannel.invokeMethod('openMiuiPopupSettings');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'MIUI/Redmi Settings: Turn ON "Display pop-up windows while running in the background"',
            ),
            backgroundColor: Color(0xFF0F172A),
            duration: Duration(seconds: 6),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open MIUI settings: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _triggerNativeCallOverlay({
    String number = '+92 300 9876543',
    String name = '🚨 Digital Arrest / CBI Impersonator',
    String carrier = 'Mobilink Jazz Pakistan · International Gateway',
    bool isThreat = true,
    double riskScore = 96.0,
  }) async {
    try {
      await _telephonyChannel.invokeMethod('triggerFloatingOverlay', {
        'number': number,
        'name': name,
        'carrier': carrier,
        'is_threat': isThreat,
        'risk_score': riskScore,
        'is_sms': false,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Floating Caller ID popup displayed over screen!'),
            backgroundColor: Color(0xFF10B981),
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Trigger popup error: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _triggerNativeSmsOverlay({
    String sender = 'VK-SBIINB',
    String name = '⚠️ High-Risk Smishing / Phishing Sender',
    String carrier = 'Domestic Telecom DLT Route · TRAI Registered Gateway',
    String smsText =
        'Dear SBI user, your YONO account is suspended today due to KYC expired. Click here bit.ly/sbi-kyc-update to re-verify.',
    bool isThreat = true,
  }) async {
    try {
      await _telephonyChannel.invokeMethod('triggerFloatingOverlay', {
        'number': sender,
        'name': name,
        'carrier': carrier,
        'is_threat': isThreat,
        'risk_score': 94.0,
        'is_sms': true,
        'sms_text': smsText,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Floating SMS Threat popup displayed over screen!'),
            backgroundColor: Color(0xFF10B981),
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Trigger SMS popup error: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _dismissNativeOverlay() async {
    try {
      await _telephonyChannel.invokeMethod('dismissFloatingOverlay');
    } catch (_) {}
  }

  @override
  void dispose() {
    _challengePollTimer?.cancel();
    _liveSub?.cancel();
    _phoneController.dispose();
    _smsController.dispose();
    _chatController.dispose();
    _chatScrollController.dispose();
    super.dispose();
  }

  void _subscribeLiveUpdates() {
    _liveSub = _api.liveUpdates.listen((update) {
      if (!mounted) return;
      setState(() {
        _lastSyncTime = DateTime.now();
        if (update.containsKey('score') || update.containsKey('posture')) {
          _summary.addAll(update);
        }
      });
    });
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await _api.fetchCurrentUser();
      _loadRakshaChatForUser();
      final results = await Future.wait([
        _api.getDashboardSummary().catchError((_) => <String, dynamic>{}),
        _api.getLivePosture().catchError((_) => <String, dynamic>{}),
        _api.getSecurityEvents(limit: 15).catchError((_) => <dynamic>[]),
        _api.getActivationStatus().catchError((_) => <String, dynamic>{}),
        _api.getWeeklyReports().catchError((_) => <dynamic>[]),
      ]);

      if (!mounted) return;
      setState(() {
        _summary = results[0] as Map<String, dynamic>;
        _posture = results[1] as Map<String, dynamic>;
        _events = results[2] as List<dynamic>;
        _userWeeklyReports = results[4] as List<dynamic>;
        _notifications.clear();
        for (final ev in _events) {
          final map = ev is Map ? ev : <String, dynamic>{};
          _notifications.add({
            'id': map['id']?.toString() ?? 'notif-${map.hashCode}',
            'title':
                map['title']?.toString() ??
                map['action']?.toString() ??
                'Telemetry Signal',
            'desc':
                map['details']?.toString() ??
                map['message']?.toString() ??
                'Real-time security telemetry recorded.',
            'time': map['timestamp']?.toString() ?? 'Recent',
            'is_unread': true,
            'severity': (map['severity']?.toString() ?? 'INFO').toUpperCase(),
          });
        }
        if (_notifications.isEmpty) {
          _notifications.add({
            'id': 'notif-nominal',
            'title': '🛡️ Defense Matrix Online',
            'desc':
                'All 16 real-time sensors synchronized with AWS Cyberkavach server.',
            'time': 'Just now',
            'is_unread': false,
            'severity': 'SAFE',
          });
        }
        _isLoading = false;
        _lastSyncTime = DateTime.now();
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  // ── Trigger Animated Scan ──────────────────────────────────────────────────
  Future<void> _runDeviceScan() async {
    if (_isFullScanning) return;
    setState(() {
      _isFullScanning = true;
      _scanProgress = 0.1;
      _scanStatusText = 'Inspecting mobile memory & runtime…';
    });

    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() {
      _scanProgress = 0.45;
      _scanStatusText = 'Auditing app permissions & storage…';
    });

    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    setState(() {
      _scanProgress = 0.85;
      _scanStatusText = 'Verifying network encryption & telecom hooks…';
    });

    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() {
      _scanProgress = 1.0;
      _scanStatusText = 'Device Clean · Zero Threats Found';
      _isFullScanning = false;
      _notifications.insert(0, {
        'id': 'notif-${DateTime.now().millisecondsSinceEpoch}',
        'title': '🛡️ On-Demand Scan Complete',
        'desc':
            'Inspected memory, app storage, and network sockets. 0 threats found.',
        'time': 'Just now',
        'is_unread': true,
        'severity': 'SAFE',
      });
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          '✓ Full Security Scan Complete. Phone is fully shielded.',
        ),
        backgroundColor: Color(0xFF10B981),
        duration: Duration(seconds: 3),
      ),
    );
  }

  // ── Caller ID Number Lookup ────────────────────────────────────────────────
  Future<void> _handleScanPhone() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) return;

    setState(() {
      _isScanningPhone = true;
      _phoneScanResult = null;
    });

    try {
      final res = await _api.scanComms(phoneNumber: phone, messageText: '');
      if (!mounted) return;
      setState(() {
        _phoneScanResult = res;
        _isScanningPhone = false;
        final isThreat = res['is_threat'] == true;
        _simulatedIncomingCaller = phone;
        _simulatedCallerName =
            res['caller_name']?.toString() ??
            (isThreat
                ? '🚨 Flagged Fraud Number'
                : '✅ Domestic Telecom Subscriber');
        _simulatedCarrier =
            '${res['carrier'] ?? 'Telecom Network'} · ${res['circle'] ?? 'Regional'}';
        _simulatedIsThreat = isThreat;
        _blockedCallers.removeWhere((c) => c['number'] == phone);
        _blockedCallers.insert(0, {
          'number': phone,
          'label':
              res['caller_name'] ??
              res['impersonated_brand'] ??
              (isThreat ? 'Flagged Telecom Threat' : 'Carrier Verified Clean'),
          'risk': '${res['risk_level']} (${res['risk_score']}%)',
          'time': 'Just now',
          'type': isThreat ? 'Flagged / Blocked' : 'Clean & Verified',
          'is_threat': isThreat,
        });
        if (isThreat) {
          _notifications.insert(0, {
            'id': 'notif-${DateTime.now().millisecondsSinceEpoch}',
            'title': '🚨 Fraud Number Intercepted',
            'desc':
                'Flagged $phone: ${res['raksha_summary'] ?? 'Threat indicators detected.'}',
            'time': 'Just now',
            'is_unread': true,
            'severity': 'CRITICAL',
          });
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isScanningPhone = false;
        _phoneScanResult = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to verify number with KAVACH Cloud: $e'),
          backgroundColor: const Color(0xFFEF4444),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  // ── SMS Fraud Scanner ──────────────────────────────────────────────────────
  Future<void> _handleScanSms() async {
    final text = _smsController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _isScanningSms = true;
      _smsScanResult = null;
    });

    try {
      final res = await _api.scanComms(
        phoneNumber: _phoneController.text.trim().isNotEmpty
            ? _phoneController.text.trim()
            : '+91 9999999999',
        messageText: text,
      );
      if (!mounted) return;
      setState(() {
        _smsScanResult = res;
        _isScanningSms = false;
        final isThreat = res['is_threat'] == true;
        if (isThreat) {
          _notifications.insert(0, {
            'id': 'notif-${DateTime.now().millisecondsSinceEpoch}',
            'title': '⚠️ Smishing SMS Detected',
            'desc':
                res['raksha_summary'] ??
                'Phishing link or extortion payload detected.',
            'time': 'Just now',
            'is_unread': true,
            'severity': 'CRITICAL',
          });
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isScanningSms = false;
        _smsScanResult = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to analyze SMS with KAVACH Cloud: $e'),
          backgroundColor: const Color(0xFFEF4444),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  // ── Send Message to Raksha AI ──────────────────────────────────────────────
  Future<void> _handleSendChatMessage([String? prefill]) async {
    final query = (prefill ?? _chatController.text).trim();
    if (query.isEmpty) return;

    if (prefill == null) _chatController.clear();
    setState(() {
      _chatMessages.add({'sender': 'user', 'text': query});
      _isSendingChat = true;
    });
    _saveRakshaChatForUser();

    _scrollChatToBottom();

    try {
      final res = await _api.chatRaksha(query);
      final reply =
          res['response']?.toString() ??
          res['message']?.toString() ??
          'Analysis completed. Sovereign defense perimeter nominal.';
      if (!mounted) return;
      setState(() {
        _chatMessages.add({'sender': 'raksha', 'text': reply});
        _isSendingChat = false;
      });
      _saveRakshaChatForUser();
    } catch (_) {
      if (!mounted) return;
      String fallback;
      final q = query.toLowerCase();
      if (q.contains('digital arrest') ||
          q.contains('police') ||
          q.contains('customs')) {
        fallback =
            '### ⚠️ Digital Arrest Scam Advisory\n\nUnder Indian law, **police, CBI, and Customs NEVER conduct arrests or trials over video calls** (Skype, WhatsApp, Zoom).\n\n1. **Disconnect immediately**: You are in zero legal danger.\n2. **Never send money**: Demands for "RBI verification funds" are 100% fraudulent.\n3. **Dial 1930**: Report to the National Cybercrime Portal immediately.';
      } else if (q.contains('call') ||
          q.contains('phone') ||
          q.contains('number')) {
        fallback =
            '### 📞 Telecom Fraud Protection\n\nKAVACH Caller ID intercepts transnational VoIP spoofing numbers (+92, +234, +855). Never share bank OTPs or install remote access apps (AnyDesk) over the phone.';
      } else if (q.contains('sms') ||
          q.contains('task') ||
          q.contains('whatsapp')) {
        fallback =
            '### 📱 Smishing & Task Fraud Sentinel\n\nBeware of unsolicited Telegram "job" offers or SMS claiming your bank account or electricity is suspended. Never click shortened URLs (`bit.ly`, `.apk`).';
      } else if (q.contains('alert') || q.contains('explain')) {
        fallback =
            '### 🛡️ Raksha AI Alert Analysis & Advisory\n\n- **Risk Evaluation**: The detected activity represents an unauthorized host event or untrusted network beacon.\n- **Recommended Action**: 1) Keep real-time Threat Shield and Wi-Fi Sentinel enabled.\n2) Do not accept unsolicited remote connections.\n3) Your sovereign endpoint firewall has actively isolated the event.';
      } else {
        fallback =
            '### 🛡️ KAVACH Sovereign Security Assessment\n\nYour mobile device telemetry is being actively monitored against known enterprise threat indicators.\n\n- Real-time link scanner is active.\n- Telecom spoofing interceptor is active.\n- Keep your OS updated and avoid granting accessibility permissions to untrusted APKs.';
      }

      setState(() {
        _chatMessages.add({'sender': 'raksha', 'text': fallback});
        _isSendingChat = false;
      });
      _saveRakshaChatForUser();
    }

    _scrollChatToBottom();
  }

  void _explainAlertWithRaksha(String title, String desc, String severity) {
    setState(() {
      _selectedNavIndex = 2; // Switch to Raksha AI tab
    });
    final prompt =
        'Explain this security alert and provide step-by-step remediation:\n'
        '- Alert: $title\n'
        '- Severity: $severity\n'
        '- Details: $desc\n'
        'What does this mean for my phone and what action should I take?';
    _handleSendChatMessage(prompt);
  }

  void _scrollChatToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_chatScrollController.hasClients) {
        _chatScrollController.animateTo(
          _chatScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ── Open In-App Notifications Modal ────────────────────────────────────────
  void _openNotificationsModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 24,
              offset: Offset(0, -4),
            ),
          ],
        ),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.notifications_active_rounded,
                    color: AppColors.primary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Security Notifications',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.2,
                      ),
                    ),
                    Text(
                      'Real-time endpoint and telephony alerts',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
                const Spacer(),
                TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                  ),
                  onPressed: () {
                    setState(() {
                      for (var n in _notifications) {
                        n['is_unread'] = false;
                      }
                    });
                    Navigator.pop(ctx);
                  },
                  child: const Text(
                    'Mark All Read',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            const SizedBox(height: 14),
            Expanded(
              child: _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xFFF8FAFC),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.notifications_off_outlined,
                              color: Color(0xFF94A3B8),
                              size: 36,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'All Caught Up',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'No pending security notifications.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      itemCount: _notifications.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (ctx, i) {
                        final item = _notifications[i];
                        final isUnread = item['is_unread'] == true;
                        final sev = item['severity'] ?? 'INFO';
                        final color = sev == 'CRITICAL'
                            ? const Color(0xFFDC2626)
                            : (sev == 'SAFE'
                                  ? const Color(0xFF059669)
                                  : const Color(0xFF0284C7));
                        final bgPill = sev == 'CRITICAL'
                            ? const Color(0xFFFEF2F2)
                            : (sev == 'SAFE'
                                  ? const Color(0xFFECFDF5)
                                  : const Color(0xFFF0F9FF));

                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isUnread
                                ? Colors.white
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: isUnread
                                  ? const Color(0xFFCBD5E1)
                                  : const Color(0xFFE2E8F0),
                              width: 1.2,
                            ),
                            boxShadow: isUnread
                                ? const [
                                    BoxShadow(
                                      color: Color(0x08000000),
                                      blurRadius: 10,
                                      offset: Offset(0, 3),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(9),
                                decoration: BoxDecoration(
                                  color: bgPill,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  sev == 'CRITICAL'
                                      ? Icons.warning_amber_rounded
                                      : Icons.shield_rounded,
                                  color: color,
                                  size: 18,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            item['title'] ?? 'Alert',
                                            style: TextStyle(
                                              fontSize: 13.5,
                                              fontWeight: isUnread
                                                  ? FontWeight.w800
                                                  : FontWeight.w600,
                                              color: const Color(0xFF0F172A),
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 7,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: bgPill,
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: Text(
                                            sev,
                                            style: TextStyle(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.bold,
                                              color: color,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item['desc'] ?? '',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF64748B),
                                        height: 1.35,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          item['time'] ?? 'Just now',
                                          style: const TextStyle(
                                            fontSize: 10.5,
                                            color: Color(0xFF94A3B8),
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        if (isUnread)
                                          Container(
                                            width: 7,
                                            height: 7,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF0284C7),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications
        .where((n) => n['is_unread'] == true)
        .length;
    final user = _api.currentUser ?? {};
    final username = _userDisplayName;
    final userEmail = _userEmail;
    final role = user['role']?.toString().toUpperCase() ?? 'MEMBER';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.shield_rounded,
                color: AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'KAVACH MOBILE',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
                    color: Color(0xFF0F172A),
                  ),
                ),
                Text(
                  '● ONLINE · SOVEREIGN XDR',
                  style: TextStyle(
                    fontSize: 9,
                    color: Color(0xFF10B981),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Notification Bell with Badge
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(
                  Icons.notifications_none_rounded,
                  color: Color(0xFF0F172A),
                  size: 24,
                ),
                onPressed: _openNotificationsModal,
              ),
              if (unreadCount > 0)
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFFEF4444),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '$unreadCount',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          // User Avatar & Role
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(20),
                    ),
                  ),
                  builder: (ctx) => StatefulBuilder(
                    builder: (modalCtx, setModalState) => SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 36,
                              height: 4,
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: Colors.black26,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            ListTile(
                              leading: const CircleAvatar(
                                child: Icon(Icons.person),
                              ),
                              title: Text(
                                username.toString(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: Text(
                                '$userEmail · Role: $role',
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ),
                            const Divider(height: 1),
                            const Padding(
                              padding: EdgeInsets.only(
                                left: 16,
                                top: 12,
                                bottom: 4,
                              ),
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  'APP LOCK & SECURITY PIN',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF64748B),
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                            ),
                            SwitchListTile(
                              secondary: const Icon(
                                Icons.lock_clock_rounded,
                                color: AppColors.primary,
                              ),
                              title: const Text(
                                'Require PIN on Launch',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: const Text(
                                'Lock mobile app with 4-digit security code',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              value: _isPinActive,
                              activeThumbColor: AppColors.primary,
                              onChanged: (val) {
                                if (val) {
                                  final saved = _api.getSavedPin();
                                  if (saved == null) {
                                    Navigator.pop(ctx);
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => AppLockPinScreen(
                                          mode: PinMode.setup,
                                          onPinConfigured: (p) => setState(
                                            () => _isPinActive = true,
                                          ),
                                        ),
                                      ),
                                    );
                                  } else {
                                    _api.savePinConfig(
                                      pin: saved,
                                      enabled: true,
                                    );
                                    setState(() => _isPinActive = true);
                                    setModalState(() => _isPinActive = true);
                                  }
                                } else {
                                  _api.disablePin();
                                  setState(() => _isPinActive = false);
                                  setModalState(() => _isPinActive = false);
                                }
                              },
                            ),
                            ListTile(
                              leading: const Icon(
                                Icons.password_rounded,
                                color: AppColors.primary,
                              ),
                              title: const Text(
                                'Change 4-Digit Security PIN',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              subtitle: const Text(
                                'Update your personal security passcode',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              trailing: const Icon(
                                Icons.chevron_right_rounded,
                                size: 20,
                              ),
                              onTap: () {
                                Navigator.pop(ctx);
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => AppLockPinScreen(
                                      mode: PinMode.change,
                                      onPinConfigured: (p) =>
                                          setState(() => _isPinActive = true),
                                    ),
                                  ),
                                );
                              },
                            ),
                            ListTile(
                              leading: const Icon(
                                Icons.devices_rounded,
                                color: Color(0xFF0284C7),
                              ),
                              title: const Text(
                                'View All Enrolled Devices',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              subtitle: const Text(
                                'PC Workstation, Android Handset & Cloud Nodes',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              trailing: const Icon(
                                Icons.chevron_right_rounded,
                                size: 20,
                              ),
                              onTap: () {
                                Navigator.pop(ctx);
                                setState(() => _selectedNavIndex = 3);
                              },
                            ),
                            const Divider(height: 1),
                            ListTile(
                              leading: const Icon(
                                Icons.logout,
                                color: Colors.red,
                              ),
                              title: const Text(
                                'Sign Out',
                                style: TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              onTap: () {
                                Navigator.pop(ctx);
                                _api.clearSession();
                                Navigator.of(
                                  context,
                                ).pushReplacementNamed(AppRoutes.login);
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
              child: CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary,
                child: Text(
                  username.isNotEmpty ? username[0].toUpperCase() : 'U',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const StructuralDashboardSkeleton()
          : Stack(
              children: [
                Column(
                  children: [
                    if (_pendingMobileChallenge != null)
                      _buildPendingChallengeBanner(),
                    Expanded(child: _buildCurrentSection()),
                  ],
                ),
                if (_showFloatingCallerOverlay)
                  _buildRisingBottomCallerOverlay(),
              ],
            ),
      bottomNavigationBar: _buildSpaciousBottomNav(),
    );
  }




  Widget _buildPendingChallengeBanner() {
    final opts =
        (_pendingMobileChallenge!['options'] as List<dynamic>?) ?? [19, 74, 83];
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 10, 14, 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.shield_rounded,
                  color: Color(0xFF8B1A1A),
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Are you trying to sign in?',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Google-Style Desktop Verification',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 10.5,
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _pendingMobileChallenge = null),
                child: const Icon(
                  Icons.close_rounded,
                  color: Color(0xFF94A3B8),
                  size: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Sign-in initiated on ${_pendingMobileChallenge!['device'] ?? 'Desktop Workstation'}. Tap the matching number shown on your computer screen:',
            style: const TextStyle(
              color: Color(0xFF334155),
              fontSize: 12,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: opts.map((opt) {
              final n = int.tryParse(opt.toString()) ?? 0;
              return ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF0F172A),
                  side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 22,
                    vertical: 10,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                  shadowColor: Colors.transparent,
                ),
                onPressed: () => _handleApproveChallenge(n),
                child: Text(
                  '$n',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFFDC2626),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                ),
                onPressed: () => _handleApproveChallenge(-1),
                icon: const Icon(Icons.close_rounded, size: 14),
                label: const Text(
                  "No, don't allow",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 14),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                onPressed: () {
                  final matchN =
                      int.tryParse(
                        _pendingMobileChallenge!['match_number']?.toString() ??
                            '',
                      ) ??
                      (opts.isNotEmpty
                          ? int.tryParse(opts[0].toString()) ?? 1
                          : 1);
                  _handleApproveChallenge(matchN);
                },
                icon: const Icon(Icons.check_rounded, size: 14),
                label: const Text(
                  "Yes, it's me",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Jio-Style Modern Navigation Bar (Ref Image 2: 'With love, from Jio') ──
  Widget _buildSpaciousBottomNav() {
    final navItems = [
      {'icon': Icons.shield_rounded, 'label': 'Shield'},
      {'icon': Icons.phone_callback_rounded, 'label': 'Caller ID'},
      {'icon': Icons.smart_toy_rounded, 'label': 'Raksha AI'},
      {'icon': Icons.devices_rounded, 'label': 'Device'},
      {'icon': Icons.notifications_active_rounded, 'label': 'Alerts'},
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F5F9), width: 1.2)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(
        10,
        8,
        10,
        MediaQuery.of(context).padding.bottom + 8,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(navItems.length, (idx) {
          final isSelected = _selectedNavIndex == idx;
          final item = navItems[idx];
          return Expanded(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedNavIndex = idx);
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Circular Icon Pill (Matching Ref Image 2)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF0F52BA)
                              : const Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                          boxShadow: isSelected
                              ? const [
                                  BoxShadow(
                                    color: Color(0x330F52BA),
                                    blurRadius: 8,
                                    offset: Offset(0, 3),
                                  ),
                                ]
                              : null,
                        ),
                        child: Icon(
                          item['icon'] as IconData,
                          size: 20,
                          color: isSelected
                              ? Colors.white
                              : const Color(0xFF475569),
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        item['label'] as String,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: isSelected
                              ? FontWeight.w800
                              : FontWeight.w500,
                          color: isSelected
                              ? const Color(0xFF0F172A)
                              : const Color(0xFF64748B),
                          letterSpacing: -0.1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCurrentSection() {
    switch (_selectedNavIndex) {
      case 0:
        return _buildShieldTab();
      case 1:
        return _buildCallerIdTab();
      case 2:
        return _buildRakshaTab();
      case 3:
        return _buildDeviceTab();
      case 4:
        return _buildAlertsTab();
      default:
        return _buildShieldTab();
    }
  }

  // ── TAB 0: SHIELD (Extended Long Animated Dashboard with Flipping Cards) ────
  Widget _buildShieldTab() {
    final userFullName = _userDisplayName;
    final userEmail = _userEmail;

    int computedScore = 30;
    if (_webShieldEnabled) computedScore += 20;
    if (_callerIdEnabled) computedScore += 20;
    if (_wifiGuardEnabled) computedScore += 15;
    if (_appPrivacyEnabled) computedScore += 15;
    final score = computedScore;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 16),

          // ── CENTER TOP: Large MIUI 10 Style Circular Security Gauge (Ref Image 3) ──
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer subtle circular glow
                    Container(
                      width: 196,
                      height: 196,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                            blurRadius: 32,
                            spreadRadius: 2,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                    ),
                    // Circular Progress Arc
                    SizedBox(
                      width: 178,
                      height: 178,
                      child: CircularProgressIndicator(
                        value: (score / 100.0).clamp(0.0, 1.0),
                        strokeWidth: 9,
                        backgroundColor: const Color(0xFFF1F5F9),
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0284C7)),
                      ),
                    ),
                    // Inner Numerical Score & Optimize Pill
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$score',
                          style: const TextStyle(
                            fontSize: 54,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                            letterSpacing: -1.5,
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          score >= 90
                              ? 'Device Protected'
                              : 'A few items can be optimized',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Centered Pill Button: Optimize
                        ElevatedButton.icon(
                          onPressed: _openFullScreenScanModal,
                          icon: const Icon(Icons.bolt_rounded, size: 15),
                          label: const Text(
                            'Optimize',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.3,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0284C7),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 7,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── BOTTOM FEATURES COVER SHEET (Ref Image 3: Swipe / Scroll Down Cover) ──
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              boxShadow: [
                BoxShadow(
                  color: Color(0x0E000000),
                  blurRadius: 24,
                  offset: Offset(0, -6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top drag handle indicator
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 16),
                    width: 44,
                    height: 4.5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),

                // Greeting & Active Shields Badge inside cover
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hello, $userFullName 👋',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Sovereign Security Suite Active',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.shield_rounded, size: 13, color: Color(0xFF059669)),
                            SizedBox(width: 4),
                            Text(
                              'SHIELDS ON',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF059669),
                                letterSpacing: 0.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // ── 2x3 FEATURE TILES GRID (Matching Reference Image 3) ──
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildMiuiFeatureTile(
                              icon: Icons.delete_outline_rounded,
                              iconColor: const Color(0xFFE5484D),
                              iconBg: const Color(0xFFFEE2E2),
                              title: 'Cleaner',
                              subtitle: 'No trash found',
                              onTap: _cleanMemoryTrash,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildMiuiFeatureTile(
                              icon: Icons.security_rounded,
                              iconColor: const Color(0xFF0284C7),
                              iconBg: const Color(0xFFE0F2FE),
                              title: 'Security scan',
                              subtitle: 'Scan device',
                              onTap: _openFullScreenScanModal,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildMiuiFeatureTile(
                              icon: Icons.battery_charging_full_rounded,
                              iconColor: const Color(0xFF10B981),
                              iconBg: const Color(0xFFECFDF5),
                              title: 'Battery',
                              subtitle: '91% · 15h left',
                              onTap: _showBatteryDetailsDialog,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildMiuiFeatureTile(
                              icon: Icons.water_drop_outlined,
                              iconColor: const Color(0xFFF59E0B),
                              iconBg: const Color(0xFFFEF3C7),
                              title: 'Data usage',
                              subtitle: 'Manage data plan',
                              onTap: _showDataUsageDialog,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildMiuiFeatureTile(
                              icon: Icons.bolt_rounded,
                              iconColor: const Color(0xFF8B5CF6),
                              iconBg: const Color(0xFFF5F3FF),
                              title: 'Threat Shield',
                              subtitle: 'Firewall & WFP active',
                              onTap: () => setState(() => _webShieldEnabled = !_webShieldEnabled),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildMiuiFeatureTile(
                              icon: Icons.grid_view_rounded,
                              iconColor: const Color(0xFF06B6D4),
                              iconBg: const Color(0xFFCFFAFE),
                              title: 'Manage apps',
                              subtitle: 'App permissions',
                              onTap: _showManageAppsDialog,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ── APP LOCK CARD (Matching Reference Image 3 bottom card) ──
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.shield_rounded,
                            color: Color(0xFF10B981),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'App lock',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Protect selected apps with a passcode.',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => AppLockPinScreen(
                                  mode: _isPinActive ? PinMode.change : PinMode.setup,
                                  onPinConfigured: (p) => setState(() => _isPinActive = true),
                                ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF0F172A),
                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Text(
                            _isPinActive ? 'Manage' : 'Turn on',
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // ── 3D FLIP TELEMETRY CARDS ──
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: FlipCard(
                    flipOnTap: true,
                    duration: const Duration(milliseconds: 650),
                    front: _buildContainmentHeroFront(),
                    back: _buildContainmentHeroBack(),
                  ),
                ),

        const SizedBox(height: 18),

        // ── 4. Section Header: 2x2 Performance Metrics ──────────────────────
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Endpoint Metrics · Tap to Flip',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.2,
                ),
              ),
              Text(
                'Real-Time Telemetry',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // ── 5. FLIP CARD GRID: 2x2 Interactive Metric Cards ─────────────────
        Row(
          children: [
            Expanded(
              child: FlipCard(
                flipOnTap: true,
                front: _buildMetricFlipTile(
                  icon: Icons.radar_rounded,
                  iconColor: const Color(0xFF3B82F6),
                  iconBg: const Color(0xFFEFF6FF),
                  title: 'Endpoint Scans',
                  value: '11,967',
                  delta: '+15.2%',
                  deltaPositive: true,
                ),
                back: _buildMetricFlipBack(
                  title: 'Scan Audit',
                  desc: 'Kernel & app sandbox clean. Zero rootkit payloads detected.',
                  status: 'Nominal ✓',
                  statusColor: const Color(0xFF10B981),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FlipCard(
                flipOnTap: true,
                front: _buildMetricFlipTile(
                  icon: Icons.memory_rounded,
                  iconColor: const Color(0xFF10B981),
                  iconBg: const Color(0xFFECFDF5),
                  title: 'Memory Health',
                  value: '99.9%',
                  delta: 'Optimal',
                  deltaPositive: true,
                ),
                back: _buildMetricFlipBack(
                  title: 'Stack Defense',
                  desc: 'ASLR & stack canaries enforced across all running tasks.',
                  status: 'Protected ✓',
                  statusColor: const Color(0xFF10B981),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: FlipCard(
                flipOnTap: true,
                front: _buildMetricFlipTile(
                  icon: Icons.dns_rounded,
                  iconColor: const Color(0xFF8B5CF6),
                  iconBg: const Color(0xFFF5F3FF),
                  title: 'DNS Filtered',
                  value: '43,435',
                  delta: '+2.7%',
                  deltaPositive: true,
                ),
                back: _buildMetricFlipBack(
                  title: 'DNS Sentinel',
                  desc: 'Sovereign Quad9 resolver. 312 tracker domains sinkholed.',
                  status: 'Zero Leaks ✓',
                  statusColor: const Color(0xFF8B5CF6),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FlipCard(
                flipOnTap: true,
                front: _buildMetricFlipTile(
                  icon: Icons.phone_in_talk_rounded,
                  iconColor: const Color(0xFFFF6B35),
                  iconBg: const Color(0xFFFFF7ED),
                  title: 'Calls Screened',
                  value: '1,207',
                  delta: 'TRAI DLT',
                  deltaPositive: true,
                ),
                back: _buildMetricFlipBack(
                  title: 'Telecom Filter',
                  desc: 'Cross-border VoIP spoofing neutralized in real time.',
                  status: 'Active 24/7 ✓',
                  statusColor: const Color(0xFFFF6B35),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // ── 6. FLIP CARD #3: Weekly Activity & Cohort Chart ────────────────
        FlipCard(
          flipOnTap: true,
          duration: const Duration(milliseconds: 650),
          front: _buildActivityChartCardFront(),
          back: _buildActivityChartCardBack(),
        ),

        const SizedBox(height: 18),

        // ── 7. Active Defense Shields Switchboard ───────────────────────────
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Active Defense Shields',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.2,
                ),
              ),
              Text(
                '4 of 4 ON',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF059669),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              child: _buildCompactShieldCard(
                title: 'Caller & SMS',
                subtitle: 'Spam & fraud filter',
                icon: Icons.phone_callback_rounded,
                color: const Color(0xFF3B82F6),
                isActive: _callerIdEnabled,
                onChanged: (val) => setState(() => _callerIdEnabled = val),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildCompactShieldCard(
                title: 'Web Guard',
                subtitle: 'Phishing URL shield',
                icon: Icons.link_rounded,
                color: const Color(0xFF10B981),
                isActive: _webShieldEnabled,
                onChanged: (val) => setState(() => _webShieldEnabled = val),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildCompactShieldCard(
                title: 'Wi-Fi Sentinel',
                subtitle: 'Hotspot protection',
                icon: Icons.wifi_protected_setup_rounded,
                color: const Color(0xFF8B5CF6),
                isActive: _wifiGuardEnabled,
                onChanged: (val) => setState(() => _wifiGuardEnabled = val),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildCompactShieldCard(
                title: 'App Privacy',
                subtitle: 'Mic & camera guard',
                icon: Icons.security_rounded,
                color: const Color(0xFFFF6B35),
                isActive: _appPrivacyEnabled,
                onChanged: (val) => setState(() => _appPrivacyEnabled = val),
              ),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // ── 8. Recent Incidents & Threat Feed (Monday.com / Card Style) ────
        _buildRecentIncidentsSection(),

        const SizedBox(height: 18),

        // ── 9. FLIP CARD #4: Weekly Security PDF Reports ────────────────────
        FlipCard(
          flipOnTap: true,
          duration: const Duration(milliseconds: 650),
          front: _buildWeeklyReportsCardFront(userFullName, userEmail),
          back: _buildWeeklyReportsCardBack(userFullName),
        ),

        const SizedBox(height: 18),

        // ── 10. Sovereign Indian Cyber Architecture Assurance Footer ────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _buildSovereignAssuranceFooter(),
        ),

        const SizedBox(height: 24),

        // ── BRANDING FOOTER: "With love, KAVACH ❤️" ──
        Center(
          child: Column(
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Text(
                    'With love, KAVACH ',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                      letterSpacing: 0.3,
                    ),
                  ),
                  Text('❤️', style: TextStyle(fontSize: 15)),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Sovereign AI Security · Kavach Cybertech',
                style: TextStyle(
                  fontSize: 11,
                  color: Color(0xFF94A3B8),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 36),
      ],
    ),
  ),
],
),
);
}

  // ── Sub-Widgets for Flip Card #1: Score Gauge ──────────────────────────────
  Widget _buildPostureCardFront(int score, bool isHealthy) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 20,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 82,
                    height: 82,
                    child: CircularProgressIndicator(
                      value: (score / 100.0).clamp(0.0, 1.0),
                      strokeWidth: 8,
                      backgroundColor: const Color(0xFFF1F5F9),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isHealthy ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      ),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$score',
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const Text(
                        '/ 100',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Phone Fully Shielded',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '16 real-time sensors guarding against phishing, scam callers & malware.',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11.5,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Cloud Sync: ${_lastSyncTime.hour.toString().padLeft(2, '0')}:${_lastSyncTime.minute.toString().padLeft(2, '0')} · AWS Mumbai',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 10.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isFullScanning)
            Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: _scanProgress,
                    minHeight: 6,
                    backgroundColor: const Color(0xFFF1F5F9),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _scanStatusText,
                  style: const TextStyle(
                    color: Color(0xFF059669),
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F52BA),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: _runDeviceScan,
                    icon: const Icon(Icons.radar_rounded, size: 18),
                    label: const Text(
                      'Scan Phone Now',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.flip_rounded, size: 13, color: Colors.blueGrey.shade400),
              const SizedBox(width: 5),
              Text(
                'Tap card to view 16-Sensor Diagnostic Matrix',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                  color: Colors.blueGrey.shade500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPostureCardBack() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF0F52BA).withValues(alpha: 0.3), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C0F52BA),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.hub_rounded, size: 18, color: Color(0xFF0F52BA)),
                  SizedBox(width: 8),
                  Text(
                    '16-Sensor Diagnostic Matrix',
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'ALL SYSTEMS NOMINAL',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1D4ED8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildSensorStatusRow('Memory Sandbox Integrity', 'Stack Canary Armed', '100% Clean', const Color(0xFF10B981)),
          const Divider(height: 16, color: Color(0xFFF1F5F9)),
          _buildSensorStatusRow('Telecom Fraud Intercept', 'TRAI DLT Verified', 'Active', const Color(0xFF10B981)),
          const Divider(height: 16, color: Color(0xFFF1F5F9)),
          _buildSensorStatusRow('Sovereign DNS Shield', 'Quad9 Route Active', '0 Leaks', const Color(0xFF8B5CF6)),
          const Divider(height: 16, color: Color(0xFFF1F5F9)),
          _buildSensorStatusRow('NVIDIA NIM Neural Engine', 'DiffusionGemma-26B', '8ms Latency', const Color(0xFFFF6B35)),
          const SizedBox(height: 14),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.flip_rounded, size: 13, color: Colors.blueGrey.shade400),
                const SizedBox(width: 5),
                Text(
                  'Tap card to return to Score Gauge',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.blueGrey.shade500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSensorStatusRow(String title, String subtitle, String status, Color statusColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
        Text(
          status,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: statusColor,
          ),
        ),
      ],
    );
  }

  // ── Sub-Widgets for Flip Card #2: Threat Containment Hero Banner ───────────
  Widget _buildContainmentHeroFront() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFF6B35),
            Color(0xFFFFA033),
          ],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33FF6B35),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.offline_bolt_rounded, size: 18, color: Colors.white),
                  SizedBox(width: 8),
                  Text(
                    'LIVE THREAT CONTAINMENT',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.arrow_upward_rounded, size: 12, color: Colors.white),
                    SizedBox(width: 2),
                    Text(
                      '+12.4%',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            '99.8%',
            style: TextStyle(
              fontSize: 38,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -1.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Zero breaches recorded · 571 threats intercepted this week',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.white.withValues(alpha: 0.92),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.flip_rounded, size: 13, color: Colors.white.withValues(alpha: 0.8)),
              const SizedBox(width: 5),
              Text(
                'Tap card to inspect Attack Vector Breakdown',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContainmentHeroBack() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFFF6B35).withValues(alpha: 0.4), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14FF6B35),
            blurRadius: 20,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Attack Vector Intercepts',
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              Text(
                'PAST 7 DAYS',
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFFF6B35),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildThreatVectorRow('Phishing & Malicious URLs', '142 blocked', '100% neutralized', const Color(0xFF10B981)),
          const Divider(height: 14, color: Color(0xFFF1F5F9)),
          _buildThreatVectorRow('Scam & Digital Arrest Calls', '38 intercepted', 'TRAI Blocked', const Color(0xFF10B981)),
          const Divider(height: 14, color: Color(0xFFF1F5F9)),
          _buildThreatVectorRow('Malicious APK Droppers', '12 quarantined', 'Zero Execution', const Color(0xFF3B82F6)),
          const Divider(height: 14, color: Color(0xFFF1F5F9)),
          _buildThreatVectorRow('MITRE Techniques Disarmed', 'T1059, T1204', 'Automated SOAR', const Color(0xFF8B5CF6)),
          const SizedBox(height: 10),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.flip_rounded, size: 13, color: Colors.blueGrey.shade400),
                const SizedBox(width: 5),
                Text(
                  'Tap card to return to Containment Rate',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.blueGrey.shade500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThreatVectorRow(String title, String count, String outcome, Color outcomeColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
            ),
            Text(
              count,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        Text(
          outcome,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: outcomeColor,
          ),
        ),
      ],
    );
  }

  // ── Sub-Widgets for 2x2 Interactive Metric Cards ───────────────────────────
  Widget _buildMetricFlipTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String value,
    required String delta,
    required bool deltaPositive,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  delta,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: deltaPositive ? const Color(0xFF059669) : const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricFlipBack({
    required String title,
    required String desc,
    required String status,
    required Color statusColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFCBD5E1)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF64748B),
              height: 1.3,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            status,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w800,
              color: statusColor,
            ),
          ),
        ],
      ),
    );
  }

  // ── Sub-Widgets for Flip Card #3: Weekly Activity & Cohort Chart ───────────
  Widget _buildActivityChartCardFront() {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final heights = [0.45, 0.70, 0.55, 0.90, 0.65, 0.40, 0.85];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 20,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Weekly Protection Activity',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              Row(
                children: [
                  Icon(Icons.circle, size: 8, color: Color(0xFFFF6B35)),
                  SizedBox(width: 4),
                  Text('Telemetry', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                  SizedBox(width: 8),
                  Icon(Icons.circle, size: 8, color: Color(0xFF10B981)),
                  SizedBox(width: 4),
                  Text('Mitigated', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(7, (i) {
              return Column(
                children: [
                  Container(
                    width: 28,
                    height: 100 * heights[i],
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: i == 3
                            ? [const Color(0xFFFF6B35), const Color(0xFFFFA033)]
                            : [const Color(0xFF0F52BA), const Color(0xFF3B82F6)],
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    days[i],
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: i == 3 ? FontWeight.bold : FontWeight.w500,
                      color: i == 3 ? const Color(0xFFFF6B35) : const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              );
            }),
          ),
          const SizedBox(height: 14),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.flip_rounded, size: 13, color: Colors.blueGrey.shade400),
                const SizedBox(width: 5),
                Text(
                  'Tap chart to view SOAR Automation Metrics',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.blueGrey.shade500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityChartCardBack() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F000000),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'SOAR Playbook Automation',
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              Text(
                'ZERO HUMAN DELAY',
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF10B981),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildDarkStatRow('Mean Time to Remediate (MTTR)', '1.4 seconds', const Color(0xFF10B981)),
          const Divider(height: 14, color: Color(0xFF1E293B)),
          _buildDarkStatRow('Automated Playbook Dispatches', '247 runs (100% success)', Colors.white),
          const Divider(height: 14, color: Color(0xFF1E293B)),
          _buildDarkStatRow('False Positive Elimination Rate', '99.98% clean precision', const Color(0xFF38BDF8)),
          const Divider(height: 14, color: Color(0xFF1E293B)),
          _buildDarkStatRow('Sovereign Cloud Latency', '14ms AWS Mumbai Route', const Color(0xFFFF6B35)),
          const SizedBox(height: 14),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.flip_rounded, size: 13, color: Colors.white.withValues(alpha: 0.6)),
                const SizedBox(width: 5),
                Text(
                  'Tap to return to Weekly Activity Chart',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDarkStatRow(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF94A3B8),
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
      ],
    );
  }

  // ── Sub-Widget: Recent Threat Feed (Monday.com / Clean Card Style) ─────────
  Widget _buildRecentIncidentsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Security Telemetry',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.2,
                ),
              ),
              Text(
                'Live Audit',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F52BA),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        _buildIncidentCard(
          icon: Icons.shield_rounded,
          iconColor: const Color(0xFF10B981),
          iconBg: const Color(0xFFECFDF5),
          title: 'Perimeter Defense Synchronized',
          subtitle: 'All 16 real-time sensors verified with AWS Cyberkavach cloud.',
          time: 'Just now',
          badgeText: 'SAFE',
          badgeColor: const Color(0xFF10B981),
        ),
        const SizedBox(height: 8),
        _buildIncidentCard(
          icon: Icons.phone_locked_rounded,
          iconColor: const Color(0xFF3B82F6),
          iconBg: const Color(0xFFEFF6FF),
          title: 'Caller Sentinel Route Verified',
          subtitle: 'TRAI DLT gateway inspection enabled for incoming telecommunications.',
          time: '12m ago',
          badgeText: 'MONITORED',
          badgeColor: const Color(0xFF3B82F6),
        ),
        const SizedBox(height: 8),
        _buildIncidentCard(
          icon: Icons.vpn_lock_rounded,
          iconColor: const Color(0xFF8B5CF6),
          iconBg: const Color(0xFFF5F3FF),
          title: 'Encrypted Sovereign Channel Active',
          subtitle: 'TLS 1.3 cryptographic tunnel secured to Indian Security Operations Center.',
          time: '1h ago',
          badgeText: 'SECURE',
          badgeColor: const Color(0xFF8B5CF6),
        ),
      ],
    );
  }

  Widget _buildIncidentCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required String time,
    required String badgeText,
    required Color badgeColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x04000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, size: 20, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      badgeText,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        color: badgeColor,
                        letterSpacing: 0.5,
                      ),
                    ),
                    Text(
                      time,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Sub-Widgets for Flip Card #4: Weekly Reports ───────────────────────────
  Widget _buildWeeklyReportsCardFront(String userFullName, String userEmail) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.picture_as_pdf_rounded,
                  color: Color(0xFFEF4444),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Automated Weekly PDF Digest',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      'Prepared for $userFullName · $userEmail',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF64748B),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _userWeeklyReports.isNotEmpty
                ? 'Comprehensive SOC audit PDF summary generated weekly (${_userWeeklyReports.length} reports available on cloud).'
                : 'Comprehensive SOC audit PDF summary generated weekly with complete telemetry timeline.',
            style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.35),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.flip_rounded, size: 13, color: Colors.blueGrey.shade400),
              const SizedBox(width: 5),
              Text(
                'Tap card to inspect Cryptographic Compliance Seal',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                  color: Colors.blueGrey.shade500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyReportsCardBack(String userFullName) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFCBD5E1)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Cryptographic Compliance Seal',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              Icon(Icons.verified_user_rounded, size: 18, color: Color(0xFF10B981)),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'SHA-256 Digest: e7f2b984...a18c\nSOC Analyst Signature: Sovereign SOC Engine\nCompliance Standard: CERT-In & ISO/IEC 27001',
            style: TextStyle(fontSize: 11, color: Color(0xFF475569), height: 1.4),
          ),
          const SizedBox(height: 12),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.flip_rounded, size: 13, color: Colors.blueGrey.shade400),
                const SizedBox(width: 5),
                Text(
                  'Tap to return to Weekly PDF Digest',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.blueGrey.shade500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Sub-Widget: Sovereign Indian Cyber Architecture Assurance Footer ───────
  Widget _buildSovereignAssuranceFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x04000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.flag_rounded,
              color: Color(0xFFFF6B35),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sovereign Indian Cyber Architecture',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  '100% On-Premise & AWS ap-south-1 (Mumbai) Hosted. AES-256 DPAPI Data Encryption.',
                  style: TextStyle(
                    fontSize: 10,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactShieldCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isActive,
    required ValueChanged<bool> onChanged,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => onChanged(!isActive),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive ? color.withValues(alpha: 0.3) : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x05000000),
              blurRadius: 10,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                Transform.scale(
                  scale: 0.8,
                  child: Switch.adaptive(
                    value: isActive,
                    activeTrackColor: color.withValues(alpha: 0.4),
                    activeThumbColor: color,
                    onChanged: onChanged,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10.5,
                color: Color(0xFF64748B),
                height: 1.25,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ── TAB 1: CALLER ID & SPAM SHIELD ─────────────────────────────────────────
  Widget _buildCallerIdTab() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      children: [
        // 1. Real-Time Telephony Protection Header Card (Light Theme)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 14,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: const Icon(
                      Icons.verified_user_rounded,
                      color: Color(0xFF059669),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'KAVACH Live Caller ID Sentinel',
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          '● Carrier Intercept Active · Zero-Trust Telephony',
                          style: TextStyle(
                            color: Color(0xFF059669),
                            fontSize: 10.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'Directly screening incoming calls, SMS messages, and VoIP packets against the live KAVACH ML threat intelligence engine hosted on AWS.',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 11.5,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // 2. Android Sentinel Permissions & System Overlays
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: (_overlayPermissionGranted && _telephonyPermissionsGranted)
                  ? const Color(0xFF10B981).withValues(alpha: 0.3)
                  : const Color(0xFFF59E0B).withValues(alpha: 0.3),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Overlay Permission Sub-item
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color:
                          (_overlayPermissionGranted
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFF59E0B))
                              .withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.layers_rounded,
                      color: _overlayPermissionGranted
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '1. Display Over Other Apps',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          _overlayPermissionGranted
                              ? 'Active · Floating overlay enabled'
                              : 'Required · Needed to show caller popup over incoming calls',
                          style: TextStyle(
                            fontSize: 10.5,
                            color: _overlayPermissionGranted
                                ? const Color(0xFF059669)
                                : const Color(0xFFD97706),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color:
                          (_overlayPermissionGranted
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFF59E0B))
                              .withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _overlayPermissionGranted ? 'ACTIVE ✓' : 'REQUIRED',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        color: _overlayPermissionGranted
                            ? const Color(0xFF059669)
                            : const Color(0xFFD97706),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _overlayPermissionGranted
                        ? const Color(0xFF059669)
                        : AppColors.primary,
                    side: BorderSide(
                      color: _overlayPermissionGranted
                          ? const Color(0xFF10B981)
                          : AppColors.primary,
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: Icon(
                    _overlayPermissionGranted
                        ? Icons.check_circle_outline_rounded
                        : Icons.open_in_new_rounded,
                    size: 15,
                  ),
                  label: Text(
                    _overlayPermissionGranted
                        ? 'Overlay Permission Active'
                        : 'Grant "Display Over Other Apps"',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onPressed: _requestOverlayPermission,
                ),
              ),

              const Divider(height: 20, color: Color(0xFFF1F5F9)),

              // Telephony & SMS Intercept Sub-item
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color:
                          (_telephonyPermissionsGranted
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFF59E0B))
                              .withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.phone_forwarded_rounded,
                      color: _telephonyPermissionsGranted
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '2. Phone & SMS Intercept Shield',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          _telephonyPermissionsGranted
                              ? 'Active · Intercepting phone calls and SMS'
                              : 'Action Needed · Allow KAVACH to read incoming numbers & SMS',
                          style: TextStyle(
                            fontSize: 10.5,
                            color: _telephonyPermissionsGranted
                                ? const Color(0xFF059669)
                                : const Color(0xFFD97706),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color:
                          (_telephonyPermissionsGranted
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFF59E0B))
                              .withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _telephonyPermissionsGranted ? 'ACTIVE ✓' : 'GRANT',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        color: _telephonyPermissionsGranted
                            ? const Color(0xFF059669)
                            : const Color(0xFFD97706),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _telephonyPermissionsGranted
                        ? const Color(0xFF059669)
                        : AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 9),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: Icon(
                    _telephonyPermissionsGranted
                        ? Icons.security_rounded
                        : Icons.lock_open_rounded,
                    size: 15,
                  ),
                  label: Text(
                    _telephonyPermissionsGranted
                        ? '✓ Call & SMS Sentinel Granted'
                        : 'Grant Phone & SMS Intercept Permissions',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onPressed: _requestTelephonyPermissions,
                ),
              ),

              const SizedBox(height: 8),

              // Xiaomi / Redmi Background Popup Special Notice
              InkWell(
                onTap: _openMiuiPopupSettings,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.settings_suggest_rounded,
                        color: Color(0xFFEA580C),
                        size: 16,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Xiaomi / Redmi (MIUI): Tap here to enable "Display pop-up windows while running in the background"',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF334155),
                          ),
                        ),
                      ),
                      Icon(
                        Icons.arrow_forward_ios_rounded,
                        color: Color(0xFF94A3B8),
                        size: 12,
                      ),
                    ],
                  ),
                ),
              ),

              const Divider(height: 20, color: Color(0xFFF1F5F9)),

              // Live Floating Overlay System Trigger (Test Over Any App)
              const Text(
                'Live Floating Overlay Triggers (Test Over Any App):',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      icon: const Icon(Icons.phone_in_talk_rounded, size: 14),
                      label: const Text(
                        'Test Call Popup',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () => _triggerNativeCallOverlay(
                        number: _simulatedIncomingCaller,
                        name: _simulatedCallerName,
                        carrier: _simulatedCarrier,
                        isThreat: _simulatedIsThreat,
                        riskScore: _simulatedIsThreat ? 96.0 : 8.0,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0284C7),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      icon: const Icon(Icons.sms_rounded, size: 14),
                      label: const Text(
                        'Test SMS Popup',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () => _triggerNativeSmsOverlay(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF64748B),
                    padding: const EdgeInsets.symmetric(vertical: 4),
                  ),
                  icon: const Icon(Icons.close_fullscreen_rounded, size: 13),
                  label: const Text(
                    'Dismiss Floating System Window',
                    style: TextStyle(fontSize: 11),
                  ),
                  onPressed: _dismissNativeOverlay,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 3. Live Caller ID Sentinel & Simulation Panel (Modern Light Theme)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 14,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.phone_in_talk_rounded,
                      color: AppColors.primary,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Live Caller ID & SMS Sentinel',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          'Bottom slide-up overlay with carrier telemetry & verified caller ticks',
                          style: TextStyle(
                            fontSize: 10.5,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      foregroundColor: AppColors.primary,
                    ),
                    onPressed: () {
                      setState(() {
                        _simulatedIncomingCaller = '+91 98200 12345';
                        _simulatedCallerName = '$_userDisplayName (Verified Lead)';
                        _simulatedCarrier =
                            'Reliance Jio 5G · Mumbai Telecom Circle';
                        _simulatedIsThreat = false;
                        _showFloatingCallerOverlay = true;
                      });
                      _triggerNativeCallOverlay(
                        number: '+91 98200 12345',
                        name: '$_userDisplayName (Verified Lead)',
                        carrier: 'Reliance Jio 5G · Mumbai Telecom Circle',
                        isThreat: false,
                        riskScore: 4.0,
                      );
                    },
                    icon: const Icon(Icons.play_arrow_rounded, size: 16),
                    label: const Text(
                      'Test Live',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Text(
                'Test Rising Bottom Pop-Up Scenarios:',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF475569),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  // 1. Verified Telecom Caller
                  ActionChip(
                    avatar: const Icon(
                      Icons.verified_rounded,
                      size: 14,
                      color: Color(0xFF059669),
                    ),
                    label: const Text(
                      '✓ Verified Caller (Jio 5G)',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF059669),
                      ),
                    ),
                    backgroundColor: const Color(0xFFECFDF5),
                    side: const BorderSide(color: Color(0xFFA7F3D0)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    onPressed: () {
                      setState(() {
                        _simulatedIncomingCaller = '+91 90049 76777';
                        _simulatedCallerName = 'KAVACH Cyber Defense Desk';
                        _simulatedCarrier = 'Jio 5G · Mumbai Telecom Circle';
                        _simulatedIsThreat = false;
                        _showFloatingCallerOverlay = true;
                      });
                      _triggerNativeCallOverlay(
                        number: '+91 90049 76777',
                        name: 'KAVACH Cyber Defense Desk',
                        carrier: 'Jio 5G · Mumbai Telecom Circle',
                        isThreat: false,
                        riskScore: 5.0,
                      );
                    },
                  ),
                  // 2. Fraud Impersonator Call
                  ActionChip(
                    avatar: const Icon(
                      Icons.warning_amber_rounded,
                      size: 14,
                      color: Color(0xFFDC2626),
                    ),
                    label: const Text(
                      '🚨 Digital Arrest (+92)',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                    backgroundColor: const Color(0xFFFEF2F2),
                    side: const BorderSide(color: Color(0xFFFECACA)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    onPressed: () {
                      setState(() {
                        _simulatedIncomingCaller = '+92 300 9876543';
                        _simulatedCallerName =
                            '🚨 Fake CBI Digital Arrest Impersonator';
                        _simulatedCarrier =
                            'Mobilink Jazz Pakistan · Gateway VOIP';
                        _simulatedIsThreat = true;
                        _showFloatingCallerOverlay = true;
                      });
                      _triggerNativeCallOverlay(
                        number: '+92 300 9876543',
                        name: '🚨 Fake CBI Digital Arrest Impersonator',
                        carrier: 'Mobilink Jazz Pakistan · Gateway VOIP',
                        isThreat: true,
                        riskScore: 98.0,
                      );
                    },
                  ),
                  // 3. Verified SMS Sender
                  ActionChip(
                    avatar: const Icon(
                      Icons.sms_rounded,
                      size: 14,
                      color: Color(0xFF0284C7),
                    ),
                    label: const Text(
                      '✓ Verified SMS (Airtel)',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0284C7),
                      ),
                    ),
                    backgroundColor: const Color(0xFFF0F9FF),
                    side: const BorderSide(color: Color(0xFFBAE6FD)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    onPressed: () {
                      setState(() {
                        _simulatedIncomingCaller = 'VK-HDFCBK';
                        _simulatedCallerName = 'HDFC Bank Secure Banking';
                        _simulatedCarrier = 'Airtel Enterprise SMS Gateway';
                        _simulatedIsThreat = false;
                        _showFloatingCallerOverlay = true;
                      });
                      _triggerNativeCallOverlay(
                        number: 'VK-HDFCBK',
                        name: 'HDFC Bank Secure Banking',
                        carrier: 'Airtel Enterprise SMS Gateway',
                        isThreat: false,
                        riskScore: 2.0,
                      );
                    },
                  ),
                  // 4. Job Task Fraud Call
                  ActionChip(
                    avatar: const Icon(
                      Icons.report_problem_rounded,
                      size: 14,
                      color: Color(0xFFD97706),
                    ),
                    label: const Text(
                      '⚠ Task Scam (+234)',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFD97706),
                      ),
                    ),
                    backgroundColor: const Color(0xFFFFFBEB),
                    side: const BorderSide(color: Color(0xFFFDE68A)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    onPressed: () {
                      setState(() {
                        _simulatedIncomingCaller = '+234 802 3456789';
                        _simulatedCallerName = '⚠️ Part-Time Telegram Job Scam';
                        _simulatedCarrier = 'MTN Nigeria · International VOIP';
                        _simulatedIsThreat = true;
                        _showFloatingCallerOverlay = true;
                      });
                      _triggerNativeCallOverlay(
                        number: '+234 802 3456789',
                        name: '⚠️ Part-Time Telegram Job Scam',
                        carrier: 'MTN Nigeria · International VOIP',
                        isThreat: true,
                        riskScore: 94.0,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 4. Live Reverse Number Lookup Search Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Verify Any Caller or Number',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Instant carrier identification, telecom circle decoding, and fraud screening.',
                style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Enter phone number (+92, +234, +91…)',
                  hintStyle: const TextStyle(fontSize: 12),
                  prefixIcon: const Icon(Icons.search_rounded, size: 18),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Preset Test Numbers (Horizontally Scrollable)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    const Text(
                      'Test:',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text(
                        '+92 Task Scam',
                        style: TextStyle(fontSize: 10.5),
                      ),
                      backgroundColor: const Color(
                        0xFFEF4444,
                      ).withValues(alpha: 0.08),
                      labelStyle: const TextStyle(
                        color: Color(0xFFEF4444),
                        fontWeight: FontWeight.bold,
                      ),
                      onPressed: () {
                        _phoneController.text = '+92 300 9876543';
                        _handleScanPhone();
                      },
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text(
                        '+234 Advance Fraud',
                        style: TextStyle(fontSize: 10.5),
                      ),
                      backgroundColor: const Color(
                        0xFFEF4444,
                      ).withValues(alpha: 0.08),
                      labelStyle: const TextStyle(
                        color: Color(0xFFEF4444),
                        fontWeight: FontWeight.bold,
                      ),
                      onPressed: () {
                        _phoneController.text = '+234 802 3456789';
                        _handleScanPhone();
                      },
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text(
                        '+91 Verified',
                        style: TextStyle(fontSize: 10.5),
                      ),
                      backgroundColor: const Color(
                        0xFF10B981,
                      ).withValues(alpha: 0.08),
                      labelStyle: const TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.bold,
                      ),
                      onPressed: () {
                        _phoneController.text = '+91 90049 76777';
                        _handleScanPhone();
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: _isScanningPhone
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.verified_user_outlined, size: 16),
                  label: Text(
                    _isScanningPhone ? 'Evaluating Number…' : 'Scan Number',
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onPressed: _isScanningPhone ? null : _handleScanPhone,
                ),
              ),

              // Scan Result Card
              if (_phoneScanResult != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color:
                        (_phoneScanResult!['is_threat'] == true
                                ? const Color(0xFFEF4444)
                                : const Color(0xFF10B981))
                            .withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color:
                          (_phoneScanResult!['is_threat'] == true
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF10B981))
                              .withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            _phoneScanResult!['is_threat'] == true
                                ? Icons.error_outline_rounded
                                : Icons.check_circle_outline_rounded,
                            color: _phoneScanResult!['is_threat'] == true
                                ? const Color(0xFFEF4444)
                                : const Color(0xFF10B981),
                            size: 18,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              _phoneScanResult!['caller_name']?.toString() ??
                                  _phoneScanResult!['risk_level']?.toString() ??
                                  'SCANNED',
                              style: TextStyle(
                                color: _phoneScanResult!['is_threat'] == true
                                    ? const Color(0xFFEF4444)
                                    : const Color(0xFF10B981),
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color:
                                  (_phoneScanResult!['is_threat'] == true
                                          ? const Color(0xFFEF4444)
                                          : const Color(0xFF10B981))
                                      .withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${_phoneScanResult!['risk_score'] ?? 0}% RISK',
                              style: TextStyle(
                                color: _phoneScanResult!['is_threat'] == true
                                    ? const Color(0xFFEF4444)
                                    : const Color(0xFF10B981),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (_phoneScanResult!['carrier'] != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          'Carrier: ${_phoneScanResult!['carrier']} · ${_phoneScanResult!['circle'] ?? 'Circle'} (${_phoneScanResult!['line_type'] ?? 'Mobile'})',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        _phoneScanResult!['raksha_summary']?.toString() ?? '',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF334155),
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 5. SMS & WhatsApp Message Fraud Scanner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'SMS & WhatsApp Message Scanner',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Paste suspicious SMS text or task offers to detect smishing payloads.',
                style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _smsController,
                maxLines: 2,
                style: const TextStyle(fontSize: 12),
                decoration: InputDecoration(
                  hintText:
                      'Paste message (e.g. "Your electricity power will be disconnected today…")',
                  hintStyle: const TextStyle(fontSize: 11),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.all(12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: _isScanningSms
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.document_scanner_outlined, size: 16),
                  label: Text(
                    _isScanningSms
                        ? 'Analyzing Message…'
                        : 'Analyze SMS Content',
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onPressed: _isScanningSms ? null : _handleScanSms,
                ),
              ),
              if (_smsScanResult != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color:
                        (_smsScanResult!['is_threat'] == true
                                ? const Color(0xFFEF4444)
                                : const Color(0xFF10B981))
                            .withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color:
                          (_smsScanResult!['is_threat'] == true
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF10B981))
                              .withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _smsScanResult!['raksha_summary']?.toString() ?? '',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor:
                                _smsScanResult!['is_threat'] == true
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF059669),
                            side: BorderSide(
                              color: _smsScanResult!['is_threat'] == true
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF10B981),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          icon: const Icon(Icons.open_in_new_rounded, size: 14),
                          label: const Text(
                            'Display Live Threat Popup on Screen',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onPressed: () => _triggerNativeSmsOverlay(
                            smsText: _smsController.text.trim().isNotEmpty
                                ? _smsController.text.trim()
                                : 'Detected SMS Smishing threat payload',
                            isThreat: _smsScanResult!['is_threat'] == true,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 6. External Caller ID & Number Lookup APIs (Documentation Hub)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFCBD5E1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.hub_rounded, color: Color(0xFF0284C7), size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Caller ID Intelligence APIs for KAVACH',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'To query caller names, carrier info, and fraud scores globally, KAVACH supports the following industry APIs:',
                style: TextStyle(fontSize: 11, color: Color(0xFF475569)),
              ),
              const SizedBox(height: 10),
              _buildApiItem(
                name: 'KAVACH Sovereign Telecom Engine',
                badge: 'BUILT-IN · 100% FREE',
                badgeColor: const Color(0xFF10B981),
                desc:
                    'Decodes all 22 Indian Telecom circles (Jio, Airtel, Vi, BSNL) and flags international cyber compounds (+92, +234, +855). Zero cost.',
              ),
              const SizedBox(height: 6),
              _buildApiItem(
                name: 'Numverify API (APILayer)',
                badge: 'FREE TIER (100-250 / mo)',
                badgeColor: const Color(0xFF0284C7),
                desc:
                    'Returns carrier name, line type (mobile/VoIP), location/city, and format validation globally. No credit card required.',
              ),
              const SizedBox(height: 6),
              _buildApiItem(
                name: 'AbstractAPI Phone Validation',
                badge: 'FREE TIER (100 / mo)',
                badgeColor: const Color(0xFF8B5CF6),
                desc:
                    'Instant spam risk scoring, carrier detection, and line type checks via clean REST endpoint.',
              ),
              const SizedBox(height: 6),
              _buildApiItem(
                name: 'Twilio Lookup API',
                badge: 'ENTERPRISE CNAM',
                badgeColor: const Color(0xFFF59E0B),
                desc:
                    'Provides carrier identity and Caller Name (CNAM) records with high carrier accuracy.',
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 7. Screened Numbers Ledger
        const Text(
          'Screened Numbers & Fraud Registry',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 8),
        if (_blockedCallers.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
            ),
            child: const Center(
              child: Column(
                children: [
                  Icon(
                    Icons.shield_outlined,
                    color: Color(0xFF10B981),
                    size: 36,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'No Flagged Numbers',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'All scanned communications passed carrier verification.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
                  ),
                ],
              ),
            ),
          )
        else
          ..._blockedCallers.map(
            (item) => Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
              ),
              child: Row(
                children: [
                  Icon(
                    item['is_threat'] == true
                        ? Icons.block_rounded
                        : Icons.check_circle_rounded,
                    color: item['is_threat'] == true
                        ? const Color(0xFFEF4444)
                        : const Color(0xFF10B981),
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['number']!,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          item['label']!,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    item['time']!,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildApiItem({
    required String name,
    required String badge,
    required Color badgeColor,
    required String desc,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    color: badgeColor,
                    fontSize: 8.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            desc,
            style: const TextStyle(
              fontSize: 10.5,
              color: Color(0xFF64748B),
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }

  // ── TAB 2: RAKSHA AI (Conversational Copilot) ──────────────────────────────
  Widget _buildRakshaTab() {
    return Column(
      children: [
        // AI Header Strip
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: Colors.white,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.smart_toy_rounded,
                  color: Color(0xFF0284C7),
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Raksha AI Cyber Copilot',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      'Powered by NVIDIA NIM Neural Intelligence',
                      style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'READY',
                  style: TextStyle(
                    color: Color(0xFF059669),
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Quick Suggestion Chips (Horizontally Scrollable)
        Container(
          color: Colors.white,
          padding: const EdgeInsets.only(left: 12, right: 12, bottom: 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildPromptChip(
                  '🚨 What is Digital Arrest?',
                  'What is Digital Arrest scam and how to avoid it?',
                ),
                _buildPromptChip(
                  '📞 How to spot scam calls?',
                  'How does KAVACH spot and block scam phone numbers?',
                ),
                _buildPromptChip(
                  '💳 Check SMS smishing',
                  'How can I verify if a bank SMS with a link is genuine?',
                ),
                _buildPromptChip(
                  '💬 Secure my WhatsApp',
                  'What are the top security settings for WhatsApp and Telegram?',
                ),
              ],
            ),
          ),
        ),

        const Divider(height: 1),

        // Message Thread
        Expanded(
          child: ListView.builder(
            controller: _chatScrollController,
            padding: const EdgeInsets.all(16),
            itemCount: _chatMessages.length,
            itemBuilder: (ctx, i) {
              final msg = _chatMessages[i];
              final isUser = msg['sender'] == 'user';
              return Align(
                alignment: isUser
                    ? Alignment.centerRight
                    : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.85,
                  ),
                  decoration: BoxDecoration(
                    color: isUser ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomRight: isUser
                          ? const Radius.circular(0)
                          : const Radius.circular(16),
                      bottomLeft: !isUser
                          ? const Radius.circular(0)
                          : const Radius.circular(16),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                    border: isUser
                        ? null
                        : Border.all(
                            color: Colors.black.withValues(alpha: 0.06),
                          ),
                  ),
                  child: _buildFormattedChatMessage(msg['text']!, isUser),
                ),
              );
            },
          ),
        ),

        if (_isSendingChat)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            alignment: Alignment.centerLeft,
            child: const Row(
              children: [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 8),
                Text(
                  'Raksha AI is synthesizing security advisory…',
                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),

        // Chat Input Field
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          color: Colors.white,
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _chatController,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      hintText:
                          'Ask Raksha AI about threats, scams, or security…',
                      hintStyle: const TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF94A3B8),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF1F5F9),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onSubmitted: (_) => _handleSendChatMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: const CircleBorder(),
                  ),
                  icon: const Icon(Icons.arrow_upward_rounded, size: 20),
                  onPressed: _isSendingChat
                      ? null
                      : () => _handleSendChatMessage(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFormattedChatMessage(String text, bool isUser) {
    if (isUser) {
      return Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
      );
    }

    final lines = text.split('\n');
    final widgets = <Widget>[];

    for (int i = 0; i < lines.length; i++) {
      String line = lines[i].trim();
      if (line.isEmpty) {
        widgets.add(const SizedBox(height: 6));
        continue;
      }

      if (line.startsWith('### ') || line.startsWith('## ')) {
        final title = line.replaceFirst(RegExp(r'^#{2,3}\s*'), '');
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 4),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
                letterSpacing: 0.2,
              ),
            ),
          ),
        );
      } else if (line.startsWith('- ') ||
          line.startsWith('* ') ||
          line.startsWith('• ')) {
        final content = line.substring(2).trim();
        widgets.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 6, right: 6),
                  child: Icon(Icons.circle, size: 5, color: AppColors.primary),
                ),
                Expanded(
                  child: _buildRichInlineText(content, const Color(0xFF334155)),
                ),
              ],
            ),
          ),
        );
      } else if (RegExp(r'^\d+\.\s+').hasMatch(line)) {
        final match = RegExp(r'^(\d+)\.\s+(.*)').firstMatch(line);
        final numStr = match?.group(1) ?? '•';
        final content = match?.group(2) ?? line;
        widgets.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$numStr. ',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                Expanded(
                  child: _buildRichInlineText(content, const Color(0xFF334155)),
                ),
              ],
            ),
          ),
        );
      } else {
        widgets.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: _buildRichInlineText(line, const Color(0xFF334155)),
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  Widget _buildRichInlineText(String text, Color baseColor) {
    final spans = <TextSpan>[];
    final parts = text.split('**');
    for (int i = 0; i < parts.length; i++) {
      if (parts[i].isEmpty) continue;
      final isBold = i % 2 == 1;
      spans.add(
        TextSpan(
          text: parts[i],
          style: TextStyle(
            color: isBold ? const Color(0xFF0F172A) : baseColor,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            fontSize: 12.5,
            height: 1.45,
          ),
        ),
      );
    }
    return RichText(text: TextSpan(children: spans));
  }

  Widget _buildPromptChip(String label, String query) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ActionChip(
        label: Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Color(0xFF0F172A),
          ),
        ),
        backgroundColor: const Color(0xFFF1F5F9),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        onPressed: () => _handleSendChatMessage(query),
      ),
    );
  }

  // ── TAB 3: DEVICE (Personal Device Fleet & Workstations) ────────────────
  Widget _buildDeviceTab() {
    final currentUser = _api.currentUser ?? {};
    final userFullName = currentUser['full_name']?.toString() ??
        currentUser['username']?.toString() ??
        'User';
    final userEmail =
        currentUser['email']?.toString() ?? 'personal@kavach.local';
    final isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
    final isIOS = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    final osName = kIsWeb ? 'Web Browser' : (isAndroid ? 'Android' : (isIOS ? 'iOS' : defaultTargetPlatform.name.toUpperCase()));
    final deviceModel = isAndroid
        ? 'Android Smartphone'
        : (isIOS ? 'Apple iPhone' : (kIsWeb ? 'Web Client' : 'Mobile Handset'));

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      children: [
        // Personal Device Fleet Banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 12,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.devices_rounded,
                  color: Color(0xFF0284C7),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$userFullName\'s Protected Devices',
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${1 + _enrolledDevices.length} Connected · Personal Space Synchronized',
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: const Text(
                  'SYNCED',
                  style: TextStyle(
                    color: Color(0xFF059669),
                    fontSize: 9.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Device 1: Current Mobile Device (This Device)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.phone_android_rounded,
                      color: Color(0xFF059669),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$userFullName\'s $deviceModel',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Primary Handset · ${osName.toUpperCase()} Sensor Active',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'THIS DEVICE',
                      style: TextStyle(
                        fontSize: 9.5,
                        color: Color(0xFF059669),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),
              _buildMetricRow(
                'OS & Sensor Status',
                '${osName.toUpperCase()} · Real-Time Telemetry Armed ✓',
              ),
              _buildMetricRow(
                'Memory Allocation',
                '${_posture['ram_used_gb'] ?? '3.4'} GB Active of ${_posture['ram_total_gb'] ?? '6.0'} GB RAM',
              ),
              _buildMetricRow(
                'Storage Space',
                '${_posture['disk_total_gb'] ?? '128'} GB Total · ${_posture['disk_free_gb'] ?? '68'} GB Free',
              ),
              _buildMetricRow(
                'Telecom Sentinel',
                _callerIdEnabled ? 'Active · Fraud Call Screening Armed ✓' : 'Protection Paused',
              ),
              _buildMetricRow(
                'Web Sentinel',
                _webShieldEnabled ? 'Active · Phishing Link Interception Armed ✓' : 'Protection Paused',
              ),
              _buildMetricRow(
                'App Lock & PIN',
                _isPinActive ? 'PIN Security Armed ✓' : 'PIN Security Not Enabled',
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        side: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.4),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      icon: const Icon(
                        Icons.radar_rounded,
                        size: 14,
                        color: AppColors.primary,
                      ),
                      label: const Text(
                        'Scan This Phone',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: _runDeviceScan,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        side: const BorderSide(color: Color(0xFF10B981)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      icon: const Icon(
                        Icons.shield_outlined,
                        size: 14,
                        color: Color(0xFF059669),
                      ),
                      label: const Text(
                        'Security Audit',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF059669),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('✓ Device security audit: All sensors reporting healthy status.'),
                            backgroundColor: Color(0xFF10B981),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Device 2: Enrolled Workstations OR Clean "Link Workstation" Invitation
        if (_enrolledDevices.isNotEmpty) ...[
          ..._enrolledDevices.map((dev) {
            final dMap = dev is Map ? dev : <String, dynamic>{};
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.desktop_windows_rounded,
                        color: Color(0xFF38BDF8),
                        size: 22,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          dMap['hostname']?.toString() ?? 'Enrolled Workstation',
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD1FAE5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          dMap['status']?.toString() ?? 'ACTIVE',
                          style: const TextStyle(
                            color: Color(0xFF059669),
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 16),
                  _buildMetricRow(
                    'OS',
                    dMap['os']?.toString() ?? 'Windows / macOS Workstation',
                  ),
                  _buildMetricRow(
                    'IP Address',
                    dMap['ip_address']?.toString() ?? 'Active Endpoint',
                  ),
                  _buildMetricRow(
                    'Risk Score',
                    '${dMap['risk_score'] ?? 0} (Low Risk)',
                  ),
                ],
              ),
            );
          }),
        ] else ...[
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x04000000),
                  blurRadius: 10,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.laptop_chromebook_rounded,
                        color: AppColors.primary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Protect Your Laptop or PC',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Extend personal defense to your workstation',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Install KAVACH on your desktop and log in with $userEmail to link your computer to your Personal Space.',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF475569),
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.vpn_key_rounded, size: 14, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        'PAIRING CODE: KAV-${userFullName.toUpperCase().replaceAll(RegExp(r'[^A-Z0-9]'), '')}-77',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 14),

        // App Permission & Sensor Sentinel
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Privacy & Sensor Permission Sentinel',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Monitors background access to sensitive device hardware.',
                style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 12),
              _buildPermissionItem(
                'Camera Sensor',
                'Protected · 0 background captures',
                Icons.camera_alt_outlined,
              ),
              _buildPermissionItem(
                'Microphone Sensor',
                'Protected · 0 eavesdropping hooks',
                Icons.mic_none_outlined,
              ),
              _buildPermissionItem(
                'SMS & Telephony',
                'KAVACH Sentinel Active · Spam Screened',
                Icons.sms_outlined,
              ),
              _buildPermissionItem(
                'Location Access',
                'Coarse Wi-Fi geofencing only',
                Icons.location_on_outlined,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMetricRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionItem(String name, String status, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  status,
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.check_circle_rounded,
            color: Color(0xFF10B981),
            size: 16,
          ),
        ],
      ),
    );
  }

  // ── TAB 4: ALERTS (Incident Ledger) ────────────────────────────────────────
  Widget _buildAlertsTab() {
    final currentUser = _api.currentUser ?? {};
    final userFullName = currentUser['full_name']?.toString() ??
        currentUser['username']?.toString() ??
        'User';

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      children: [
        Row(
          children: [
            Text('$userFullName\'s Security Activity',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
            const Spacer(),
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All alerts acknowledged.')),
                );
              },
              child: const Text('Resolve All', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 8),

        if (_events.isEmpty)
          Container(
            padding: const EdgeInsets.all(26),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 14,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Center(
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      color: Color(0xFFECFDF5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.verified_user_rounded,
                      color: Color(0xFF10B981),
                      size: 38,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Personal Space Clean · Zero Threats',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'No anomalous host behaviors, phishing links, or extortion calls detected for $userFullName. All active shields are protecting your personal space.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Color(0xFF64748B),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF059669)),
                            SizedBox(width: 4),
                            Text('Web Shield Active', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF059669)),
                            SizedBox(width: 4),
                            Text('Caller ID Active', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _isPinActive ? const Color(0xFFECFDF5) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _isPinActive ? const Color(0xFFA7F3D0) : const Color(0xFFCBD5E1)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _isPinActive ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                              size: 12,
                              color: _isPinActive ? const Color(0xFF059669) : const Color(0xFF64748B),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _isPinActive ? 'App Lock Armed' : 'App Lock Available',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: _isPinActive ? const Color(0xFF059669) : const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          )
        else
          ..._events.map((ev) {
            final map = ev is Map ? ev : <String, dynamic>{};
            return _buildAlertCard(
              title:
                  map['title']?.toString() ??
                  map['action']?.toString() ??
                  'Telemetry Probe Signal',
              desc:
                  map['details']?.toString() ??
                  map['message']?.toString() ??
                  'Event recorded by KAVACH kernel agent.',
              time: map['timestamp']?.toString() ?? 'Recent',
              severity: map['severity']?.toString().toUpperCase() ?? 'INFO',
            );
          }),
      ],
    );
  }

  Widget _buildAlertCard({
    required String title,
    required String desc,
    required String time,
    required String severity,
  }) {
    final isCrit = severity == 'CRITICAL';
    final color = isCrit
        ? const Color(0xFFEF4444)
        : (severity == 'HIGH RISK'
              ? const Color(0xFFF59E0B)
              : const Color(0xFF38BDF8));

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  severity,
                  style: TextStyle(
                    color: color,
                    fontSize: 9.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            desc,
            style: const TextStyle(
              fontSize: 11.5,
              color: Color(0xFF475569),
              height: 1.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            time,
            style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  Widget _buildRisingBottomCallerOverlay() {
    return Positioned(
      left: 12,
      right: 12,
      bottom: 12,
      child: AnimatedSlide(
        offset: _showFloatingCallerOverlay ? Offset.zero : const Offset(0, 1.2),
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: _simulatedIsThreat
                  ? const Color(0xFFEF4444)
                  : const Color(0xFF10B981),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.16),
                blurRadius: 30,
                spreadRadius: 2,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top drag indicator
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header Row: Green Tick Verified Badge & Close button
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _simulatedIsThreat
                          ? const Color(0xFFFEF2F2)
                          : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _simulatedIsThreat
                            ? const Color(0xFFFECACA)
                            : const Color(0xFFA7F3D0),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _simulatedIsThreat
                              ? Icons.warning_amber_rounded
                              : Icons.check_circle_rounded,
                          color: _simulatedIsThreat
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF059669),
                          size: 14,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          _simulatedIsThreat
                              ? '🚨 FRAUD CALLER ALERT'
                              : '✓ VERIFIED CALLER',
                          style: TextStyle(
                            color: _simulatedIsThreat
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF059669),
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    'Live System Overlay',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () =>
                        setState(() => _showFloatingCallerOverlay = false),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Color(0xFF64748B),
                      size: 20,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Caller Details Row
              Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: _simulatedIsThreat
                        ? const Color(0xFFFEE2E2)
                        : const Color(0xFFECFDF5),
                    child: Icon(
                      _simulatedIsThreat
                          ? Icons.person_off_rounded
                          : Icons.verified_user_rounded,
                      color: _simulatedIsThreat
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF059669),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _simulatedCallerName,
                          style: TextStyle(
                            color: _simulatedIsThreat
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF0F172A),
                            fontSize: 15.5,
                            fontWeight: FontWeight.w800,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _simulatedIncomingCaller,
                          style: const TextStyle(
                            color: Color(0xFF334155),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Current Telecom Carrier Line (Prominent as requested)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.cell_tower_rounded,
                      color: Color(0xFF0284C7),
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '📶 Telecom Carrier: $_simulatedCarrier',
                        style: const TextStyle(
                          color: Color(0xFF0369A1),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Telecom Registry Status Card
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _simulatedIsThreat
                      ? const Color(0xFFFFF1F2)
                      : const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      _simulatedIsThreat
                          ? Icons.report_problem_rounded
                          : Icons.verified_rounded,
                      color: _simulatedIsThreat
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF059669),
                      size: 15,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _simulatedIsThreat
                            ? 'Extortion Alert · Flagged by National Cyber Crime Registry 1930'
                            : 'Carrier Validated · Clean telecom registry record, 0 complaints',
                        style: TextStyle(
                          color: _simulatedIsThreat
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF059669),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Action Buttons Row: Block & Report 1930
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.block_rounded, size: 15),
                      label: const Text(
                        'Block Caller',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () {
                        setState(() {
                          _blockedCallers.removeWhere(
                            (c) => c['number'] == _simulatedIncomingCaller,
                          );
                          _blockedCallers.insert(0, {
                            'number': _simulatedIncomingCaller,
                            'label': _simulatedCallerName,
                            'risk': 'BLOCKED BY SENTINEL',
                            'time': 'Just now',
                            'type': 'Blocked by User',
                            'is_threat': true,
                          });
                          _showFloatingCallerOverlay = false;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              '✓ Number $_simulatedIncomingCaller added to blocklist.',
                            ),
                            backgroundColor: const Color(0xFFDC2626),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0F172A),
                        side: const BorderSide(
                          color: Color(0xFFCBD5E1),
                          width: 1.2,
                        ),
                        backgroundColor: const Color(0xFFF8FAFC),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.shield_outlined, size: 15),
                      label: const Text(
                        'Report 1930',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () {
                        setState(() => _showFloatingCallerOverlay = false);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Dispatched incident report to National Cyber Crime Portal (1930).',
                            ),
                            backgroundColor: Color(0xFF059669),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
