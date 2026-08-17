import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ServiceFlow AI brand palette — shared visual language with the admin web app.
class SFColors {
  static const forest = Color(0xFF071F17);
  static const forestDark = Color(0xFF04140F);
  static const emerald = Color(0xFF10B981);
  static const mint = Color(0xFF6EE7B7);
  static const lime = Color(0xFFBEF264);
  static const graphite = Color(0xFF1C1F1E);
  static const offWhite = Color(0xFFF7F8F4);
}

class SFTheme {
  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: SFColors.offWhite,
      colorScheme: base.colorScheme.copyWith(
        primary: SFColors.emerald,
        secondary: SFColors.mint,
        surface: Colors.white,
      ),
      textTheme: GoogleFonts.interTextTheme(base.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: SFColors.graphite,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SFColors.emerald,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: SFColors.forestDark,
      colorScheme: base.colorScheme.copyWith(
        primary: SFColors.emerald,
        secondary: SFColors.mint,
        surface: SFColors.forest,
      ),
      textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(bodyColor: SFColors.offWhite),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: SFColors.offWhite,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SFColors.emerald,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }
}
