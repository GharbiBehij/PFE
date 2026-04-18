import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/country_flag.dart';

class DestinationCard extends StatelessWidget {
  const DestinationCard({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.price,
    this.rating,
    super.key,
  });

  final String id;
  final String name;
  final String imageUrl;
  final double price;
  final double? rating;

  @override
  Widget build(BuildContext context) {
    final isCompact = MediaQuery.sizeOf(context).width <= 380;

    return MotionPressable(
      onTap: () => context.push(
        RouteNames.packages(Uri.encodeComponent(id)),
        extra: {'country': name, 'imageUrl': imageUrl},
      ),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(
          horizontal: isCompact ? 10 : 12,
          vertical: isCompact ? 8 : 10,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE5E7EB)),
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
            CountryFlag(
              countryCode: name,
              size: isCompact ? FlagSize.sm : FlagSize.md,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: isCompact ? 14 : 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Starts from',
                    style: TextStyle(
                      color: AppColors.textSecondary.withValues(alpha: 0.9),
                      fontSize: isCompact ? 11 : 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '\$${price.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: Color(0xFF7C3AED),
                    fontSize: isCompact ? 15 : 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (rating != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 1),
                    child: Text(
                      '★ ${rating!.toStringAsFixed(1)}',
                      style: TextStyle(
                        color: Color(0xFFF59E0B),
                        fontSize: isCompact ? 10 : 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.chevron_right_rounded,
              size: isCompact ? 18 : 20,
              color: const Color(0xFF9CA3AF),
            ),
          ],
        ),
      ),
    );
  }
}
