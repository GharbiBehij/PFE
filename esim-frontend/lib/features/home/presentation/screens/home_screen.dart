import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/destination_card.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';
import 'package:esim_frontend/features/wallet/presentation/providers/wallet_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  static const _regions = [
    ('Europe', Icons.public),
    ('Asie', Icons.language),
    ('Afrique', Icons.terrain),
    ('Amériques', Icons.public_outlined),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.valueOrNull is AuthAuthenticated
        ? (authState.valueOrNull as AuthAuthenticated).user
        : null;
    final popularAsync = ref.watch(popularOffersProvider);
    final walletBalanceAsync = user?.isReseller == true
      ? ref.watch(walletBalanceProvider)
      : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _Header(userName: user?.name ?? ''),
          ),
          if (user?.isReseller == true)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => context.push(RouteNames.wallet),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.account_balance_wallet_outlined, color: AppColors.primary),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'Mon portefeuille',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        walletBalanceAsync!.when(
                          data: (b) => Text(
                            b.formatted,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          loading: () => const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          error: (_, __) => const Text(
                            '--',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: const Text(
                'Régions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 72,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _regions.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  final (name, icon) = _regions[i];
                  return _RegionChip(
                    name: name,
                    icon: icon,
                    onTap: () => context.push(RouteNames.destinations),
                  );
                },
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Populaires',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.push(RouteNames.destinations),
                    child: const Text(
                      'Voir tout',
                      style: TextStyle(color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
          ),
          popularAsync.when(
            loading: () => SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, __) => const _ShimmerCard(),
                childCount: 3,
              ),
            ),
            error: (_, __) => SliverToBoxAdapter(
              child: EmptyState(
                message: 'Erreur de chargement',
                icon: Icons.error_outline,
                onRetry: () => ref.invalidate(popularOffersProvider),
              ),
            ),
            data: (offers) {
              final Map<String, int> lowest = {};
              for (final o in offers) {
                if (!lowest.containsKey(o.country) ||
                    o.price < lowest[o.country]!) {
                  lowest[o.country] = o.price;
                }
              }
              final countries = lowest.keys.toList();
              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: DestinationCard(
                        id: countries[i],
                        name: countries[i],
                        imageUrl:
                            'https://picsum.photos/seed/${countries[i]}/400/300',
                        price: lowest[countries[i]]! / 100,
                      ),
                    ),
                    childCount: countries.length,
                  ),
                ),
              );
            },
          ),
          const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.userName});

  final String userName;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: AppColors.surface,
      padding: EdgeInsets.fromLTRB(16, top + 16, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Bon retour,',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      userName.isEmpty ? 'Utilisateur' : userName,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF3F4F6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.notifications_outlined,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () => context.push(RouteNames.search),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(AppRadius.input),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: const Row(
                children: [
                  Icon(Icons.search, color: AppColors.textSecondary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Chercher une destination...',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RegionChip extends StatelessWidget {
  const _RegionChip({
    required this.name,
    required this.icon,
    required this.onTap,
  });

  final String name;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                color: Color(0xFFEDE9FE),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 16, color: AppColors.primary),
            ),
            const SizedBox(width: 8),
            Text(
              name,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Container(
        height: 180,
        decoration: BoxDecoration(
          color: const Color(0xFFE5E7EB),
          borderRadius: BorderRadius.circular(AppRadius.card),
        ),
      ),
    );
  }
}
