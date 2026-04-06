import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';
import 'package:esim_frontend/features/payment/presentation/providers/payment_providers.dart';
import 'package:esim_frontend/features/wallet/presentation/providers/wallet_providers.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({required this.packageId, super.key});

  final String packageId;

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  String _selectedMethod = 'card';

  int get _offerId => int.tryParse(widget.packageId) ?? 0;

  void _onPay(Offer offer, String paymentMethod) {
    ref.read(purchaseProvider.notifier).purchase(
          offerId: offer.id,
          paymentMethod: paymentMethod,
        );
  }

  @override
  Widget build(BuildContext context) {
    final offerAsync = ref.watch(offerDetailProvider(_offerId));
    final purchaseState = ref.watch(purchaseProvider);
    final authState = ref.watch(authProvider).valueOrNull;
    final user = authState is AuthAuthenticated ? authState.user : null;
    final walletBalanceAsync = ref.watch(walletBalanceProvider);

    ref.listen<PurchaseState>(purchaseProvider, (_, next) {
      if (next is PurchaseSuccess) {
        ref.read(purchaseProvider.notifier).reset();
        context.go(RouteNames.success, extra: next.result);
      } else if (next is PurchaseError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    final isLoading = purchaseState is PurchaseLoading;

    return offerAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, _) => Scaffold(
        body: EmptyState(
          message: 'Forfait introuvable',
          icon: Icons.error_outline,
          onRetry: () => ref.invalidate(offerDetailProvider(_offerId)),
        ),
      ),
      data: (offer) {
        final walletBalanceCents = walletBalanceAsync.valueOrNull?.balance ?? user?.balance ?? 0;
        final walletBalanceLoading = walletBalanceAsync.isLoading;
        // Wallet is reseller-only (B2B2C); B2C clients stay on direct payments.
        final canUseWalletFlow = user?.isReseller == true;
        return _buildScreen(
          context,
          offer,
          isLoading,
          walletBalanceCents,
          walletBalanceLoading,
          canUseWalletFlow,
        );
      },
    );
  }

  Widget _buildScreen(
    BuildContext context,
    Offer offer,
    bool isLoading,
    int walletBalanceCents,
    bool walletBalanceLoading,
    bool canUseWalletFlow,
  ) {
    final safeBottom = MediaQuery.of(context).padding.bottom;
    final isWalletInsufficient = walletBalanceCents < offer.price;
    final effectiveMethod = !canUseWalletFlow && _selectedMethod == 'wallet'
        ? 'card'
        : _selectedMethod;
    final canSubmit = !isLoading && !(effectiveMethod == 'wallet' && isWalletInsufficient);

    return Scaffold(
      backgroundColor: AppColors.background,
      // ── Header ──────────────────────────────────────────────────────────
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Paiement',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: const [SizedBox(width: 48)],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: Color(0xFFE5E7EB)),
        ),
      ),

      body: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(16, 16, 16, safeBottom + 88),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Order Summary Card ─────────────────────────────────────
                _OrderSummaryCard(offer: offer),
                const SizedBox(height: 20),

                // ── Payment Methods ────────────────────────────────────────
                const Text(
                  'Methode de paiement',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                _PaymentOption(
                  value: 'card',
                  selected: effectiveMethod,
                  icon: Icons.credit_card,
                  title: 'Carte bancaire',
                  subtitle: 'Visa, Mastercard, Amex',
                  onTap: () => setState(() => _selectedMethod = 'card'),
                ),
                const SizedBox(height: 10),
                _PaymentOption(
                  value: 'apple_pay',
                  selected: effectiveMethod,
                  icon: Icons.smartphone,
                  title: 'Apple Pay',
                  subtitle: 'Rapide et securise',
                  onTap: () => setState(() => _selectedMethod = 'apple_pay'),
                ),
                if (canUseWalletFlow) ...[
                  const SizedBox(height: 10),
                  _PaymentOption(
                    value: 'wallet',
                    selected: effectiveMethod,
                    icon: Icons.account_balance_wallet_outlined,
                    title: 'Solde portefeuille',
                    subtitle: walletBalanceLoading
                        ? 'Chargement du solde...'
                        : '${(walletBalanceCents / 100).toStringAsFixed(2)}TND disponible',
                    enabled: !walletBalanceLoading && !isWalletInsufficient,
                    warningText: isWalletInsufficient ? 'Solde insuffisant' : null,
                    onTap: () => setState(() => _selectedMethod = 'wallet'),
                  ),
                ] else ...[
                  const SizedBox(height: 10),
                  const Text(
                    'Client B2C: paiement direct uniquement.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
                const SizedBox(height: 16),

                // ── Security badge ─────────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.lock_outline, size: 12, color: Color(0xFF9CA3AF)),
                    SizedBox(width: 4),
                    Text(
                      'Paiement securise et chiffre',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Sticky pay button ──────────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(16, 12, 16, safeBottom + 12),
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
              child: ElevatedButton(
                onPressed: canSubmit ? () => _onPay(offer, effectiveMethod) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  foregroundColor: const Color(0xFF3B0764), // violet-900
                  disabledBackgroundColor: AppColors.divider,
                  disabledForegroundColor: AppColors.textSecondary,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  textStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                child: isLoading
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF3B0764),
                            ),
                          ),
                          SizedBox(width: 10),
                          Text('Traitement...'),
                        ],
                      )
                    : const Text('Confirmer et payer'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Order Summary Card ─────────────────────────────────────────────────────

class _OrderSummaryCard extends StatelessWidget {
  const _OrderSummaryCard({required this.offer});

  final Offer offer;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── Plan row ──────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'PLAN',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        offer.formattedData,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${offer.formattedValidity} · ${offer.country}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDE9FE), // violet-50
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.public,
                    color: AppColors.primary,
                    size: 24,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),

          // ── Price breakdown ────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _PriceRow(
                  label: 'Sous-total',
                  value: offer.formattedPrice,
                ),
                const SizedBox(height: 8),
                const _PriceRow(label: 'Taxes', value: '0.00€'),
                const SizedBox(height: 12),
                const Divider(height: 1, color: Color(0xFFF3F4F6)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      offer.formattedPrice,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Color(0xFF4B5563)),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 14, color: Color(0xFF4B5563)),
        ),
      ],
    );
  }
}

