import 'package:flutter/material.dart';

import 'package:esim_frontend/core/theme/app_theme.dart';

class DaySectionHeader extends StatelessWidget {
  const DaySectionHeader({required this.days, super.key});

  final int days;

  String get _label {
    if (days == 1) return '1 jour';
    return '$days jours';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: AppSpacing.xxl, bottom: AppSpacing.lg),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _label,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.textDark,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
