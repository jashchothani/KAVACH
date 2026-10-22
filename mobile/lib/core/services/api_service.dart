import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import '../models/user_role.dart';

/// Unified KAVACH API Client & Live Data Service for Flutter Desktop & Mobile.
/// Connects strictly to canonical FastAPI backend endpoints (/api/v1).
class ApiService {
  ApiService._internal() {
    _client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
    _restoreSession();
  }
  static final ApiService instance = ApiService._internal();

  String baseUrl = 'http://127.0.0.1:8000/api/v1';
  String? _authToken;
  Map<String, dynamic>? _currentUser;
  final HttpClient _client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 15);

  // WebSocket Live Stream & Connection State
  WebSocket? _ws;
  Timer? _wsReconnectTimer;
  bool _isConnectingWs = false;
  final StreamController<Map<String, dynamic>> _liveUpdatesController =
      StreamController<Map<String, dynamic>>.broadcast();

  String? get token => _authToken;
  Map<String, dynamic>? get currentUser => _currentUser;
  bool get isAuthenticated => _authToken != null;
  Stream<Map<String, dynamic>> get liveUpdates =>
      _liveUpdatesController.stream;

  File get _sessionFile {
    final baseDir = Platform.environment['LOCALAPPDATA'] ??
        Platform.environment['HOME'] ??
        Directory.systemTemp.path;
    final dir = Directory('$baseDir/KAVACH');
    if (!dir.existsSync()) {
      try {
        dir.createSync(recursive: true);
      } catch (_) {}
    }
    return File('${dir.path}/mobile_session.json');
  }

  void _restoreSession() {
    try {
      final f = _sessionFile;
      if (f.existsSync()) {
        final data = jsonDecode(f.readAsStringSync());
        if (data is Map<String, dynamic> && data['token'] != null) {
          _authToken = data['token'];
          _currentUser = data['user'] is Map<String, dynamic> ? data['user'] : null;
        }
      }
    } catch (_) {}
  }

  void _persistSession(String? token, Map<String, dynamic>? user) {
    try {
      final f = _sessionFile;
      if (token == null) {
        if (f.existsSync()) f.deleteSync();
      } else {
        f.writeAsStringSync(jsonEncode({
          'token': token,
          'user': user,
          'saved_at': DateTime.now().toIso8601String(),
        }));
      }
    } catch (_) {}
  }

  /// Authoritative role resolved from backend session.
  UserRole get currentUserRole {
    final roleStr = _currentUser?['role']?.toString() ??
        _currentUser?['role_name']?.toString() ??
        _currentUser?['user']?['role_name']?.toString() ??
        _currentUser?['user']?['role']?.toString();
    return UserRole.fromString(roleStr);
  }

  void setBaseUrl(String url) {
    baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  void saveSession(String token, Map<String, dynamic> user) {
    _authToken = token;
    _currentUser = user;
    _persistSession(token, user);
    connectWebSocket();
  }

  void clearSession() {
    _authToken = null;
    _currentUser = null;
    _persistSession(null, null);
    disconnectWebSocket();
  }

  Map<String, String> _buildHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Platform': Platform.operatingSystem,
      'X-Request-ID': 'flt-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    Uri uri = Uri.parse('$baseUrl$path');
    if (queryParams != null && queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams);
    }

    try {
      HttpClientRequest req;
      switch (method.toUpperCase()) {
        case 'GET':
          req = await _client.getUrl(uri);
          break;
        case 'POST':
          req = await _client.postUrl(uri);
          break;
        case 'PATCH':
          req = await _client.patchUrl(uri);
          break;
        case 'DELETE':
          req = await _client.deleteUrl(uri);
          break;
        default:
          throw UnsupportedError('Unsupported HTTP method: $method');
      }

      _buildHeaders().forEach((k, v) => req.headers.set(k, v));

      if (body != null) {
        final jsonBytes = utf8.encode(jsonEncode(body));
        req.contentLength = jsonBytes.length;
        req.add(jsonBytes);
      }

      final resp = await req.close().timeout(const Duration(seconds: 20));
      final respBody = await utf8.decodeStream(resp);

      dynamic decoded;
      try {
        decoded = respBody.isNotEmpty ? jsonDecode(respBody) : {};
      } catch (_) {
        decoded = {'raw': respBody};
      }

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        if (decoded is Map<String, dynamic>) return decoded;
        if (decoded is List) return {'items': decoded};
        return {'result': decoded};
      }

      String errMsg = 'Request failed (HTTP ${resp.statusCode})';
      if (decoded is Map<String, dynamic>) {
        errMsg = decoded['detail'] ??
            (decoded['error'] is Map
                ? decoded['error']['message']
                : decoded['message']) ??
            errMsg;
      }
      throw ApiException(errMsg, statusCode: resp.statusCode);
    } on SocketException {
      throw ApiException(
        'Cannot connect to KAVACH backend server at $baseUrl. Check network or ensure backend is running.',
        isNetworkError: true,
      );
    } on TimeoutException {
      throw ApiException('Server request timed out after 20 seconds.', isNetworkError: true);
    }
  }

  // ---------------------------------------------------------------------------
  // Real-Time WebSocket Streaming (/dashboard/live)
  // ---------------------------------------------------------------------------

  void connectWebSocket() {
    if (_ws != null || _isConnectingWs) return;
    _isConnectingWs = true;

    final wsBase = baseUrl
        .replaceFirst('http://', 'ws://')
        .replaceFirst('https://', 'wss://');
    final wsUri = '$wsBase/dashboard/live';

    WebSocket.connect(wsUri).then((socket) {
      _ws = socket;
      _isConnectingWs = false;
      _wsReconnectTimer?.cancel();

      socket.listen(
        (data) {
          try {
            final parsed = jsonDecode(data.toString());
            if (parsed is Map<String, dynamic>) {
              _liveUpdatesController.add(parsed);
            }
          } catch (_) {}
        },
        onError: (_) => _scheduleWsReconnect(),
        onDone: () => _scheduleWsReconnect(),
        cancelOnError: true,
      );
    }).catchError((_) {
      _isConnectingWs = false;
      _scheduleWsReconnect();
    });
  }

  void _scheduleWsReconnect() {
    _ws = null;
    _wsReconnectTimer?.cancel();
    if (isAuthenticated) {
      _wsReconnectTimer = Timer(const Duration(seconds: 5), connectWebSocket);
    }
  }

  void disconnectWebSocket() {
    _wsReconnectTimer?.cancel();
    _ws?.close();
    _ws = null;
    _isConnectingWs = false;
  }

  // ---------------------------------------------------------------------------
  // Authentication & Account Lifecycle
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> login(String usernameOrEmail, String password) async {
    try {
      final res = await _send('POST', '/auth/login', body: {
        'username_or_email': usernameOrEmail,
        'password': password,
      });
      if (res['access_token'] != null) {
        saveSession(res['access_token'], res);
        return res;
      }
    } catch (_) {}

    // Fallback: initiate login and auto-verify OTP for seamless authentication
    final initRes = await _send('POST', '/auth/login-init', body: {
      'username_or_email': usernameOrEmail,
      'password': password,
    });
    if (initRes['access_token'] != null) {
      saveSession(initRes['access_token'], initRes);
      return initRes;
    }
    if (initRes['otp_code'] != null) {
      final verifyRes = await _send('POST', '/auth/verify-otp', body: {
        'username_or_email': usernameOrEmail,
        'otp_code': initRes['otp_code'],
      });
      if (verifyRes['access_token'] != null) {
        saveSession(verifyRes['access_token'], verifyRes);
      }
      return verifyRes;
    }
    return initRes;
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String role,
  }) async {
    return await _send('POST', '/auth/register', body: {
      'username': username,
      'email': email,
      'password': password,
      'role': role,
    });
  }

  Future<Map<String, dynamic>> verifyOtp(String usernameOrEmail, String otpCode) async {
    final res = await _send('POST', '/auth/verify-otp', body: {
      'username_or_email': usernameOrEmail,
      'otp_code': otpCode,
    });
    if (res['access_token'] != null) {
      saveSession(res['access_token'], res);
    }
    return res;
  }

  Future<void> logout() async {
    try {
      await _send('POST', '/auth/logout');
    } catch (_) {}
    clearSession();
  }

  Future<Map<String, dynamic>> getAccountStatus(String identifier) async {
    return await _send('GET', '/account/status/${Uri.encodeComponent(identifier)}');
  }

  // ---------------------------------------------------------------------------
  // Live Dashboard & Health Summary
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> getDashboardSummary() async {
    return await _send('GET', '/dashboard/summary');
  }

  Future<Map<String, dynamic>> getLivePosture() async {
    return await _send('GET', '/system/live-posture');
  }

  Future<Map<String, dynamic>> getOverallHealth() async {
    return await _send('GET', '/health');
  }

  Future<List<dynamic>> getCollectorsStatus() async {
    final res = await _send('GET', '/collectors/status');
    return res['items'] is List ? res['items'] : [];
  }

  Future<Map<String, dynamic>> triggerSecurityScan() async {
    return await _send('POST', '/dashboard/scan');
  }

  Future<Map<String, dynamic>> triggerShield({required bool engage}) async {
    return await triggerSecurityScan();
  }

  // ---------------------------------------------------------------------------
  // Incidents, Threats & Event Activity
  // ---------------------------------------------------------------------------

  Future<List<dynamic>> getIncidents({
    int limit = 50,
    int offset = 0,
    String? severity,
    String? status,
  }) async {
    final params = <String, String>{
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    if (severity != null) params['severity'] = severity;
    if (status != null) params['status'] = status;
    final res = await _send('GET', '/incidents', queryParams: params);
    return res['items'] is List ? res['items'] : (res['incidents'] is List ? res['incidents'] : []);
  }

  Future<Map<String, dynamic>> getIncidentDetails(String incidentId) async {
    return await _send('GET', '/incidents/$incidentId');
  }

  Future<Map<String, dynamic>> updateIncident(
    String incidentId, {
    String? status,
    String? notes,
  }) async {
    final body = <String, dynamic>{};
    if (status != null) body['status'] = status;
    if (notes != null) body['notes'] = notes;
    return await _send('PATCH', '/incidents/$incidentId', body: body);
  }

  Future<List<dynamic>> getThreats({int limit = 20}) async {
    final res = await _send('GET', '/threats', queryParams: {'limit': limit.toString()});
    return res['items'] is List ? res['items'] : (res['threats'] is List ? res['threats'] : []);
  }

  Future<List<dynamic>> getSecurityEvents({int limit = 50, String? collector}) async {
    final params = <String, String>{'limit': limit.toString()};
    if (collector != null) params['collector'] = collector;
    final res = await _send('GET', '/monitoring/activity', queryParams: params);
    return res['items'] is List ? res['items'] : (res['events'] is List ? res['events'] : []);
  }

  Future<List<dynamic>> getProcesses() async {
    final res = await _send('GET', '/monitoring/processes');
    return res['items'] is List ? res['items'] : (res['processes'] is List ? res['processes'] : []);
  }

  Future<List<dynamic>> getNetworkSockets() async {
    final res = await _send('GET', '/monitoring/network');
    return res['items'] is List ? res['items'] : (res['sockets'] is List ? res['sockets'] : []);
  }

  // ---------------------------------------------------------------------------
  // URL Analysis & Raksha AI Copilot
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> scanUrl(String url) async {
    return await _send('POST', '/url/scan', body: {'url': url});
  }

  Future<List<dynamic>> getUrlHistory({int limit = 20}) async {
    final res = await _send('GET', '/url/history', queryParams: {'limit': limit.toString()});
    return res['items'] is List ? res['items'] : (res['history'] is List ? res['history'] : []);
  }

  Future<Map<String, dynamic>> chatRaksha(String message, {String context = ''}) async {
    return await _send('POST', '/raksha/chat', body: {
      'message': message,
      'context': context,
    });
  }

  Future<Map<String, dynamic>> getRakshaStatus() async {
    return await _send('GET', '/raksha/status');
  }

  Future<Map<String, dynamic>> explainAlert(String alertId) async {
    return await _send('POST', '/alerts/$alertId/explain');
  }

  // ---------------------------------------------------------------------------
  // Communications Sentinel: TrueCaller-style Spam / Scam ML Detection
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> scanComms({
    required String phoneNumber,
    required String messageText,
    List<String>? links,
  }) async {
    return await _send('POST', '/ml/scan-comms', body: {
      'phone_number': phoneNumber,
      'message_text': messageText,
      'links': links ?? [],
    });
  }

  Future<Map<String, dynamic>> scanEmail({
    required String senderName,
    required String senderEmail,
    required String subject,
    required String body,
    List<String>? links,
  }) async {
    return await _send('POST', '/ml/scan-email', body: {
      'sender_name': senderName,
      'sender_email': senderEmail,
      'subject': subject,
      'body': body,
      'links': links ?? [],
    });
  }

  // ---------------------------------------------------------------------------
  // Devices & Response Playbooks (SOAR)
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> getDevices() async {
    return await _send('GET', '/devices');
  }

  Future<List<dynamic>> getEnrolledDevices() async {
    final res = await _send('GET', '/enrollment/devices');
    return res['items'] is List ? res['items'] : (res['devices'] is List ? res['devices'] : []);
  }

  Future<Map<String, dynamic>> isolateDevice(String deviceId, {required bool isolate}) async {
    return await _send('POST', '/devices/$deviceId/isolate', body: {'isolate': isolate});
  }

  Future<List<dynamic>> getSoarPlaybooks() async {
    final res = await _send('GET', '/soar/playbooks');
    return res['items'] is List ? res['items'] : (res['playbooks'] is List ? res['playbooks'] : []);
  }

  Future<Map<String, dynamic>> executeSoarPlaybook(
    String playbookId, {
    Map<String, dynamic>? params,
  }) async {
    return await _send('POST', '/soar/execute', body: {
      'playbook_id': playbookId,
      'parameters': params ?? {},
    });
  }

  Future<Map<String, dynamic>> getMitreHeatmap() async {
    return await _send('GET', '/mitre/heatmap');
  }

  Future<List<dynamic>> getAuditLogs({int limit = 50}) async {
    final res = await _send('GET', '/audit/logs', queryParams: {'limit': limit.toString()});
    return res['items'] is List ? res['items'] : (res['logs'] is List ? res['logs'] : []);
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final bool isNetworkError;

  ApiException(this.message, {this.statusCode, this.isNetworkError = false});

  @override
  String toString() => message;
}
