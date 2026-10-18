import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/constants/app_strings.dart';
import 'package:mobile/core/widgets/app_logo.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('KAVACH App initializes and renders splash branding', (WidgetTester tester) async {
    // Build KAVACH App and trigger initial frame
    await tester.pumpWidget(const KavachApp());
    await tester.pump();

    // Verify splash brand title and subtitle are present
    expect(find.text(AppStrings.splashTitle), findsOneWidget);
    expect(find.text(AppStrings.splashSubtitle), findsOneWidget);

    // Verify KAVACH shield logo widget is rendered
    expect(find.byType(AppLogo), findsOneWidget);

    // Advance clock past splash duration so all timers complete cleanly
    await tester.pumpAndSettle(const Duration(milliseconds: 3000));
  });
}
