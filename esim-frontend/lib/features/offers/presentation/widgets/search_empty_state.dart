import 'package:flutter/material.dart';

import 'package:esim_frontend/core/theme/app_theme.dart';

class SearchEmptyState extends StatelessWidget {
  const SearchEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6), // gray-100
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.public,
                size: 32,
                color: Color(0xFF9CA3AF), // gray-400
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No results found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Try searching for a different country or region.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
