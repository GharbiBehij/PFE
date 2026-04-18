import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/motion/widgets/motion_stagger_list.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/destination_card.dart';
import 'package:esim_frontend/features/offers/models/destination.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';

const _browseToSearchHeroTag = 'browse_to_search_bar_hero';

Widget _searchBarHeroShuttle(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection direction,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  final targetHero =
      (direction == HeroFlightDirection.push
              ? toHeroContext.widget
              : fromHeroContext.widget)
          as Hero;

  return FadeTransition(
    opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
    child: targetHero.child,
  );
}

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  String _query = '';
  bool _headerChromeEntered = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
      Future<void>.delayed(const Duration(milliseconds: 70), () {
        if (mounted) {
          setState(() => _headerChromeEntered = true);
        }
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    setState(() => _query = value.trim());
  }

  List<Destination> _filter(List<Destination> all) {
    if (_query.isEmpty) return all;
    final q = _query.toLowerCase();
    return all
        .where(
          (d) =>
              d.country.toLowerCase().contains(q) ||
              d.region.toLowerCase().contains(q),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(destinationsProvider);
    final top = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: MotionPageEnter(
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.fromLTRB(24, top + 12, 24, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(24),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x14000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AnimatedSlide(
                    duration: const Duration(milliseconds: 320),
                    curve: Curves.easeOutCubic,
                    offset: _headerChromeEntered
                        ? Offset.zero
                        : const Offset(0, -0.12),
                    child: AnimatedOpacity(
                      duration: const Duration(milliseconds: 260),
                      curve: Curves.easeOut,
                      opacity: _headerChromeEntered ? 1 : 0,
                      child: Row(
                        children: [
                          MotionPressable(
                            onTap: () {
                              final router = GoRouter.of(context);
                              if (router.canPop()) {
                                context.pop();
                              } else {
                                context.go(RouteNames.myEsims);
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: const Icon(
                                Icons.arrow_back,
                                size: 20,
                                color: Color(0xFF4B5563),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Find Destination',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  AnimatedSlide(
                    duration: const Duration(milliseconds: 340),
                    curve: Curves.easeOutCubic,
                    offset: _headerChromeEntered
                        ? Offset.zero
                        : const Offset(0, -0.06),
                    child: AnimatedOpacity(
                      duration: const Duration(milliseconds: 280),
                      curve: Curves.easeOut,
                      opacity: _headerChromeEntered ? 1 : 0,
                      child: const SizedBox(height: 12),
                    ),
                  ),
                  Hero(
                    tag: _browseToSearchHeroTag,
                    flightShuttleBuilder: _searchBarHeroShuttle,
                    child: Material(
                      color: Colors.transparent,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.fromLTRB(12, 2, 12, 2),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.search,
                              size: 18,
                              color: Color(0xFF9CA3AF),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextField(
                                controller: _controller,
                                focusNode: _focusNode,
                                autofocus: true,
                                onChanged: _onChanged,
                                style: const TextStyle(
                                  color: Color(0xFF1F2937),
                                  fontSize: 14,
                                ),
                                decoration: InputDecoration(
                                  hintText: 'Search country or region...',
                                  hintStyle: const TextStyle(
                                    color: Color(0xFF9CA3AF),
                                    fontSize: 14,
                                  ),
                                  filled: true,
                                  fillColor: const Color(0xFFF3F4F6),
                                  border: InputBorder.none,
                                  enabledBorder: InputBorder.none,
                                  focusedBorder: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  suffixIcon: _controller.text.isEmpty
                                      ? null
                                      : MotionPressable(
                                          onTap: () {
                                            _controller.clear();
                                            setState(() => _query = '');
                                          },
                                          child: const Padding(
                                            padding: EdgeInsets.all(8),
                                            child: Icon(
                                              Icons.close,
                                              size: 16,
                                              color: Color(0xFF9CA3AF),
                                            ),
                                          ),
                                        ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: async.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Failed to load destinations',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      MotionPressable(
                        onTap: () => ref.invalidate(destinationsProvider),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.divider),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.refresh, size: 18),
                              SizedBox(width: 6),
                              Text('Retry'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                data: (all) {
                  final results = _filter(all);
                  return _ResultsBody(query: _query, destinations: results);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Results body ─────────────────────────────────────────────────────────────

class _ResultsBody extends StatelessWidget {
  const _ResultsBody({required this.query, required this.destinations});

  final String query;
  final List<Destination> destinations;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        // Section header
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    query.isEmpty ? 'All Destinations' : 'Results for "$query"',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Text(
                  '${destinations.length} found',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Card list or empty state
        if (destinations.isEmpty)
          const SliverFillRemaining(
            hasScrollBody: false,
            child: _SearchEmptyState(),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
            sliver: SliverToBoxAdapter(
              child: MotionStaggerList(
                children: List.generate(
                  destinations.length,
                  (i) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: DestinationCard(
                      id: destinations[i].country,
                      name: destinations[i].country,
                      imageUrl: destinations[i].imageUrl,
                      price: destinations[i].lowestPrice / 1000,
                      rating: 4.8,
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _SearchEmptyState extends StatelessWidget {
  const _SearchEmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.public,
                size: 32,
                color: Color(0xFF9CA3AF),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No results found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Try searching for a different country or region.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}
