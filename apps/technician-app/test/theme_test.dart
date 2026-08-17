import 'package:flutter_test/flutter_test.dart';
import 'package:serviceflow_technician/core/theme.dart';

void main() {
  test('SFTheme.light() and SFTheme.dark() build valid ThemeData', () {
    final light = SFTheme.light();
    final dark = SFTheme.dark();

    expect(light.colorScheme.primary, SFColors.emerald);
    expect(dark.colorScheme.primary, SFColors.emerald);
    expect(light.scaffoldBackgroundColor, SFColors.offWhite);
    expect(dark.scaffoldBackgroundColor, SFColors.forestDark);
  });
}
