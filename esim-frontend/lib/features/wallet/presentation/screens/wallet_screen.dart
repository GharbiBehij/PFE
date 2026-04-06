import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/wallet/models/wallet_ledger_entry.dart';
import 'package:esim_frontend/features/wallet/presentation/providers/wallet_providers.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  static const _presetAmounts = <int>[5, 10, 20, 50];

  final TextEditingController _customAmountController = TextEditingController();
  int? _selectedAmountDinars;
  bool _showAllHistory = false;

  @override
  void dispose() {
    _customAmountController.dispose();
    super.dispose();
  }

  int? _resolveAmountInCents() {
    if (_selectedAmountDinars != null) {
      return _selectedAmountDinars! * 100;
    }

    final raw = _customAmountController.text.trim().replaceAll(',', '.');
    if (raw.isEmpty) return null;

    final dinars = double.tryParse(raw);
    if (dinars == null || dinars <= 0) return null;

    return (dinars * 100).round();
  }

  String _formatDate(DateTime d) {
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final year = d.year.toString();
    final hour = d.hour.toString().padLeft(2, '0');
    final minute = d.minute.toString().padLeft(2, '0');
    return '$day/$month/$year a $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider).valueOrNull;
    final user = authState is AuthAuthenticated ? authState.user : null;

    if (user?.isReseller != true) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        appBar: AppBar(title: const Text('Mon Portefeuille')),
        body: const EmptyState(
          icon: Icons.lock_outline,
          message: 'Portefeuille reserve aux revendeurs (B2B2C). Les clients B2C utilisent le paiement direct.',
        ),
      );
    }

    final balanceAsync = ref.watch(walletBalanceProvider);
    final historyAsync = ref.watch(walletHistoryProvider);
    final topUpState = ref.watch(topUpProvider);

    ref.listen<TopUpState>(topUpProvider, (_, next) {
      if (next is TopUpSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Rechargement reussi. Nouveau solde: ${next.newBalance.formatted}'),
            backgroundColor: Colors.green,
          ),
        );
        ref.read(topUpProvider.notifier).reset();
        _customAmountController.clear();
        setState(() => _selectedAmountDinars = null);
      }

      if (next is TopUpError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.message),
            backgroundColor: AppColors.error,
          ),
        );
        ref.read(topUpProvider.notifier).reset();
      }
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text(
          'Mon Portefeuille',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        centerTitle: false,
        elevation: 2,
        shadowColor: const Color(0x14000000),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(walletBalanceProvider);
          ref.invalidate(walletHistoryProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            balanceAsync.when(
              data: (balance) => _BalanceCard(balanceText: balance.formatted),
              loading: () => const _BalanceCard(balanceText: '...'),
              error: (_, __) => const _BalanceCard(balanceText: 'Erreur'),
            ),
            const SizedBox(height: 20),
            const Text(
              'Recharger',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _presetAmounts.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 2.5,
              ),
              itemBuilder: (_, i) {
                final value = _presetAmounts[i];
                final selected = _selectedAmountDinars == value;
                return InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    setState(() => _selectedAmountDinars = value);
                    _customAmountController.clear();
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: selected ? const Color(0xFFF5F3FF) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: selected ? const Color(0xFF7C3AED) : const Color(0xFFE5E7EB),
                        width: 1.8,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '$value€',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _customAmountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                hintText: 'Montant personnalise',
                suffixText: '€',
                filled: true,
                fillColor: const Color(0xFFF9FAFB),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
              onChanged: (_) {
                if (_selectedAmountDinars != null) {
                  setState(() => _selectedAmountDinars = null);
                }
              },
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFACC15),
                  foregroundColor: const Color(0xFF111827),
                  minimumSize: const Size(double.infinity, 50),
                ),
                onPressed: topUpState is TopUpLoading
                    ? null
                    : () {
                        final amount = _resolveAmountInCents();
                        if (amount == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Veuillez saisir un montant valide.'),
                              backgroundColor: AppColors.error,
                            ),
                          );
                          return;
                        }
                        ref.read(topUpProvider.notifier).topUp(amount);
                      },
                child: topUpState is TopUpLoading
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text(
                        'Recharger',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Historique',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _showAllHistory = !_showAllHistory),
                  child: Text(
                    _showAllHistory ? 'Reduire' : 'Tout voir',
                    style: const TextStyle(
                      color: Color(0xFF7C3AED),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            historyAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, __) => const Padding(
                padding: EdgeInsets.only(top: 12),
                child: EmptyState(message: 'Erreur de chargement de l\'historique'),
              ),
              data: (entries) {
                final sorted = [...entries]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
                final visible = _showAllHistory ? sorted : sorted.take(5).toList();

                if (visible.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: EmptyState(message: 'Aucune operation pour le moment'),
                  );
                }

                return Column(
                  children: visible
                      .map(
                        (e) => _LedgerRow(
                          entry: e,
                          date: _formatDate(e.createdAt),
                        ),
                      )
                      .toList(),
                );
              },
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => context.push(RouteNames.topup),
              icon: const Icon(Icons.add_circle_outline),
              label: const Text('Aller au rechargement complet'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.balanceText});

  final String balanceText;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF4338CA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x334338CA),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Solde disponible',
            style: TextStyle(color: Color(0xCCFFFFFF), fontSize: 14),
          ),
          const SizedBox(height: 8),
          Text(
            balanceText,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _LedgerRow extends StatelessWidget {
  const _LedgerRow({required this.entry, required this.date});

  final WalletLedgerEntry entry;
  final String date;

  (IconData, Color, Color) _styleForType(String type) {
    switch (type) {
      case 'TOPUP':
        return (Icons.arrow_downward_rounded, const Color(0xFF15803D), const Color(0xFFDCFCE7));
      case 'COMMITTED':
        return (Icons.arrow_upward_rounded, const Color(0xFFDC2626), const Color(0xFFFEE2E2));
      case 'RESERVED':
        return (Icons.schedule_rounded, const Color(0xFFEA580C), const Color(0xFFFFEDD5));
      case 'RELEASED':
        return (Icons.undo_rounded, const Color(0xFF2563EB), const Color(0xFFDBEAFE));
      default:
        return (Icons.receipt_long_rounded, const Color(0xFF6B7280), const Color(0xFFF3F4F6));
    }
  }

  @override
  Widget build(BuildContext context) {
    final (icon, iconColor, bgColor) = _styleForType(entry.type);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.description?.trim().isNotEmpty == true ? entry.description! : entry.type,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  date,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
          ),
          Text(
            entry.formattedAmount,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: entry.isCredit ? const Color(0xFF15803D) : const Color(0xFFDC2626),
            ),
          ),
        ],
      ),
    );
  }
}
