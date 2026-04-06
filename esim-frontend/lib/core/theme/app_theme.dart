import 'package:flutter/material.dart';

class AppColors {
  const AppColors._();

  static const primary = Color(0xFF7C3AED);      // violet-600
  static const secondary = Color(0xFFFACC15);    // yellow-400
  static const background = Color(0xFFF9FAFB);   // gray-50
  static const surface = Color(0xFFFFFFFF);      // white
  static const textPrimary = Color(0xFF1F2937);  // gray-800
  static const textSecondary = Color(0xFF6B7280); // gray-500
  static const error = Color(0xFFEF4444);        // red-500
  static const success = Color(0xFF10B981);      // emerald-500
  static const divider = Color(0xFFE5E7EB);      // gray-200
}

class AppRadius {
  const AppRadius._();

  static const card = 24.0;
  static const button = 16.0;
  static const input = 12.0;
  static const badge = 8.0;

  static BorderRadius cardRadius = BorderRadius.circular(card);
  static BorderRadius buttonRadius = BorderRadius.circular(button);
  static BorderRadius inputRadius = BorderRadius.circular(input);
}

class AppTheme {
  const AppTheme._();

  static ThemeData get light {
    const colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      primaryContainer: Color(0xFFEDE9FE),   // violet-100
      onPrimaryContainer: Color(0xFF4C1D95), // violet-900
      secondary: AppColors.secondary,
      onSecondary: AppColors.textPrimary,
      secondaryContainer: Color(0xFFFEF9C3), // yellow-100
      onSecondaryContainer: Color(0xFF713F12),
      error: AppColors.error,
      onError: Colors.white,
      surface: AppColors.surface,
      onSurface: AppColors.textPrimary,
      surfaceContainerHighest: AppColors.background,
      onSurfaceVariant: AppColors.textSecondary,
      outline: AppColors.divider,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.background,

      // ── Typography ──────────────────────────────────────────────────────
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        displayMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        headlineLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
        headlineSmall: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        titleLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
        titleSmall: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
        bodyLarge: TextStyle(color: AppColors.textPrimary),
        bodyMedium: TextStyle(color: AppColors.textPrimary),
        bodySmall: TextStyle(color: AppColors.textSecondary),
        labelLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        labelMedium: TextStyle(color: AppColors.textSecondary),
        labelSmall: TextStyle(color: AppColors.textSecondary),
      ),

      // ── Card ────────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.cardRadius,
          side: const BorderSide(color: AppColors.divider),
        ),
        margin: EdgeInsets.zero,
      ),

      // ── Buttons ─────────────────────────────────────────────────────────
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonRadius),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          minimumSize: const Size(double.infinity, 52),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
          shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonRadius),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          minimumSize: const Size(double.infinity, 52),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonRadius),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),

      // ── Input ───────────────────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        hintStyle: const TextStyle(color: AppColors.textSecondary),
        errorStyle: const TextStyle(color: AppColors.error),
      ),

      // ── AppBar ──────────────────────────────────────────────────────────
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: IconThemeData(color: AppColors.textPrimary),
      ),

      // ── Bottom Navigation ────────────────────────────────────────────────
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: const Color(0xFFEDE9FE), // violet-100
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: AppColors.primary);
          }
          return const IconThemeData(color: AppColors.textSecondary);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              color: AppColors.primary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            );
          }
          return const TextStyle(color: AppColors.textSecondary, fontSize: 12);
        }),
        elevation: 0,
      ),

      // ── Chip ────────────────────────────────────────────────────────────
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.badge)),
        side: const BorderSide(color: AppColors.divider),
        backgroundColor: AppColors.surface,
      ),

      // ── Divider ─────────────────────────────────────────────────────────
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
