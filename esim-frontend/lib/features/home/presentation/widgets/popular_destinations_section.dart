import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/destination_card.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';

class PopularDestinationsSection extends StatelessWidget {
  const PopularDestinationsSection({
    required this.activeRegion,
    required this.destinations,
    this.isLoading = false,
    this.errorMessage,
    required this.onSeeAll,
    super.key,
  });

  final String activeRegion;
  final List<Destination> destinations;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onSeeAll;

  String get _title {
    if (activeRegion == 'all') return 'Popular';
    const labels = {
      'Europe': 'Europe',
      'Asia': 'Asia',
      'Africa': 'Africa',
      'America': 'Americas',
    };
    final regionLabel = labels[activeRegion] ?? activeRegion;
    return '$regionLabel Destinations';
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
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              AnimatedSwitcher(
                duration: AppMotion.normal,
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween(
                      begin: const Offset(0.0, 0.12),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  ),
                ),
                child: Text(
                  _title,
                  key: ValueKey(_title),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              TextButton(
                onPressed: onSeeAll,
                child: const Text(
                  'See all',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (isLoading)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                _ShimmerCard(),
                SizedBox(height: 20),
                _ShimmerCard(),
                SizedBox(height: 20),
                _ShimmerCard(),
              ],
            ),
          )
        else if (errorMessage != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Text(
              errorMessage!,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          )
        else
          Builder(
            builder: (_) {
              final filtered = _filter(destinations);
              return ClipRect(
                child: AnimatedSwitcher(
                  duration: AppMotion.normal,
                  transitionBuilder: (child, animation) {
                    final isIncoming =
                        child.key == ValueKey('list_$activeRegion') ||
                        child.key == ValueKey('empty_$activeRegion');
                    return SlideTransition(
                      position:
                          Tween<Offset>(
                            begin: Offset(isIncoming ? 1.0 : -1.0, 0),
                            end: Offset.zero,
                          ).animate(
                            CurvedAnimation(
                              parent: animation,
                              curve: AppMotion.easeOutCubic,
                            ),
                          ),
                      child: FadeTransition(opacity: animation, child: child),
                    );
                  },
                  child: filtered.isEmpty
                      ? _EmptyState(key: ValueKey('empty_$activeRegion'))
                      : Padding(
                          key: ValueKey('list_$activeRegion'),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            children: [
                              for (var i = 0; i < filtered.length; i++) ...[
                                _FadeInCard(
                                  delay: Duration(milliseconds: 90 * i),
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
                                  const SizedBox(height: 20),
                              ],
                            ],
                          ),
                        ),
                ),
              );
            },
          ),
        const SizedBox(height: 20),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 34, horizontal: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 62,
              height: 62,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.travel_explore_outlined,
                size: 25,
                color: Color(0xFF9CA3AF),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No destinations found',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'We are expanding coverage in this region. Check back soon.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
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
  late final Animation<Offset> _offset;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppMotion.slow);
    _opacity = CurvedAnimation(parent: _controller, curve: AppMotion.easeOut);
    _offset = Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero)
        .animate(
          CurvedAnimation(parent: _controller, curve: AppMotion.easeOutCubic),
        );

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
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(position: _offset, child: widget.child),
    );
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
