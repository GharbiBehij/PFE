import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/destination_card.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';

class DestinationsScreen extends ConsumerStatefulWidget {
  const DestinationsScreen({super.key});

  @override
  ConsumerState<DestinationsScreen> createState() => _DestinationsScreenState();
}

class _DestinationsScreenState extends ConsumerState<DestinationsScreen> {
  String _searchQuery = '';
  String _selectedRegion = 'All';

  static const _regions = ['All', 'Europe', 'Asia', 'Africa', 'Americas'];

  List<Destination> _filter(List<Destination> all) {
    return all.where((d) {
      final matchRegion =
          _selectedRegion == 'All' || d.region == _selectedRegion;
      final matchSearch = _searchQuery.isEmpty ||
          d.country.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final destinationsAsync = ref.watch(destinationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // ── Header ──────────────────────────────────────────────────────
          _buildHeader(context),

          // ── Region filter pills ──────────────────────────────────────────
          SizedBox(
            height: 52,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _regions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => _RegionPill(
                label: _regions[i],
                isActive: _selectedRegion == _regions[i],
                onTap: () =>
                    setState(() => _selectedRegion = _regions[i]),
              ),
            ),
          ),

          // ── Grid ────────────────────────────────────────────────────────
          Expanded(
            child: destinationsAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (_, __) => EmptyState(
                message: 'Erreur de chargement',
                onRetry: () => ref.invalidate(destinationsProvider),
              ),
              data: (all) {
                final filtered = _filter(all);
                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.public_off_outlined,
                    message: 'Aucun résultat trouvé',
                  );
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => DestinationCard(
                    id: filtered[i].country,
                    name: filtered[i].country,
                    imageUrl: filtered[i].imageUrl,
                    price: filtered[i].lowestPrice / 100,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: AppColors.primary,
      padding: EdgeInsets.fromLTRB(16, top + 16, 16, 24),
      child: Stack(
        children: [
          Positioned(
            top: 0,
            right: -12,
            child: Icon(
              Icons.location_on,
              size: 80,
              color: Colors.white.withOpacity(0.2),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Où aller ensuite ?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Découvrez le monde sans frontières.',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    const Icon(Icons.search,
                        color: AppColors.textSecondary, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        onChanged: (v) =>
                            setState(() => _searchQuery = v),
                        decoration: const InputDecoration(
                          hintText: 'Chercher une destination...',
                          hintStyle:
                              TextStyle(color: AppColors.textSecondary),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                          fillColor: Colors.transparent,
                          filled: false,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RegionPill extends StatelessWidget {
  const _RegionPill({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? AppColors.primary : AppColors.divider,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive
                ? Colors.white
                : const Color(0xFF4B5563),
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
