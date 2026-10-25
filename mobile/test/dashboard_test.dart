import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/google_prompt_modal.dart';
import 'package:mobile/screens/user_mode/user_dashboard_screen.dart';

void main() {
  testWidgets('UserDashboardScreen renders all tabs and banners without assertion failure', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const UserDashboardScreen(),
      ),
    );

    // Initial render (loading skeleton)
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Tab navigation tests:
    // Tab 1: Caller ID
    await tester.tap(find.text('Caller ID'));
    await tester.pumpAndSettle();

    // Tab 2: Raksha AI
    await tester.tap(find.text('Raksha AI'));
    await tester.pumpAndSettle();

    // Tab 3: Device
    await tester.tap(find.text('Device'));
    await tester.pumpAndSettle();

    // Tab 4: Alerts
    await tester.tap(find.text('Alerts'));
    await tester.pumpAndSettle();

    // Back to Shield Tab
    await tester.tap(find.text('Shield'));
    await tester.pumpAndSettle();
  });

  testWidgets('GooglePromptModal renders 2-step verification without failure', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: Scaffold(
          body: GooglePromptModal(
            challenge: const {
              'challenge_id': 'ch_test_123',
              'username': 'admin',
              'email': 'admin@kavachcybertech.in',
              'device': 'Windows 11 Workstation · Chrome',
              'ip': '192.168.1.5',
              'location': 'Mumbai, India',
              'matching_number': 60,
              'options': [60, 7, 90],
            },
            onNumberSelected: (_) {},
            onReject: () {},
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.text('Trying to sign in from another computer?'), findsOneWidget);

    // Tap YES to proceed to Step 2
    await tester.tap(find.text('YES'));
    await tester.pumpAndSettle();

    expect(find.text('Which number do you see on your other screen?'), findsOneWidget);
    expect(find.text('60'), findsOneWidget);
    expect(find.text('7'), findsOneWidget);
    expect(find.text('90'), findsOneWidget);
  });
}
