import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/primary_button.dart';
import 'package:mobile/screens/user_mode/user_dashboard_screen.dart';

void main() {
  testWidgets('UserDashboardScreen renders on desktop without assertion failure', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const UserDashboardScreen(),
      ),
    );

    // Initial frame
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Verify KAVACH desktop security title is rendered
    expect(find.text('KAVACH'), findsWidgets);
    expect(find.text('ENDPOINT CONSOLE'), findsWidgets);
  });

  testWidgets('PrimaryButton renders and responds to tap', (WidgetTester tester) async {
    bool tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: Scaffold(
          body: PrimaryButton(
            text: 'Test Defense',
            onPressed: () {
              tapped = true;
            },
          ),
        ),
      ),
    );

    await tester.pump();
    expect(find.text('Test Defense'), findsOneWidget);
    await tester.tap(find.text('Test Defense'));
    expect(tapped, isTrue);
  });
}
