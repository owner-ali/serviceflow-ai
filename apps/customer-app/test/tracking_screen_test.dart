import 'package:flutter_test/flutter_test.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:serviceflow_customer/screens/tracking/tracking_screen.dart';

void main() {
  group('LatLngTween', () {
    test('interpolates linearly between begin and end', () {
      final tween = LatLngTween(
        begin: const LatLng(0, 0),
        end: const LatLng(10, 20),
      );

      final mid = tween.lerp(0.5);
      expect(mid.latitude, closeTo(5, 0.0001));
      expect(mid.longitude, closeTo(10, 0.0001));

      final start = tween.lerp(0);
      expect(start.latitude, 0);
      expect(start.longitude, 0);

      final end = tween.lerp(1);
      expect(end.latitude, 10);
      expect(end.longitude, 20);
    });

    test('handles negative coordinate deltas', () {
      final tween = LatLngTween(
        begin: const LatLng(30.27, -97.74),
        end: const LatLng(30.26, -97.75),
      );
      final mid = tween.lerp(0.5);
      expect(mid.latitude, closeTo(30.265, 0.0001));
      expect(mid.longitude, closeTo(-97.745, 0.0001));
    });
  });
}
