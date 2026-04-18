import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter/services.dart';

import 'package:esim_frontend/core/motion/app_hero.dart';
import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';

class PackageDetailScreen extends ConsumerWidget {
  const PackageDetailScreen({required this.packageId, super.key});

  final String packageId;

  static const _features = [
    'Données 4G/5G haute vitesse',
    'Partage de connexion activé',
    'Activation instantanée',
    'Sans frais d\'itinérance',
    'Support 24h/24 7j/7',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = int.tryParse(packageId) ?? 0;
    final offerAsync = ref.watch(offerDetailProvider(id));

    return Scaffold(
      body: MotionPageEnter(
        child: offerAsync.when(
          loading: () => _buildLoadingHero(context, id),
          error: (_, _) => const EmptyState(
            message: 'Forfait introuvable',
            icon: Icons.error_outline,
          ),
          data: (offer) => _buildDetail(context, offer),
        ),
      ),
    );
  }

  Widget _buildLoadingHero(BuildContext context, int id) {
    final top = MediaQuery.of(context).padding.top;

    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.only(top: top + 56),
        child: Column(
          children: [
            packageCardHero(
              packageId: id,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  margin: const EdgeInsets.all(16),
                  height: 260,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF7C3AED), Color(0xFF4338CA)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetail(BuildContext context, Offer offer) {
    final bottom = MediaQuery.of(context).padding.bottom;
    final top = MediaQuery.of(context).padding.top;

    final features = [
      'Données 4G/5G haute vitesse',
      'Valide ${offer.validityDays} jours',
      ..._features.skip(1),
    ];

    return Stack(
      children: [
        SingleChildScrollView(
          padding: EdgeInsets.only(bottom: bottom + 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── App bar ─────────────────────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(4, top + 8, 16, 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => context.pop(),
                    ),
                    const Expanded(
                      child: Text(
                        'Détails du forfait',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),

              // ── Main card ────────────────────────────────────────────────
              packageCardHero(
                packageId: offer.id,
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF7C3AED), Color(0xFF4338CA)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF7C3AED).withValues(alpha: 0.4),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text('🌐', style: TextStyle(fontSize: 20)),
                            const SizedBox(width: 8),
                            Text(
                              offer.country.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFFDDD6FE),
                                fontSize: 13,
                                letterSpacing: 1.2,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          offer.formattedData,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            offer.formattedValidity,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Divider(color: Colors.white24),
                        const SizedBox(height: 16),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              offer.formattedPrice,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 30,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${((offer.price * 1.2) / 100).toStringAsFixed(0)}€',
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 16,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Features ─────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Ce qui est inclus',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...features.map(
                      (f) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.check_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              f,
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ── Info box ──────────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEFCE8),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.verified_user_outlined,
                            color: Color(0xFFCA8A04),
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Votre forfait démarrera automatiquement lorsque vous vous connecterez à un réseau en ${offer.country}.',
                              style: const TextStyle(
                                color: Color(0xFF92400E),
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        ),

        // ── Sticky bottom button ─────────────────────────────────────────
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: EdgeInsets.fromLTRB(16, 12, 16, bottom + 12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.divider)),
              boxShadow: [
                BoxShadow(
                  color: Color(0x1A000000),
                  blurRadius: 8,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: MotionPressable(
                    onTap: () => context.push(RouteNames.payment(packageId)),
                    haptic: HapticFeedback.lightImpact,
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.secondary,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.secondary.withValues(alpha: 0.30),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Continuer vers le paiement',
                            style: TextStyle(
                              color: AppColors.textDark,
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(
                            Icons.arrow_forward_rounded,
                            color: AppColors.textDark,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    offer.formattedPrice,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
