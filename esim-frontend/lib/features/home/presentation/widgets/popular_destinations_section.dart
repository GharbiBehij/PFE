import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/destination_card.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';

class PopularDestinationsSection extends StatelessWidget {
  const PopularDestinationsSection({
    required this.activeRegion,
    required this.destinationsAsync,
    required this.onSeeAll,
    super.key,
  });

  final String activeRegion;
  final AsyncValue<List<Destination>> destinationsAsync;
  final VoidCallback onSeeAll;

  String get _title {
    if (activeRegion == 'all') return 'Populaires';
    const labels = {
      'Europe': 'Europe',
      'Asia': 'Asie',
      'Africa': 'Afrique',
      'America': 'Amériques',
    };
    return 'Destinations ${labels[activeRegion] ?? activeRegion}';
  }

  List<Destination> _filter(List<Destination> all) {
    if (activeRegion == 'all') return all.take(5).toList();
    return all.where((d) => _matchesRegion(d.region)).toList();
  }

  bool _matchesRegion(String region) {
    final r = region.toLowerCase();
    switch (activeRegion) {
      case 'Europe':
        return r.contains('europe');
      case 'Asia':
        return r.contains('asia') || r.contains('asie');
      case 'Africa':
        return r.contains('afri');
      case 'America':
        return r.contains('ameri');
      default:
        return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 8, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Text(
                  _title,
                  key: ValueKey(_title),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              TextButton(
                onPressed: onSeeAll,
                child: const Text(
                  'Voir tout',
                  style: TextStyle(color: AppColors.primary),
                ),
              ),
            ],
          ),
        ),
        destinationsAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                _ShimmerCard(),
                SizedBox(height: 16),
                _ShimmerCard(),
                SizedBox(height: 16),
                _ShimmerCard(),
              ],
            ),
          ),
          error: (_, _) => const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: Text(
              'Erreur de chargement',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          data: (all) {
            final filtered = _filter(all);
            return AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, animation) => FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween(
                    begin: const Offset(0.05, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOut,
                  )),
                  child: child,
                ),
              ),
              child: filtered.isEmpty
                  ? _EmptyState(key: ValueKey('empty_$activeRegion'))
                  : Padding(
                      key: ValueKey('list_$activeRegion'),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        children: [
                          for (var i = 0; i < filtered.length; i++) ...[
                            _FadeInCard(
                              delay: Duration(milliseconds: 100 * i),
                              child: DestinationCard(
                                id: filtered[i].country,
                                name: filtered[i].country,
                                imageUrl: filtered[i].imageUrl.isNotEmpty
                                    ? filtered[i].imageUrl
                                    : 'https://picsum.photos/seed/${filtered[i].country}/400/300',
                                price: filtered[i].lowestPrice / 100.0,
                              ),
                            ),
                            if (i < filtered.length - 1)
                              const SizedBox(height: 24),
                          ],
                        ],
                      ),
                    ),
            );
          },
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF3F4F6)),
        ),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFF9FAFB),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.public,
                size: 24,
                color: Color(0xFF9CA3AF),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Aucune destination trouvée',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Nous élargissons bientôt notre couverture dans cette région !',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FadeInCard extends StatefulWidget {
  const _FadeInCard({required this.delay, required this.child});

  final Duration delay;
  final Widget child;

  @override
  State<_FadeInCard> createState() => _FadeInCardState();
}

class _FadeInCardState extends State<_FadeInCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _opacity = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(opacity: _opacity, child: widget.child);
  }
}

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 256,
      decoration: BoxDecoration(
        color: const Color(0xFFE5E7EB),
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
    );
  }
}
