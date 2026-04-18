import 'package:flutter/material.dart';

class AppColors {
  const AppColors._();
  // Purple Family (Brand)
  static const primary = Color(0xFF7C3AED);       // violet-600 (main)
  static const primaryLight = Color(0xFF8B5CF6);  // violet-500
  static const primaryDark = Color(0xFF6D28D9);   // violet-700
  static const primaryBg = Color(0xFFF5F3FF);     // violet-50 (subtle backgrounds)
  static const primaryContainer = Color(0xFFEDE9FE); // violet-100 (active states)
  
  // Accent (Use ONLY for CTAs)
  static const secondary = Color(0xFFFACC15);     // yellow-400
  static const secondaryDark = Color(0xFFFBBF24); // yellow-500
  
  // Neutrals
  static const background = Color(0xFFFAFAFA);    // warm-gray-50
  static const surface = Color(0xFFFFFFFF);       // white
  static const surfaceElevated = Color(0xFFFAFAFA); // subtle elevation
  
  // Borders & Dividers
  static const divider = Color(0xFFE5E7EB);       // gray-200
  static const border = Color(0xFFE5E7EB);        // gray-200
  static const borderLight = Color(0xFFF3F4F6);   // gray-100
  
  // Text
  static const textDark = Color(0xFF111827);      // gray-900
  static const textPrimary = Color(0xFF111827);   // gray-900 (darker)
  static const textSecondary = Color(0xFF6B7280); // gray-500
  static const textTertiary = Color(0xFF9CA3AF);  // gray-400
  
  // Semantic
  static const error = Color(0xFFEF4444);         // red-500
  static const success = Color(0xFF10B981);       // emerald-500
  static const warning = Color(0xFFF59E0B);       // amber-500
} 
class AppSpacing {
  const AppSpacing._();
  
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double xxxl = 48.0;
}
class AppElevation {
  const AppElevation._();
  
  static List<BoxShadow> get low => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.03),
      blurRadius: 6,
      spreadRadius: 0,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get medium => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.04),
      blurRadius: 12,
      spreadRadius: 0,
      offset: const Offset(0, 3),
    ),
  ];

  static List<BoxShadow> get high => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.06),
      blurRadius: 16,
      spreadRadius: 0,
      offset: const Offset(0, 4),
    ),
  ];
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
          elevation: 0,
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
