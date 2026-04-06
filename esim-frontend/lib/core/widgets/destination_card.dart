import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';

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
    return GestureDetector(
      onTap: () => context.push(RouteNames.packages(id)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.card),
        child: SizedBox(
          height: 256,
          width: double.infinity,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background image
              CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.cover,
                placeholder: (_, _) => Container(color: const Color(0xFFE5E7EB)),
                errorWidget: (_, _, _) => Container(
                  color: const Color(0xFFE5E7EB),
                  child: const Icon(Icons.image_not_supported_outlined, color: AppColors.textSecondary),
                ),
              ),

              // Gradient overlay
              DecoratedBox(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xCC000000)],
                    stops: [0.4, 1.0],
                  ),
                ),
              ),

              // Rating badge — top right
              if (rating != null)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(AppRadius.badge),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('⭐', style: TextStyle(fontSize: 12)),
                        const SizedBox(width: 4),
                        Text(
                          rating!.toStringAsFixed(1),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Bottom content
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Left: country + name
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            name.toUpperCase(),
                            style: const TextStyle(
                              color: AppColors.secondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              height: 1.1,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Right: price
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Starts from',
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                        Text(
                          '\$${price.toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: AppColors.secondary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
