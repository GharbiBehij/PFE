import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/country_flag.dart';

class ChunkyDestinationCard extends StatelessWidget {
  const ChunkyDestinationCard({
    required this.country,
    required this.minPrice,
    super.key,
  });

  final String country;
  final int minPrice;

  String get _formattedPrice {
    final amount = (minPrice / 1000).toStringAsFixed(3);
    return 'From $amount TND';
  }

  @override
  Widget build(BuildContext context) {
    return MotionPressable(
      onTap: () {
        context.push(RouteNames.packages(Uri.encodeComponent(country)));
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            CountryFlag(countryCode: country.toLowerCase(), size: FlagSize.md),
            const SizedBox(width: AppSpacing.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    country,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formattedPrice,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primaryBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                size: 20,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
