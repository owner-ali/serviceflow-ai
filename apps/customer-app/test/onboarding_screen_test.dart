import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:serviceflow_customer/screens/onboarding/onboarding_screen.dart';

void main() {
  testWidgets('OnboardingScreen shows the first slide and a Skip button', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: OnboardingScreen()));

    expect(find.text('Easy Booking'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);
  });

  testWidgets('Next button advances to the second slide', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: OnboardingScreen()));

    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    expect(find.text('Live Technician Tracking'), findsOneWidget);
  });
}
