import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/widgets/motion_fade_slide_switcher.dart';
import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/home/models/coverage_filter.dart';
import 'package:esim_frontend/features/home/presentation/widgets/chunky_destination_card.dart';
import 'package:esim_frontend/features/home/presentation/widgets/coverage_filter_chips.dart';
import 'package:esim_frontend/features/home/presentation/widgets/home_header.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  CoverageFilter _activeFilter = CoverageFilter.popular;

  @override
  Widget build(BuildContext context) {
    final destinationsAsync = ref.watch(destinationsProvider);
    final authState = ref.watch(authProvider);
    final isLoggedIn = authState.valueOrNull is AuthAuthenticated;
    final safeBottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: MotionPageEnter(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(bottom: safeBottom + AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              HomeHeader(
                isLoggedIn: isLoggedIn,
                onSearchTap: () => context.push(RouteNames.search),
              ),
              const SizedBox(height: 28),
              CoverageFilterChips(
                activeFilter: _activeFilter,
                onFilterChanged: (filter) {
                  setState(() => _activeFilter = filter);
                },
              ),
              const SizedBox(height: 24),
              destinationsAsync.when(
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.xxl),
                    child: CircularProgressIndicator(),
                  ),
                ),
                error: (_, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xxl),
                    child: Column(
                      children: const [
                        Icon(
                          Icons.error_outline,
                          size: 48,
                          color: AppColors.error,
                        ),
                        SizedBox(height: AppSpacing.lg),
                        Text(
                          'Erreur de chargement',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                data: (destinations) {
                  final filtered = _filterDestinations(destinations);

                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _sectionTitle,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textDark,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        MotionFadeSlideSwitcher(
                          child: filtered.isEmpty
                              ? _buildEmptyState()
                              : _buildDestinationList(filtered),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      key: ValueKey('empty_$_activeFilter'),
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.xxl),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: const [
          Icon(
            Icons.public_off_outlined,
            size: 48,
            color: AppColors.textTertiary,
          ),
          SizedBox(height: AppSpacing.lg),
          Text(
            'Aucune destination disponible',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDestinationList(List<Destination> destinations) {
    return Column(
      key: ValueKey('list_$_activeFilter'),
      children: destinations.map((destination) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: ChunkyDestinationCard(
            country: destination.country,
            minPrice: destination.lowestPrice,
          ),
        );
      }).toList(),
    );
  }

  List<Destination> _filterDestinations(List<Destination> destinations) {
    switch (_activeFilter) {
      case CoverageFilter.local:
        return destinations
            .where((d) => d.coverageType.toUpperCase() == 'LOCAL')
            .toList();
      case CoverageFilter.regional:
        return destinations
            .where((d) => d.coverageType.toUpperCase() == 'REGIONAL')
            .toList();
      case CoverageFilter.global:
        return destinations
            .where((d) => d.coverageType.toUpperCase() == 'GLOBAL')
            .toList();
      case CoverageFilter.popular:
        final sorted = [...destinations]
          ..sort((a, b) => b.popularity.compareTo(a.popularity));
        return sorted.take(10).toList();
    }
  }

  String get _sectionTitle {
    switch (_activeFilter) {
      case CoverageFilter.local:
        return 'Destinations locales';
      case CoverageFilter.regional:
        return 'Forfaits régionaux';
      case CoverageFilter.global:
        return 'Forfaits mondiaux';
      case CoverageFilter.popular:
        return 'Destinations populaires';
    }
  }
}
