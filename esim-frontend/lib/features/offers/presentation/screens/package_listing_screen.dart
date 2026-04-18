import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/motion/widgets/motion_fade_slide_switcher.dart';
import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/motion/widgets/motion_stagger_list.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/country_flag.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';
import 'package:esim_frontend/features/offers/models/plan_type.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';
import 'package:esim_frontend/features/offers/presentation/widgets/plan_type_toggle.dart';

class PackageListingScreen extends ConsumerStatefulWidget {
  const PackageListingScreen({
    required this.countryId,
    this.heroCountry,
    this.heroImageUrl,
    super.key,
  });

  final String countryId;
  final String? heroCountry;
  final String? heroImageUrl;

  @override
  ConsumerState<PackageListingScreen> createState() =>
      _PackageListingScreenState();
}

class _PackageListingScreenState extends ConsumerState<PackageListingScreen> {
  PlanType _activePlanType = PlanType.standard;
  int? _selectedOfferId;
  Offer? _selectedOffer;

  String _safeDecode(String value) {
    try {
      return Uri.decodeComponent(value);
    } catch (_) {
      return value;
    }
  }

  String _formatCountryName(String country) {
    if (country.isEmpty) return country;
    return country[0].toUpperCase() + country.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final country = _safeDecode(widget.countryId);
    final heroCountry = (widget.heroCountry ?? '').trim();
    final countryName = _formatCountryName(
      heroCountry.isNotEmpty ? heroCountry : country,
    );
    final hasHeroImage = (widget.heroImageUrl ?? '').trim().isNotEmpty;
    final offersAsync = ref.watch(offersByCountryProvider(country));
    final safeBottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: hasHeroImage
            ? AppColors.surfaceElevated
            : AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CountryFlag(countryCode: country, size: FlagSize.sm),
            const SizedBox(width: AppSpacing.sm),
            Text(
              countryName,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () => context.push(RouteNames.search),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.divider),
        ),
      ),
      body: MotionPageEnter(
        child: Stack(
          children: [
            offersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Erreur de chargement'),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () =>
                          ref.invalidate(offersByCountryProvider(country)),
                      child: const Text('Reessayer'),
                    ),
                  ],
                ),
              ),
              data: (allOffers) {
                // ── Logic: unchanged ─────────────────────────────────────
                final filteredByPlan = _activePlanType == PlanType.standard
                    ? allOffers
                          .where(
                            (offer) =>
                                offer.dataVolume <= PlanType.dataThresholdMB,
                          )
                          .toList()
                    : allOffers
                          .where(
                            (offer) =>
                                offer.dataVolume > PlanType.dataThresholdMB,
                          )
                          .toList();

                final groupedByDays = <int, List<Offer>>{};
                for (final offer in filteredByPlan) {
                  groupedByDays
                      .putIfAbsent(offer.validityDays, () => [])
                      .add(offer);
                }

                final sortedDays = groupedByDays.keys.toList()..sort();
                for (final day in sortedDays) {
                  groupedByDays[day]!.sort((a, b) {
                    final volumeCompare = a.dataVolume.compareTo(b.dataVolume);
                    if (volumeCompare != 0) return volumeCompare;
                    return a.price.compareTo(b.price);
                  });
                }

                int? bestValueOfferId;
                if (sortedDays.isNotEmpty) {
                  final largestGroup = groupedByDays.values.reduce(
                    (a, b) => a.length >= b.length ? a : b,
                  );
                  if (largestGroup.length >= 3) {
                    bestValueOfferId =
                        largestGroup[largestGroup.length ~/ 2].id;
                  }
                }
                // ── End logic ─────────────────────────────────────────────

                return SingleChildScrollView(
                  padding: EdgeInsets.only(bottom: safeBottom + 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: AppSpacing.lg),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                        ),
                        child: PlanTypeToggle(
                          activePlan: _activePlanType,
                          onChanged: (type) => setState(() {
                            _activePlanType = type;
                            _selectedOfferId = null;
                            _selectedOffer = null;
                          }),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.fromLTRB(
                          AppSpacing.lg,
                          AppSpacing.xl,
                          AppSpacing.lg,
                          0,
                        ),
                        child: Text(
                          'Choisissez votre forfait',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textDark,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                        ),
                        child: MotionFadeSlideSwitcher(
                          child: sortedDays.isEmpty
                              ? _EmptyPackages(
                                  key: ValueKey(
                                    'empty_${_activePlanType.name}',
                                  ),
                                )
                              : MotionStaggerList(
                                  key: ValueKey(
                                    'list_${_activePlanType.name}_${sortedDays.length}',
                                  ),
                                  itemDelay: const Duration(milliseconds: 60),
                                  children: [
                                    for (final days in sortedDays) ...[
                                      _DayHeader(days: days),
                                      for (
                                        var i = 0;
                                        i < groupedByDays[days]!.length;
                                        i++
                                      ) ...[
                                        _CompactOfferCard(
                                          offer: groupedByDays[days]![i],
                                          isSelected:
                                              _selectedOfferId ==
                                              groupedByDays[days]![i].id,
                                          isBestValue:
                                              groupedByDays[days]![i].id ==
                                              bestValueOfferId,
                                          onTap: () => setState(() {
                                            _selectedOfferId =
                                                groupedByDays[days]![i].id;
                                            _selectedOffer =
                                                groupedByDays[days]![i];
                                          }),
                                        ),
                                        if (i <
                                            groupedByDays[days]!.length - 1)
                                          const SizedBox(height: 10),
                                      ],
                                    ],
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                    ],
                  ),
                );
              },
            ),

            // ── Buy Now bar (always visible) ────────────────────────────
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _BuyNowBar(
                selectedOffer: _selectedOffer,
                safeBottom: safeBottom,
                onBuy: _selectedOffer == null
                    ? null
                    : () => context.push(
                        RouteNames.payment(_selectedOfferId!.toString()),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Day section header ─────────────────────────────────────────────────────

class _DayHeader extends StatelessWidget {
  const _DayHeader({required this.days});

  final int days;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 28, bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: '$days',
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                    height: 1,
                  ),
                ),
                const TextSpan(
                  text: ' Jours',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                    height: 2.1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Divider(height: 1, color: AppColors.divider),
          ),
        ],
      ),
    );
  }
}

