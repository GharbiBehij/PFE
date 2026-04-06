import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/core/widgets/package_card.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';

class PackageListingScreen extends ConsumerStatefulWidget {
  const PackageListingScreen({required this.countryId, super.key});

  final String countryId;

  @override
  ConsumerState<PackageListingScreen> createState() =>
      _PackageListingScreenState();
}

class _PackageListingScreenState
    extends ConsumerState<PackageListingScreen> {
  int? _selectedOfferId;

  @override
  Widget build(BuildContext context) {
    final offersAsync = ref.watch(offersByCountryProvider(widget.countryId));
    final bottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      body: Stack(
        children: [
          Column(
            children: [
              // ── Gradient header ──────────────────────────────────────────
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF7C3AED), Color(0xFF4338CA)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(40),
                    bottomRight: Radius.circular(40),
                  ),
                ),
                padding: EdgeInsets.fromLTRB(
                    16, MediaQuery.of(context).padding.top + 16, 16, 32),
                child: Column(
                  children: [
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back,
                              color: Colors.white),
                          onPressed: () => context.pop(),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.search, color: Colors.white),
                          onPressed: () => context.push(RouteNames.search),
                        ),
                      ],
                    ),
                    const Text(
                      'Choisir un forfait',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '🌐 ${widget.countryId}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Sélectionnez le meilleur forfait pour votre voyage',
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              // ── Package list ─────────────────────────────────────────────
              Expanded(
                child: Transform.translate(
                  offset: const Offset(0, -16),
                  child: offersAsync.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (_, __) => EmptyState(
                      message: 'Erreur de chargement',
                      onRetry: () => ref.invalidate(
                          offersByCountryProvider(widget.countryId)),
                    ),
                    data: (offers) {
                      if (offers.isEmpty) {
                        return const EmptyState(
                            message: 'Aucun forfait disponible');
                      }
                      return ListView.separated(
                        padding: EdgeInsets.fromLTRB(
                            16, 16, 16, bottom + 80),
                        itemCount: offers.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 16),
                        itemBuilder: (_, i) {
                          final offer = offers[i];
                          final isBestValue = offers.length >= 3 &&
                              i == offers.length ~/ 2;
                          return PackageCard(
                            id: offer.id.toString(),
                            dataAmount: offer.formattedData,
                            validity: offer.validityDays,
                            price: offer.price / 100,
                            features: [
                              'Données 4G/5G',
                              'Valide ${offer.validityDays} jours',
                              'Activation instantanée',
                            ],
                            isBestValue: isBestValue,
                            isSelected: _selectedOfferId == offer.id,
                            onTap: () =>
                                setState(() => _selectedOfferId = offer.id),
                          );
                        },
                      );
                    },
                  ),
                ),
              ),
            ],
          ),

          // ── Sticky CTA ───────────────────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: AnimatedSlide(
              duration: const Duration(milliseconds: 200),
              offset: _selectedOfferId == null
                  ? const Offset(0, 1)
                  : Offset.zero,
              child: Container(
                padding: EdgeInsets.fromLTRB(16, 12, 16, bottom + 12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    top: BorderSide(color: AppColors.divider),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x1A000000),
                      blurRadius: 8,
                      offset: Offset(0, -2),
                    ),
                  ],
                ),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _selectedOfferId == null
                        ? null
                        : () => context.push(
                            RouteNames.package(_selectedOfferId!.toString())),
                    icon: const Icon(Icons.arrow_forward),
                    label: const Text(
                      'Voir les détails',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      foregroundColor: AppColors.textPrimary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
