import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';

class RegionChip extends StatelessWidget {
  const RegionChip({
    required this.label,
    required this.icon,
    required this.isActive,
    required this.onTap,
    super.key,
  });

  final String label;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: AnimatedContainer(
          duration: AppMotion.normal,
          curve: AppMotion.easeOutCubic,
          width: 120,
          height: 84,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isActive ? AppColors.primary : const Color(0xFFE5E7EB),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isActive ? 0.08 : 0.04),
                blurRadius: isActive ? 12 : 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: AppMotion.normal,
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: isActive
                      ? Colors.white.withValues(alpha: 0.2)
                      : const Color(0xFFEDE9FE),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: isActive ? Colors.white : AppColors.primary,
                ),
              ),
              const SizedBox(height: 8),
              AnimatedDefaultTextStyle(
                duration: AppMotion.fast,
                style: TextStyle(
                  color: isActive ? Colors.white : const Color(0xFF374151),
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