// ── Compact offer card (Airalo-style) ──────────────────────────────────────

class _CompactOfferCard extends StatelessWidget {
  const _CompactOfferCard({
    required this.offer,
    required this.isSelected,
    required this.isBestValue,
    required this.onTap,
  });

  final Offer offer;
  final bool isSelected;
  final bool isBestValue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MotionPressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppMotion.normal,
        curve: AppMotion.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryContainer : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.divider,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 1),
                  ),
                ],
        ),
        child: Row(
          children: [
            // Selection circle
            AnimatedContainer(
              duration: AppMotion.fast,
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.textTertiary,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(
                      Icons.check_rounded,
                      size: 13,
                      color: Colors.white,
                    )
                  : null,
            ),
            const SizedBox(width: 14),

            // Data amount
            Text(
              offer.formattedData,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: isSelected ? AppColors.primary : AppColors.textDark,
              ),
            ),
            const SizedBox(width: 8),

            // 4G/5G badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withValues(alpha: 0.12)
                    : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '4G/5G',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.textSecondary,
                ),
              ),
            ),

            // Best value badge
            if (isBestValue) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 7,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star_rounded, size: 9, color: AppColors.textDark),
                    SizedBox(width: 3),
                    Text(
                      'Best',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const Spacer(),

            // Price
            Text(
              offer.formattedPrice,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isSelected ? AppColors.primary : AppColors.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Buy Now bottom bar ─────────────────────────────────────────────────────

class _BuyNowBar extends StatelessWidget {
  const _BuyNowBar({
    required this.selectedOffer,
    required this.safeBottom,
    required this.onBuy,
  });

  final Offer? selectedOffer;
  final double safeBottom;
  final VoidCallback? onBuy;

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedOffer != null;

    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, safeBottom + 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE5E7EB), width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: MotionPressable(
        onTap: onBuy ?? () {},
        haptic: HapticFeedback.lightImpact,
        child: AnimatedContainer(
          duration: AppMotion.normal,
          curve: AppMotion.easeOutCubic,
          height: 56,
          decoration: BoxDecoration(
            color: hasSelection
                ? AppColors.secondary
                : const Color(0xFFE5E7EB),
            borderRadius: BorderRadius.circular(20),
            boxShadow: hasSelection
                ? [
                    BoxShadow(
                      color: AppColors.secondary.withValues(alpha: 0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                hasSelection ? 'Acheter maintenant' : 'Sélectionnez un forfait',
                style: TextStyle(
                  color: hasSelection
                      ? AppColors.textDark
                      : AppColors.textTertiary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (hasSelection) ...[
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.textDark.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    selectedOffer!.formattedPrice,
                    style: const TextStyle(
                      color: AppColors.textDark,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Empty state ────────────────────────────────────────────────────────────

class _EmptyPackages extends StatelessWidget {
  const _EmptyPackages({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              color: Color(0xFFF3F4F6),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.public_off_outlined,
              size: 26,
              color: AppColors.textTertiary,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Aucun forfait disponible',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Essayez un autre type de forfait',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
