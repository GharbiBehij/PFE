import 'package:flutter/material.dart';

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
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        constraints: const BoxConstraints(minWidth: 120),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive ? AppColors.primary : const Color(0xFFF3F4F6),
          ),
          boxShadow: isActive
              ? const []
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isActive
                    ? Colors.white.withValues(alpha: 0.2)
                    : const Color(0xFFEDE9FE),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 16,
                color: isActive ? Colors.white : AppColors.primary,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : const Color(0xFF374151),
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
