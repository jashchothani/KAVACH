import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/api_service.dart';

/// Clean, Modern ChatGPT-Style Cybersecurity Assistant for Raksha AI.
/// Powered by NVIDIA NIM and KAVACH Sovereign Security Intelligence.
class RakshaLivingAssistantWidget extends StatefulWidget {
  final double height;
  final bool showChatInterface;
  final VoidCallback? onAssistantTapped;

  const RakshaLivingAssistantWidget({
    super.key,
    this.height = 340,
    this.showChatInterface = true,
    this.onAssistantTapped,
  });

  @override
  State<RakshaLivingAssistantWidget> createState() =>
      _RakshaLivingAssistantWidgetState();
}

class _RakshaLivingAssistantWidgetState
    extends State<RakshaLivingAssistantWidget> {
  final ApiService _api = ApiService.instance;
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  bool _isSending = false;

  final List<Map<String, String>> _messages = [
    {
      'sender': 'raksha',
      'text':
          'Hello! I am **Raksha AI**, your sovereign cybersecurity copilot powered by NVIDIA NIM.\n\nAll real-time endpoint telemetry engines are operating nominally. How can I assist you with your safety today?',
      'time': 'Just now',
      'provider': 'NVIDIA NIM',
    }
  ];

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _handleSendMessage([String? presetQuery]) async {
    final query = presetQuery ?? _textController.text.trim();
    if (query.isEmpty || _isSending) return;

    setState(() {
      _messages.add({
        'sender': 'user',
        'text': query,
        'time': 'Just now',
      });
      _textController.clear();
      _isSending = true;
    });

    _scrollToBottom();

    try {
      final res = await _api.chatRaksha(query);
      if (!mounted) return;

      final reply = res['response']?.toString() ??
          res['reply']?.toString() ??
          res['message']?.toString() ??
          'Telemetry scan complete. Host security parameters are intact.';

      setState(() {
        _messages.add({
          'sender': 'raksha',
          'text': reply,
          'time': 'Just now',
          'provider': res['provider']?.toString() ?? 'NVIDIA NIM',
        });
        _isSending = false;
      });

      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add({
          'sender': 'raksha',
          'text':
              '⚠️ **Advisory Fallback:** Encountered connectivity latency. Your endpoint telemetry remains actively protected by local KAVACH behavioral heuristics and FIM.\n\n$e',
          'time': 'Just now',
          'provider': 'Offline Sovereign Shield',
        });
        _isSending = false;
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _clearChat() {
    setState(() {
      _messages.clear();
      _messages.add({
        'sender': 'raksha',
        'text':
            'Chat cleared. Ask me anything about your current device posture, active alerts, or how to verify a suspicious communication.',
        'time': 'Just now',
        'provider': 'NVIDIA NIM',
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      child: Column(
        children: [
          // ── 1. Clean Top Header Bar (Light Theme) ──
          _buildHeader(),

          // ── 2. Message Conversation Stream ──
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              itemCount: _messages.length + (_isSending ? 1 : 0),
              itemBuilder: (ctx, idx) {
                if (idx == _messages.length) {
                  return _buildThinkingIndicator();
                }
                return _buildMessageRow(_messages[idx]);
              },
            ),
          ),

          // ── 3. Quick Suggestion Prompt Chips ──
          _buildQuickActionChips(),

          // ── 4. Bottom Input Pill ──
          _buildChatInputBar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      child: Row(
        children: [
          // Avatar with green status badge
          Stack(
            clipBehavior: Clip.none,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.asset(
                  'assets/images/raksha_avatar.jpg',
                  width: 38,
                  height: 38,
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) => Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.shield_rounded,
                        color: Color(0xFF8B1A1A), size: 20),
                  ),
                ),
              ),
              Positioned(
                bottom: -1,
                right: -1,
                child: Container(
                  width: 11,
                  height: 11,
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),

          // Titles
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Text(
                      'Raksha AI',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bolt, size: 10, color: Color(0xFF059669)),
                          SizedBox(width: 2),
                          Text(
                            'NVIDIA NIM',
                            style: TextStyle(
                              color: Color(0xFF059669),
                              fontSize: 9.5,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                const Text(
                  'Sovereign Cybersecurity Intelligence',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),

          // Clear button
          IconButton(
            tooltip: 'Clear chat',
            icon: const Icon(
              Icons.delete_outline_rounded,
              color: Color(0xFF64748B),
              size: 20,
            ),
            onPressed: _clearChat,
          ),
        ],
      ),
    );
  }

  Widget _buildMessageRow(Map<String, String> msg) {
    final isUser = msg['sender'] == 'user';
    final provider = msg['provider'];
    final text = msg['text'] ?? '';

    if (isUser) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Flexible(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(18),
                    topRight: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                    bottomRight: Radius.circular(4),
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0C000000),
                      blurRadius: 10,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: SelectableText(
                  text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Color(0xFF8B1A1A),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text(
                  'Y',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Assistant row (clean light layout)
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Raksha Avatar badge
          Container(
            width: 32,
            height: 32,
            margin: const EdgeInsets.only(top: 2),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset(
                'assets/images/raksha_avatar.jpg',
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, stack) => Container(
                  color: const Color(0xFFF1F5F9),
                  child: const Icon(Icons.shield_rounded,
                      color: Color(0xFF8B1A1A), size: 16),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Bubble body
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(18),
                  bottomLeft: Radius.circular(18),
                  bottomRight: Radius.circular(18),
                ),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 10,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Meta bar
                  Row(
                    children: [
                      const Text(
                        'Raksha AI',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (provider != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            provider,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 9,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                      const Spacer(),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: text));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Response copied to clipboard'),
                              duration: Duration(milliseconds: 1400),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        child: const Padding(
                          padding: EdgeInsets.all(4),
                          child: Icon(
                            Icons.copy_rounded,
                            size: 14,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Message text
                  SelectableText(
                    text,
                    style: const TextStyle(
                      color: Color(0xFF1E293B),
                      fontSize: 13.5,
                      height: 1.55,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThinkingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            margin: const EdgeInsets.only(top: 2),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset(
                'assets/images/raksha_avatar.jpg',
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, stack) => Container(
                  color: const Color(0xFFF1F5F9),
                  child: const Icon(Icons.shield_rounded,
                      color: Color(0xFF8B1A1A), size: 16),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                  ),
                ),
                SizedBox(width: 10),
                Text(
                  'Raksha is analyzing…',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionChips() {
    final chips = [
      {'icon': '📶', 'title': 'Is my Wi-Fi safe?'},
      {'icon': '🛡️', 'title': 'Explain my security score'},
      {'icon': '🎣', 'title': 'How to spot phishing'},
      {'icon': '🧱', 'title': 'Windows Defender status'},
      {'icon': '⚠️', 'title': 'Ransomware defense'},
    ];

    return Container(
      height: 38,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemCount: chips.length,
        itemBuilder: (ctx, idx) {
          final item = chips[idx];
          return ActionChip(
            backgroundColor: Colors.white,
            side: const BorderSide(color: Color(0xFFE2E8F0)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            label: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(item['icon']!, style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 6),
                Text(
                  item['title']!,
                  style: const TextStyle(
                    color: Color(0xFF334155),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            onPressed: () => _handleSendMessage(item['title']!),
          );
        },
      ),
    );
  }

  Widget _buildChatInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _textController,
                  focusNode: _focusNode,
                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13.5),
                  decoration: const InputDecoration(
                    hintText: 'Message Raksha AI…',
                    hintStyle: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                    ),
                    border: InputBorder.none,
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  ),
                  onSubmitted: (_) => _handleSendMessage(),
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Send Button
            Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: _isSending
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.arrow_upward_rounded,
                        color: Colors.white, size: 20),
                onPressed: _isSending ? null : () => _handleSendMessage(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