// ── Payment Option ─────────────────────────────────────────────────────────

class _PaymentOption extends StatelessWidget {
  const _PaymentOption({
    required this.value,
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.enabled = true,
    this.warningText,
  });

  final String value;
  final String selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool enabled;
  final String? warningText;

  bool get _isSelected => value == selected;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _isSelected && enabled
              ? const Color(0xFFF5F3FF).withValues(alpha: 0.5) // violet-50/50
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isSelected && enabled
                ? AppColors.primary
                : const Color(0xFFD1D5DB),
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _isSelected && enabled
                    ? const Color(0xFFEDE9FE) // violet-100
                    : const Color(0xFFF3F4F6), // gray-100
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: _isSelected && enabled
                    ? AppColors.primary
                    : (enabled
                        ? AppColors.textSecondary
                        : const Color(0xFF9CA3AF)),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: _isSelected && enabled
                          ? AppColors.primary
                          : (enabled
                              ? AppColors.textPrimary
                              : const Color(0xFF9CA3AF)),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  if (warningText != null)
                    Text(
                      warningText!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFFEF4444),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
            // Radio indicator
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isSelected && enabled
                    ? AppColors.primary
                    : Colors.transparent,
                border: Border.all(
                  color: _isSelected && enabled
                      ? AppColors.primary
                      : const Color(0xFFD1D5DB), // gray-300
                  width: 2,
                ),
              ),
              child: _isSelected && enabled
                  ? const Icon(Icons.check, size: 12, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
