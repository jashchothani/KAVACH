import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('KAVACH App initializes and renders splash branding', (WidgetTester tester) async {
    // Build KAVACH App and trigger initial frame
    await tester.pumpWidget(const KavachApp());
    await tester.pump();

    // Verify splash brand title and subtitle are present
    expect(find.text('KAVACH'), findsWidgets);
    expect(find.text('SOVEREIGN SOAR-XDR · ZERO-TRUST DEFENSE'), findsOneWidget);

    // Advance clock past splash duration so all timers complete cleanly
    await tester.pumpAndSettle(const Duration(milliseconds: 3000));
  });
}
