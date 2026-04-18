import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/motion/widgets/motion_fade_slide_switcher.dart';
import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/router/route_names.dart';
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

  static const _regions = <_RegionMeta>[
    _RegionMeta(id: 'All', label: 'All', icon: Icons.place_rounded),
    _RegionMeta(id: 'Europe', label: 'Europe', icon: Icons.public_rounded),
    _RegionMeta(id: 'Asia', label: 'Asia', icon: Icons.public_rounded),
    _RegionMeta(id: 'Africa', label: 'Africa', icon: Icons.public_rounded),
    _RegionMeta(id: 'Americas', label: 'America', icon: Icons.public_rounded),
  ];

  List<Destination> _filter(List<Destination> all) {
    return all.where((d) {
      final matchRegion =
          _selectedRegion == 'All' || d.region == _selectedRegion;
      final matchSearch =
          _searchQuery.isEmpty ||
          d.country.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    }).toList();
  }

  String get _sectionTitle {
    if (_selectedRegion == 'All') return 'Popular';
    final active = _regions.firstWhere((r) => r.id == _selectedRegion);
    return '${active.label} Destinations';
  }

  @override
  Widget build(BuildContext context) {
    final destinationsAsync = ref.watch(destinationsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: MotionPageEnter(
        child: Column(
          children: [
            _buildHeader(context),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Regions',
                    style: TextStyle(
                      color: Color(0xFF1F2937),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 56,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _regions.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 12),
                      itemBuilder: (_, i) {
                        final region = _regions[i];
                        return _RegionChip(
                          meta: region,
                          isActive: _selectedRegion == region.id,
                          onTap: () =>
                              setState(() => _selectedRegion = region.id),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      _sectionTitle,
                      style: const TextStyle(
                        color: Color(0xFF1F2937),
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  MotionPressable(
                    onTap: () => context.push(RouteNames.search),
                    child: const Text(
                      'See all',
                      style: TextStyle(
                        color: Color(0xFF7C3AED),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: MotionFadeSlideSwitcher(
                  child: destinationsAsync.when(
                    loading: () => const Center(
                      key: Key('loading'),
                      child: CircularProgressIndicator(),
                    ),
                    error: (_, _) => EmptyState(
                      message: 'Failed to load destinations',
                      onRetry: () => ref.invalidate(destinationsProvider),
                    ),
                    data: (all) {
                      final filtered = _filter(all);
                      if (filtered.isEmpty) {
                        return const _EmptyDestinationsCard(key: Key('empty'));
                      }
                      return ListView.separated(
                        key: ValueKey(
                          'list_${_selectedRegion}_${_searchQuery.length}_${filtered.length}',
                        ),
                        padding: const EdgeInsets.only(bottom: 12),
                        itemCount: filtered.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => DestinationCard(
                          id: filtered[i].country,
                          name: filtered[i].country,
                          imageUrl: filtered[i].imageUrl,
                          price: filtered[i].lowestPrice / 100,
                          rating: 4.8,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(24, top + 12, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back,',
                      style: TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Where next?',
                      style: TextStyle(
                        color: Color(0xFF1F2937),
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              const _NotificationButton(),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            height: 50,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const SizedBox(width: 14),
                const Icon(Icons.search, size: 18, color: Color(0xFF9CA3AF)),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    onChanged: (value) => setState(() => _searchQuery = value),
                    decoration: const InputDecoration(
                      hintText: 'Search destination...',
                      hintStyle: TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 14,
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                      isDense: true,
                    ),
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                      fontSize: 14,
                    ),
                    textInputAction: TextInputAction.search,
                  ),
                ),
                const SizedBox(width: 10),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RegionMeta {
  const _RegionMeta({
    required this.id,
    required this.label,
    required this.icon,
  });

  final String id;
  final String label;
  final IconData icon;
}

class _NotificationButton extends StatefulWidget {
  const _NotificationButton();

  @override
  State<_NotificationButton> createState() => _NotificationButtonState();
}

class _NotificationButtonState extends State<_NotificationButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: MotionPressable(
        onTap: () {},
        child: AnimatedContainer(
          duration: AppMotion.fast,
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: _isHovered
                ? const Color(0xFFE5E7EB)
                : const Color(0xFFF3F4F6),
            shape: BoxShape.circle,
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              const Center(
                child: Icon(
                  Icons.notifications_none_rounded,
                  color: Color(0xFF4B5563),
                  size: 20,
                ),
              ),
              Positioned(
                top: 9,
                right: 10,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.2),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RegionChip extends StatefulWidget {
  const _RegionChip({
    required this.meta,
    required this.isActive,
    required this.onTap,
  });

  final _RegionMeta meta;
  final bool isActive;
  final VoidCallback onTap;

  @override
  State<_RegionChip> createState() => _RegionChipState();
}

class _RegionChipState extends State<_RegionChip> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: MotionPressable(
        onTap: widget.onTap,
        haptic: HapticFeedback.selectionClick,
        child: AnimatedContainer(
          duration: AppMotion.fast,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: widget.isActive ? const Color(0xFF7C3AED) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: widget.isActive
                  ? const Color(0xFF7C3AED)
                  : const Color(0xFFF3F4F6),
            ),
            boxShadow: [
              BoxShadow(
                color: widget.isActive
                    ? const Color(0x33000000)
                    : (_isHovered
                          ? const Color(0x15000000)
                          : const Color(0x0D000000)),
                blurRadius: widget.isActive ? 12 : 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: widget.isActive
                      ? Colors.white.withValues(alpha: 0.20)
                      : const Color(0xFFEDE9FE),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  widget.meta.icon,
                  size: 16,
                  color: widget.isActive
                      ? Colors.white
                      : const Color(0xFF7C3AED),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                widget.meta.label,
                style: TextStyle(
                  color: widget.isActive
                      ? Colors.white
                      : const Color(0xFF374151),
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyDestinationsCard extends StatelessWidget {
  const _EmptyDestinationsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFF9FAFB),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.public_rounded,
                size: 24,
                color: Color(0xFF9CA3AF),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'No destinations found',
              style: TextStyle(
                color: Color(0xFF1F2937),
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'We\'re expanding to this region soon!',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
