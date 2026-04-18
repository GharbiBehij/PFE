import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/home/models/coverage_filter.dart';

class CoverageFilterChips extends StatelessWidget {
  const CoverageFilterChips({
    required this.activeFilter,
    required this.onFilterChanged,
    super.key,
  });

  final CoverageFilter activeFilter;
  final ValueChanged<CoverageFilter> onFilterChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: AppSpacing.lg),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(right: AppSpacing.lg),
        child: Row(
          children: CoverageFilter.values.map((filter) {
            final isActive = activeFilter == filter;
            final isLast = filter == CoverageFilter.values.last;

            return Padding(
              padding: EdgeInsets.only(right: isLast ? 0 : AppSpacing.md),
              child: _FilterChip(
                label: filter.label,
                icon: filter.icon,
                isActive: isActive,
                onTap: () => onFilterChanged(filter),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MotionPressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppMotion.normal,
        curve: AppMotion.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isActive ? AppColors.primary : AppColors.divider.withValues(alpha: 0.5),
            width: isActive ? 0 : 1,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 12,
                    spreadRadius: 0,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isActive ? Colors.white : AppColors.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : AppColors.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
