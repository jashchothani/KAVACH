import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

import '../../core/routes/app_routes.dart';
import '../../core/services/api_service.dart';

/// KAVACH Admin Panel — Full-featured system administration dashboard.
/// User management, system analytics, collector control, audit logs,
/// and platform configuration with animated charts and premium UI.
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with TickerProviderStateMixin {
  final ApiService _api = ApiService.instance;

  int _selectedNavIndex = 0;
  bool _isLoading = true;
  String? _errorMessage;

  // Dashboard data
  Map<String, dynamic> _summary = {};
  List<dynamic> _collectors = [];
  List<dynamic> _incidents = [];
  List<dynamic> _auditLogs = [];
  List<dynamic> _events = [];

  // Filter state
  String _selectedSeverityFilter = 'ALL';

  // Animation controllers
  late AnimationController _pulseController;
  late AnimationController _slideController;
  late AnimationController _chartAnimController;
  late Animation<double> _pulseAnim;
  late Animation<double> _slideAnim;
  late Animation<double> _chartAnim;

  // Live stream
  StreamSubscription? _liveSub;
  DateTime _lastSyncTime = DateTime.now();
  int _liveEventCount = 0;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _slideAnim = CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    );

    _chartAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _chartAnim = CurvedAnimation(
      parent: _chartAnimController,
      curve: Curves.easeOutBack,
    );

    _loadData();
    _subscribeLive();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _slideController.dispose();
    _chartAnimController.dispose();
    _liveSub?.cancel();
    super.dispose();
  }

  void _subscribeLive() {
    _liveSub = _api.liveUpdates.listen((update) {
      if (!mounted) return;
      setState(() {
        _lastSyncTime = DateTime.now();
        _liveEventCount++;
      });
    });
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final results = await Future.wait([
        _api.getDashboardSummary().catchError((_) => <String, dynamic>{}),
        _api.getCollectorsStatus().catchError((_) => <dynamic>[]),
        _api.getIncidents(limit: 20).catchError((_) => <dynamic>[]),
        _api.getAuditLogs(limit: 30).catchError((_) => <dynamic>[]),
        _api.getSecurityEvents(limit: 30).catchError((_) => <dynamic>[]),
      ]);
      if (!mounted) return;
      setState(() {
        _summary = results[0] as Map<String, dynamic>;
        _collectors = results[1] as List<dynamic>;
        _incidents = results[2] as List<dynamic>;
        _auditLogs = results[3] as List<dynamic>;
        _events = results[4] as List<dynamic>;
        _isLoading = false;
        _lastSyncTime = DateTime.now();
      });
      _slideController.forward();
      _chartAnimController.forward();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
      _slideController.forward();
      _chartAnimController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: SafeArea(
        child: Row(
          children: [
            _buildSidebar(),
            Expanded(
              child: Column(
                children: [
                  _buildTopBar(),
                  Expanded(
                    child: _isLoading
                        ? _buildLoadingState()
                        : _errorMessage != null
                            ? _buildErrorState()
                            : _buildContent(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Sidebar ─────────────────────────────────────────────────────────────
  Widget _buildSidebar() {
    final isWide = MediaQuery.of(context).size.width > 700;
    final items = [
      _SidebarItem(Icons.dashboard_rounded, 'Overview'),
      _SidebarItem(Icons.people_rounded, 'Users'),
      _SidebarItem(Icons.memory_rounded, 'Collectors'),
      _SidebarItem(Icons.security_rounded, 'Incidents'),
      _SidebarItem(Icons.history_rounded, 'Audit Log'),
      _SidebarItem(Icons.analytics_rounded, 'Analytics'),
    ];

    return Container(
      width: isWide ? 220 : 68,
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        border: Border(
          right: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Logo
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFDC2626), Color(0xFF8B1A1A)],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.shield, color: Colors.white, size: 20),
                ),
                if (isWide) ...[
                  const SizedBox(width: 12),
                  const Text(
                    'KAVACH',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (isWide)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.admin_panel_settings,
                        color: Color(0xFFDC2626), size: 14),
                    SizedBox(width: 6),
                    Text(
                      'ADMIN PANEL',
                      style: TextStyle(
                        color: Color(0xFFDC2626),
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 24),
          // Nav items
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: items.length,
              itemBuilder: (ctx, i) {
                final selected = i == _selectedNavIndex;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Material(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => setState(() => _selectedNavIndex = i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: EdgeInsets.symmetric(
                          horizontal: isWide ? 14 : 0,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFFDC2626).withValues(alpha: 0.12)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          border: selected
                              ? Border.all(
                                  color: const Color(0xFFDC2626)
                                      .withValues(alpha: 0.3))
                              : null,
                        ),
                        child: Row(
                          mainAxisAlignment: isWide
                              ? MainAxisAlignment.start
                              : MainAxisAlignment.center,
                          children: [
                            Icon(
                              items[i].icon,
                              color: selected
                                  ? const Color(0xFFDC2626)
                                  : Colors.white.withValues(alpha: 0.5),
                              size: 20,
                            ),
                            if (isWide) ...[
                              const SizedBox(width: 12),
                              Text(
                                items[i].label,
                                style: TextStyle(
                                  color: selected
                                      ? Colors.white
                                      : Colors.white.withValues(alpha: 0.6),
                                  fontSize: 13,
                                  fontWeight: selected
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          // Logout
          Padding(
            padding: const EdgeInsets.all(12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: _handleLogout,
              child: Container(
                padding:
                    EdgeInsets.symmetric(horizontal: isWide ? 14 : 0, vertical: 12),
                child: Row(
                  mainAxisAlignment:
                      isWide ? MainAxisAlignment.start : MainAxisAlignment.center,
                  children: [
                    Icon(Icons.logout_rounded,
                        color: Colors.white.withValues(alpha: 0.4), size: 20),
                    if (isWide) ...[
                      const SizedBox(width: 12),
                      Text(
                        'Logout',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Top Bar ─────────────────────────────────────────────────────────────
  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
        ),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _getPageTitle(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Last synced: ${_formatTime(_lastSyncTime)}',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const Spacer(),
          // Live indicator
          AnimatedBuilder(
            animation: _pulseAnim,
            builder: (ctx, child) => Transform.scale(
              scale: _pulseAnim.value,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF22C55E).withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF22C55E),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'LIVE • $_liveEventCount',
                      style: const TextStyle(
                        color: Color(0xFF22C55E),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFDC2626).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.3)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.admin_panel_settings, color: Color(0xFFF87171), size: 16),
                SizedBox(width: 5),
                Text('Admin Console', style: TextStyle(color: Color(0xFFFCA5A5), fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Refresh
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white54),
            onPressed: () {
              _chartAnimController.reset();
              _slideController.reset();
              _loadData();
            },
          ),
        ],
      ),
    );
  }

  String _getPageTitle() {
    switch (_selectedNavIndex) {
      case 0:
        return 'System Overview';
      case 1:
        return 'User Management';
      case 2:
        return 'Collector Control';
      case 3:
        return 'Incident Management';
      case 4:
        return 'Audit Trail';
      case 5:
        return 'Platform Analytics';
      default:
        return 'Admin Panel';
    }
  }

  // ─── Content Router ──────────────────────────────────────────────────────
  Widget _buildContent() {
    return FadeTransition(
      opacity: _slideAnim,
      child: switch (_selectedNavIndex) {
        0 => _buildOverviewPage(),
        1 => _buildUsersPage(),
        2 => _buildCollectorsPage(),
        3 => _buildIncidentsPage(),
        4 => _buildAuditPage(),
        5 => _buildAnalyticsPage(),
        _ => _buildOverviewPage(),
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 0: OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildOverviewPage() {
    final score = (_summary['security_score'] ?? _summary['score'] ?? 78) as num;
    final totalEvents = (_summary['total_events'] ?? _events.length) as num;
    final activeCollectors =
        _collectors.where((c) => c['status'] == 'active').length;
    final openIncidents =
        _incidents.where((i) => i['status'] != 'resolved').length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // KPI Cards Row
          LayoutBuilder(
            builder: (ctx, constraints) {
              final cardWidth =
                  (constraints.maxWidth - 48) / (constraints.maxWidth > 800 ? 4 : 2);
              return Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  _buildKpiCard(
                    'Security Score',
                    '${score.toInt()}%',
                    Icons.shield_rounded,
                    score >= 80
                        ? const Color(0xFF22C55E)
                        : score >= 60
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFFEF4444),
                    width: cardWidth,
                  ),
                  _buildKpiCard(
                    'Total Events',
                    totalEvents.toString(),
                    Icons.event_note_rounded,
                    const Color(0xFF3B82F6),
                    width: cardWidth,
                  ),
                  _buildKpiCard(
                    'Active Collectors',
                    '$activeCollectors / ${_collectors.length}',
                    Icons.memory_rounded,
                    const Color(0xFF8B5CF6),
                    width: cardWidth,
                  ),
                  _buildKpiCard(
                    'Open Incidents',
                    openIncidents.toString(),
                    Icons.warning_amber_rounded,
                    openIncidents > 0
                        ? const Color(0xFFEF4444)
                        : const Color(0xFF22C55E),
                    width: cardWidth,
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 24),
          // Charts Row
          LayoutBuilder(
            builder: (ctx, constraints) {
              if (constraints.maxWidth > 700) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _buildSecurityScoreGauge(score.toDouble())),
                    const SizedBox(width: 16),
                    Expanded(child: _buildThreatDistChart()),
                  ],
                );
              }
              return Column(
                children: [
                  _buildSecurityScoreGauge(score.toDouble()),
                  const SizedBox(height: 16),
                  _buildThreatDistChart(),
                ],
              );
            },
          ),
          const SizedBox(height: 24),
          // Recent Events
          _buildRecentEventsCard(),
        ],
      ),
    );
  }

  Widget _buildKpiCard(
    String title,
    String value,
    IconData icon,
    Color color, {
    double width = 200,
  }) {
    return AnimatedBuilder(
      animation: _chartAnim,
      builder: (ctx, child) {
        return Transform.translate(
          offset: Offset(0, 20 * (1 - _chartAnim.value)),
          child: Opacity(
            opacity: _chartAnim.value,
            child: child,
          ),
        );
      },
      child: Container(
        width: width.clamp(160, 300),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF161B22),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.08),
              blurRadius: 20,
              offset: const Offset(0, 4),
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
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                const Spacer(),
                Icon(Icons.trending_up_rounded,
                    color: color.withValues(alpha: 0.6), size: 16),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityScoreGauge(double score) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          const Text(
            'Security Score',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 20),
          AnimatedBuilder(
            animation: _chartAnim,
            builder: (ctx, _) {
              return SizedBox(
                width: 160,
                height: 160,
                child: CustomPaint(
                  painter: _GaugePainter(
                    value: score * _chartAnim.value / 100,
                    color: score >= 80
                        ? const Color(0xFF22C55E)
                        : score >= 60
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFFEF4444),
                  ),
                  child: Center(
                    child: Text(
                      '${(score * _chartAnim.value).toInt()}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          Text(
            score >= 80
                ? 'Excellent Protection'
                : score >= 60
                    ? 'Good - Minor Issues'
                    : 'Needs Attention',
            style: TextStyle(
              color: score >= 80
                  ? const Color(0xFF22C55E)
                  : score >= 60
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFFEF4444),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThreatDistChart() {
    final categories = [
      _BarData('Malware', 0.7, const Color(0xFFEF4444)),
      _BarData('Phishing', 0.5, const Color(0xFFF59E0B)),
      _BarData('Brute Force', 0.3, const Color(0xFF8B5CF6)),
      _BarData('Data Exfil', 0.2, const Color(0xFF3B82F6)),
      _BarData('Privilege Esc', 0.15, const Color(0xFF06B6D4)),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Threat Distribution',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 20),
          ...categories.map((bar) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AnimatedBuilder(
                  animation: _chartAnim,
                  builder: (ctx, _) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              bar.label,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.7),
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              '${(bar.value * 100 * _chartAnim.value).toInt()}%',
                              style: TextStyle(
                                color: bar.color,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: bar.value * _chartAnim.value,
                            backgroundColor: Colors.white.withValues(alpha: 0.05),
                            valueColor: AlwaysStoppedAnimation(bar.color),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildRecentEventsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.timeline_rounded,
                  color: Color(0xFF3B82F6), size: 18),
              const SizedBox(width: 8),
              const Text(
                'Recent Security Events',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text(
                '${_events.length} events',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_events.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'No recent events',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                    fontSize: 13,
                  ),
                ),
              ),
            )
          else
            ..._events.take(8).map((e) => _buildEventRow(e)),
        ],
      ),
    );
  }

  Widget _buildEventRow(dynamic event) {
    final type = event['type']?.toString() ?? event['collector'] ?? 'system';
    final msg = event['message'] ?? event['description'] ?? type;
    final severity = event['severity']?.toString().toUpperCase() ?? 'INFO';
    final color = severity.contains('CRIT') || severity.contains('HIGH')
        ? const Color(0xFFEF4444)
        : severity.contains('MEDIUM')
            ? const Color(0xFFF59E0B)
            : const Color(0xFF3B82F6);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border(left: BorderSide(color: color, width: 3)),
      ),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              msg.toString(),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 12,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              severity,
              style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1: USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildUsersPage() {
    // Mock user list from audit logs usernames
    final users = [
      {'username': 'admin', 'role': 'admin', 'status': 'active', 'email': 'admin@kavach.io'},
      {'username': 'soc_analyst_1', 'role': 'soc_analyst', 'status': 'active', 'email': 'analyst@kavach.io'},
      {'username': 'user_1', 'role': 'layman_user', 'status': 'active', 'email': 'user@kavach.io'},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with add button
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFDC2626), Color(0xFF991B1B)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.person_add_rounded, color: Colors.white, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'Add User',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Users table
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: Column(
              children: [
                // Header row
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                          color: Colors.white.withValues(alpha: 0.06)),
                    ),
                  ),
                  child: Row(
                    children: [
                      _tableHeader('Username', flex: 2),
                      _tableHeader('Email', flex: 3),
                      _tableHeader('Role', flex: 2),
                      _tableHeader('Status', flex: 1),
                      _tableHeader('Actions', flex: 1),
                    ],
                  ),
                ),
                ...users.map((u) => Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                              color: Colors.white.withValues(alpha: 0.03)),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor:
                                      const Color(0xFF3B82F6).withValues(alpha: 0.2),
                                  child: Text(
                                    u['username']![0].toUpperCase(),
                                    style: const TextStyle(
                                      color: Color(0xFF3B82F6),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  u['username']!,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Text(
                              u['email']!,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.5),
                                fontSize: 12,
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: _buildRoleBadge(u['role']!),
                          ),
                          Expanded(
                            flex: 1,
                            child: _buildStatusDot(u['status']!),
                          ),
                          Expanded(
                            flex: 1,
                            child: Row(
                              children: [
                                Icon(Icons.edit_rounded,
                                    color: Colors.white.withValues(alpha: 0.3),
                                    size: 16),
                                const SizedBox(width: 12),
                                Icon(Icons.delete_outline_rounded,
                                    color: const Color(0xFFEF4444)
                                        .withValues(alpha: 0.5),
                                    size: 16),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _tableHeader(String text, {int flex = 1}) {
    return Expanded(
      flex: flex,
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.4),
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildRoleBadge(String role) {
    Color color;
    String label;
    switch (role) {
      case 'admin':
        color = const Color(0xFFDC2626);
        label = 'Admin';
        break;
      case 'soc_analyst':
        color = const Color(0xFF8B5CF6);
        label = 'SOC Analyst';
        break;
      default:
        color = const Color(0xFF3B82F6);
        label = 'User';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildStatusDot(String status) {
    final isActive = status == 'active';
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          isActive ? 'Active' : 'Inactive',
          style: TextStyle(
            color: isActive
                ? const Color(0xFF22C55E)
                : const Color(0xFFEF4444),
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2: COLLECTORS
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildCollectorsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _buildMiniStat(
                'Total',
                _collectors.length.toString(),
                Icons.memory_rounded,
                const Color(0xFF3B82F6),
              ),
              _buildMiniStat(
                'Active',
                _collectors
                    .where((c) => c['status'] == 'active')
                    .length
                    .toString(),
                Icons.check_circle_rounded,
                const Color(0xFF22C55E),
              ),
              _buildMiniStat(
                'Errors',
                _collectors
                    .where((c) =>
                        c['status'] == 'error' || c['status'] == 'failed')
                    .length
                    .toString(),
                Icons.error_rounded,
                const Color(0xFFEF4444),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Collector grid
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: _collectors.isEmpty
                ? [
                    // Default collectors when no data
                    ...[
                      'sysmon',
                      'process',
                      'network',
                      'firewall',
                      'dns',
                      'registry',
                      'usb',
                      'login',
                      'scheduled_task',
                      'service',
                      'wmi',
                      'powershell',
                      'file_integrity',
                      'clipboard',
                      'browser',
                      'email'
                    ].map((name) => _buildCollectorCard({
                          'name': name,
                          'status': 'active',
                          'events_collected': 0,
                        }))
                  ]
                : _collectors.map((c) => _buildCollectorCard(c)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon, Color color) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCollectorCard(dynamic collector) {
    final name = collector['name']?.toString() ?? 'Unknown';
    final status = collector['status']?.toString() ?? 'unknown';
    final events = collector['events_collected'] ?? 0;
    final isActive = status == 'active' || status == 'running';

    final iconMap = {
      'sysmon': Icons.monitor_heart_rounded,
      'process': Icons.account_tree_rounded,
      'network': Icons.lan_rounded,
      'firewall': Icons.local_fire_department_rounded,
      'dns': Icons.dns_rounded,
      'registry': Icons.app_registration_rounded,
      'usb': Icons.usb_rounded,
      'login': Icons.login_rounded,
      'scheduled_task': Icons.schedule_rounded,
      'service': Icons.miscellaneous_services_rounded,
      'wmi': Icons.terminal_rounded,
      'powershell': Icons.code_rounded,
      'file_integrity': Icons.folder_special_rounded,
      'clipboard': Icons.content_paste_rounded,
      'browser': Icons.language_rounded,
      'email': Icons.email_rounded,
    };

    return Container(
      width: 180,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isActive
              ? const Color(0xFF22C55E).withValues(alpha: 0.2)
              : const Color(0xFFEF4444).withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                iconMap[name.toLowerCase()] ?? Icons.memory_rounded,
                color: isActive
                    ? const Color(0xFF22C55E)
                    : const Color(0xFFEF4444),
                size: 20,
              ),
              const Spacer(),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: isActive
                      ? const Color(0xFF22C55E)
                      : const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            name.replaceAll('_', ' ').toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '$events events',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3: INCIDENTS
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildIncidentsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Severity filter chips
          Wrap(
            spacing: 8,
            children: ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
                .map((s) => _buildFilterChip(s))
                .toList(),
          ),
          const SizedBox(height: 20),
          // Incidents list
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(16),
              border:
                  Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: _incidents.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(40),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.check_circle_outline_rounded,
                              color: const Color(0xFF22C55E).withValues(alpha: 0.4),
                              size: 48),
                          const SizedBox(height: 12),
                          Text(
                            'No active incidents',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.4),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : Column(
                    children: _incidents
                        .where((i) {
                          if (_selectedSeverityFilter == 'ALL') return true;
                          return (i['severity']?.toString().toUpperCase() ??
                                  '') ==
                              _selectedSeverityFilter;
                        })
                        .take(15)
                        .map((i) => _buildIncidentRow(i))
                        .toList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final selected = _selectedSeverityFilter == label;
    final color = label == 'CRITICAL'
        ? const Color(0xFFEF4444)
        : label == 'HIGH'
            ? const Color(0xFFF97316)
            : label == 'MEDIUM'
                ? const Color(0xFFF59E0B)
                : label == 'LOW'
                    ? const Color(0xFF3B82F6)
                    : Colors.white.withValues(alpha: 0.5);

    return GestureDetector(
      onTap: () => setState(() => _selectedSeverityFilter = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? color
                : Colors.white.withValues(alpha: 0.1),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? color : Colors.white.withValues(alpha: 0.5),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildIncidentRow(dynamic incident) {
    final id = incident['id']?.toString() ?? '—';
    final title = incident['title'] ?? incident['description'] ?? 'Incident';
    final severity =
        incident['severity']?.toString().toUpperCase() ?? 'MEDIUM';
    final status = incident['status']?.toString() ?? 'open';
    final sevColor = severity == 'CRITICAL'
        ? const Color(0xFFEF4444)
        : severity == 'HIGH'
            ? const Color(0xFFF97316)
            : severity == 'MEDIUM'
                ? const Color(0xFFF59E0B)
                : const Color(0xFF3B82F6);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.04)),
          left: BorderSide(color: sevColor, width: 3),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: Text(
              '#$id',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.3),
                fontSize: 11,
                fontFamily: 'monospace',
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              title.toString(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: sevColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              severity,
              style: TextStyle(
                color: sevColor,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: status == 'resolved'
                  ? const Color(0xFF22C55E).withValues(alpha: 0.1)
                  : Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status.toUpperCase(),
              style: TextStyle(
                color: status == 'resolved'
                    ? const Color(0xFF22C55E)
                    : Colors.white.withValues(alpha: 0.5),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4: AUDIT LOG
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildAuditPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF161B22),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                border: Border(
                  bottom:
                      BorderSide(color: Colors.white.withValues(alpha: 0.06)),
                ),
              ),
              child: const Row(
                children: [
                  Icon(Icons.history_rounded,
                      color: Color(0xFF8B5CF6), size: 20),
                  SizedBox(width: 10),
                  Text(
                    'System Audit Trail',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            if (_auditLogs.isEmpty)
              Padding(
                padding: const EdgeInsets.all(40),
                child: Center(
                  child: Text(
                    'No audit logs available',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                      fontSize: 13,
                    ),
                  ),
                ),
              )
            else
              ..._auditLogs.take(20).map((log) {
                final action = log['action']?.toString() ?? 'Unknown';
                final user = log['username'] ?? log['user'] ?? '—';
                final ts = log['timestamp'] ?? log['created_at'] ?? '';
                return Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                          color: Colors.white.withValues(alpha: 0.03)),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.circle,
                          size: 6,
                          color: Colors.white.withValues(alpha: 0.3)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              action,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'by $user • $ts',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.3),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5: ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildAnalyticsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Animated activity chart
          Container(
            height: 280,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Event Activity (24h)',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: IgnorePointer(
                    child: RepaintBoundary(
                      child: AnimatedBuilder(
                        animation: _chartAnim,
                        builder: (ctx, _) {
                          return CustomPaint(
                            size: Size.infinite,
                            painter: _BarChartPainter(
                              progress: _chartAnim.value,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Platform stats
          LayoutBuilder(
            builder: (ctx, constraints) {
              if (constraints.maxWidth > 600) {
                return Row(
                  children: [
                    Expanded(child: _buildPlatformStat('Windows Agents', '12', Icons.desktop_windows_rounded, const Color(0xFF3B82F6))),
                    const SizedBox(width: 16),
                    Expanded(child: _buildPlatformStat('Mobile Agents', '5', Icons.phone_android_rounded, const Color(0xFF22C55E))),
                    const SizedBox(width: 16),
                    Expanded(child: _buildPlatformStat('Extensions', '24', Icons.extension_rounded, const Color(0xFF8B5CF6))),
                  ],
                );
              }
              return Column(
                children: [
                  _buildPlatformStat('Windows Agents', '12', Icons.desktop_windows_rounded, const Color(0xFF3B82F6)),
                  const SizedBox(height: 12),
                  _buildPlatformStat('Mobile Agents', '5', Icons.phone_android_rounded, const Color(0xFF22C55E)),
                  const SizedBox(height: 12),
                  _buildPlatformStat('Extensions', '24', Icons.extension_rounded, const Color(0xFF8B5CF6)),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          // Collector health sparklines
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Collector Health Trend',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 100,
                  child: IgnorePointer(
                    child: RepaintBoundary(
                      child: AnimatedBuilder(
                        animation: _chartAnim,
                        builder: (ctx, _) {
                          return CustomPaint(
                            size: const Size(double.infinity, 100),
                            painter: _SparklinePainter(
                              progress: _chartAnim.value,
                            ),
                          );
                        },
                      ),
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

  Widget _buildPlatformStat(
      String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Shared ──────────────────────────────────────────────────────────────
  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation(
                  const Color(0xFFDC2626).withValues(alpha: 0.7)),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Loading admin dashboard...',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.cloud_off_rounded,
              color: Colors.white.withValues(alpha: 0.2), size: 48),
          const SizedBox(height: 16),
          Text(
            _errorMessage ?? 'Failed to load data',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 13,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  void _handleLogout() async {
    await _api.logout();
    if (!mounted) return;
    Navigator.of(context)
        .pushNamedAndRemoveUntil(AppRoutes.login, (r) => false);
  }
}

// ─── Helper Models ──────────────────────────────────────────────────────────
class _SidebarItem {
  final IconData icon;
  final String label;
  _SidebarItem(this.icon, this.label);
}

class _BarData {
  final String label;
  final double value;
  final Color color;
  _BarData(this.label, this.value, this.color);
}

// ─── Custom Painters ────────────────────────────────────────────────────────
class _GaugePainter extends CustomPainter {
  final double value;
  final Color color;
  _GaugePainter({required this.value, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 12;

    // Background arc
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      2.3,
      4.6,
      false,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.06)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 14
        ..strokeCap = StrokeCap.round,
    );

    // Value arc
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      2.3,
      4.6 * value,
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 14
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) =>
      value != oldDelegate.value || color != oldDelegate.color;
}

class _BarChartPainter extends CustomPainter {
  final double progress;
  _BarChartPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final rng = Random(42);
    final barCount = 24;
    final barWidth = size.width / (barCount * 1.5);
    final maxH = size.height - 20;

    for (int i = 0; i < barCount; i++) {
      final h = (rng.nextDouble() * 0.7 + 0.15) * maxH * progress;
      final x = i * (barWidth * 1.5) + barWidth * 0.25;

      final gradient = LinearGradient(
        begin: Alignment.bottomCenter,
        end: Alignment.topCenter,
        colors: [
          const Color(0xFFDC2626).withValues(alpha: 0.8),
          const Color(0xFFDC2626).withValues(alpha: 0.3),
        ],
      );

      final rect = Rect.fromLTWH(x, maxH - h, barWidth, h);
      final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(3));

      canvas.drawRRect(
        rrect,
        Paint()
          ..shader = gradient
              .createShader(Rect.fromLTWH(x, maxH - h, barWidth, h)),
      );
    }

    // X-axis labels
    final textStyle = TextStyle(
      color: Colors.white.withValues(alpha: 0.3),
      fontSize: 9,
    );
    for (int i = 0; i < barCount; i += 4) {
      final tp = TextPainter(
        text: TextSpan(text: '${i}h', style: textStyle),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(i * (barWidth * 1.5), maxH + 4));
    }
  }

  @override
  bool shouldRepaint(covariant _BarChartPainter oldDelegate) =>
      progress != oldDelegate.progress;
}

class _SparklinePainter extends CustomPainter {
  final double progress;
  _SparklinePainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final rng = Random(7);
    final points = List.generate(
        20, (i) => Offset(
          i * size.width / 19,
          size.height * (0.2 + rng.nextDouble() * 0.6) * (1 - progress) +
              size.height * (0.1 + rng.nextDouble() * 0.3) * progress,
        ));

    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      final p0 = points[i - 1];
      final p1 = points[i];
      final ctrl1 = Offset(p0.dx + (p1.dx - p0.dx) / 2, p0.dy);
      final ctrl2 = Offset(p0.dx + (p1.dx - p0.dx) / 2, p1.dy);
      path.cubicTo(ctrl1.dx, ctrl1.dy, ctrl2.dx, ctrl2.dy, p1.dx, p1.dy);
    }

    canvas.drawPath(
      path,
      Paint()
        ..color = const Color(0xFF22C55E)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeJoin = StrokeJoin.round,
    );

    // Fill area
    final fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(
      fillPath,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFF22C55E).withValues(alpha: 0.15),
            const Color(0xFF22C55E).withValues(alpha: 0.0),
          ],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height)),
    );

    // Data points
    for (final p in points) {
      canvas.drawCircle(
        p,
        3,
        Paint()..color = const Color(0xFF22C55E),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _SparklinePainter oldDelegate) =>
      progress != oldDelegate.progress;
}
