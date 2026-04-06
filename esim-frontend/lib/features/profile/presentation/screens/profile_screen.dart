import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/wallet/presentation/providers/wallet_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider).valueOrNull;
    final user = authState is AuthAuthenticated ? authState.user : null;
    final walletBalanceAsync = user?.isReseller == true
        ? ref.watch(walletBalanceProvider)
        : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Profil'),
        backgroundColor: AppColors.surface,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // User info card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppRadius.cardRadius,
              border: Border.all(color: AppColors.divider),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: const Color(0xFFEDE9FE),
                  child: Text(
                    user?.name.isNotEmpty == true
                        ? user!.name[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? '—',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user?.email ?? '—',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      if (user != null) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEDE9FE),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            user.role,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          if (user?.isReseller == true) ...[
            InkWell(
              onTap: () => context.push(RouteNames.wallet),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.account_balance_wallet_outlined, color: AppColors.primary),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'Mon portefeuille',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    walletBalanceAsync!.when(
                      data: (b) => Text(
                        b.formatted,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      loading: () => const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      error: (_, __) => const Text('--'),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 14),
          ],

          // Logout button
          SizedBox(
            height: 52,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                backgroundColor: AppColors.surface,
              ),
              icon: const Icon(Icons.logout_rounded, size: 20),
              label: const Text(
                'Se déconnecter',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
              ),
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go(RouteNames.login);
              },
            ),
          ),
        ],
      ),
    );
  }
}
