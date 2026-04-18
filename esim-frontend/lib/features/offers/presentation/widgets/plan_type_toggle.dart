import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/offers/models/plan_type.dart';

class PlanTypeToggle extends StatelessWidget {
  const PlanTypeToggle({
    required this.activePlan,
    required this.onChanged,
    super.key,
  });

  final PlanType activePlan;
  final ValueChanged<PlanType> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
        boxShadow: AppElevation.low,
      ),
      child: Row(
        children: [
          Expanded(
            child: _ToggleButton(
              label: PlanType.standard.label,
              isActive: activePlan == PlanType.standard,
              onTap: () => onChanged(PlanType.standard),
            ),
          ),
          Expanded(
            child: _ToggleButton(
              label: PlanType.unlimited.label,
              isActive: activePlan == PlanType.unlimited,
              onTap: () => onChanged(PlanType.unlimited),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleButton extends StatelessWidget {
  const _ToggleButton({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MotionPressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppMotion.normal,
        curve: AppMotion.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.20),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : AppColors.textSecondary,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
    );
  }
}
