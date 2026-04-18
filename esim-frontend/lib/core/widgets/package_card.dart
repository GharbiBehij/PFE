import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';

class PackageCard extends StatelessWidget {
  const PackageCard({
    required this.id,
    required this.dataAmount,
    required this.validity,
    required this.price,
    required this.features,
    required this.onTap,
    this.isBestValue = false,
    this.isSelected = false,
    super.key,
  });

  final String id;
  final String dataAmount; // e.g. "5 GB"
  final int validity; // days
  final double price;
  final List<String> features;
  final VoidCallback onTap;
  final bool isBestValue;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    final borderColor = isSelected
        ? AppColors.primary
        : isBestValue
        ? AppColors.secondary
        : AppColors.divider;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Card body
        AnimatedContainer(
          duration: AppMotion.normal,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.cardRadius,
            border: Border.all(color: borderColor, width: isSelected ? 2 : 1.5),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: data + price
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left: data + validity
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dataAmount,
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(
                              Icons.calendar_today_outlined,
                              size: 14,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '$validity days',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Right: price
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '\$${price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const Text(
                        'Total',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),

              // Features
              ...features.map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        size: 16,
                        color: AppColors.success,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        f,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Button
              SizedBox(
                width: double.infinity,
                child: isSelected
                    ? FilledButton.icon(
                        onPressed: onTap,
                        icon: const Icon(Icons.check, size: 18),
                        label: const Text('Selected'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          minimumSize: const Size(double.infinity, 48),
                        ),
                      )
                    : OutlinedButton(
                        onPressed: onTap,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 48),
                        ),
                        child: const Text('View Details'),
                      ),
              ),
            ],
          ),
        ),

        // Best Value badge — top right, outside card
        if (isBestValue)
          Positioned(
            top: -10,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(AppRadius.badge),
              ),
              child: const Text(
                'Best Value',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),

        // Selected badge — top left, outside card
        if (isSelected)
          Positioned(
            top: -10,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(AppRadius.badge),
              ),
              child: const Text(
                'Selected',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
