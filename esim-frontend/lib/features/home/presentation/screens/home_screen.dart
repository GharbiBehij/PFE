import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';
import 'package:esim_frontend/features/wallet/presentation/providers/wallet_providers.dart';
import 'package:esim_frontend/features/home/presentation/widgets/home_header.dart';
import 'package:esim_frontend/features/home/presentation/widgets/region_chip.dart';
import 'package:esim_frontend/features/home/presentation/widgets/popular_destinations_section.dart';

class _RegionData {
  const _RegionData(this.key, this.label, this.icon);
  final String key;
  final String label;
  final IconData icon;
}

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _activeRegion = 'all';

  static const _regions = [
    _RegionData('all', 'Tout', Icons.location_on),
    _RegionData('Europe', 'Europe', Icons.public),
    _RegionData('Asia', 'Asie', Icons.language),
    _RegionData('Africa', 'Afrique', Icons.terrain),
    _RegionData('America', 'Amériques', Icons.public_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.valueOrNull is AuthAuthenticated
        ? (authState.valueOrNull as AuthAuthenticated).user
        : null;
    final destinationsAsync = ref.watch(destinationsProvider);
    final walletBalanceAsync =
        user?.isReseller == true ? ref.watch(walletBalanceProvider) : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: HomeHeader(userName: user?.name ?? ''),
          ),
          if (user?.isReseller == true && walletBalanceAsync != null)
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
                        const Icon(
                          Icons.account_balance_wallet_outlined,
                          color: AppColors.primary,
                        ),
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
                        walletBalanceAsync.when(
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
                          error: (_, _) => const Text(
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
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  final r = _regions[i];
                  return RegionChip(
                    label: r.label,
                    icon: r.icon,
                    isActive: _activeRegion == r.key,
                    onTap: () => setState(() => _activeRegion = r.key),
                  );
                },
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: PopularDestinationsSection(
              activeRegion: _activeRegion,
              destinationsAsync: destinationsAsync,
              onSeeAll: () => context.push(RouteNames.destinations),
            ),
          ),
          const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
        ],
      ),
    );
  }
}
