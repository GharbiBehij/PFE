import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/wallet/models/wallet_balance.dart';
import 'package:esim_frontend/features/wallet/presentation/providers/wallet_providers.dart';

class TopUpScreen extends ConsumerStatefulWidget {
  const TopUpScreen({super.key});

  @override
  ConsumerState<TopUpScreen> createState() => _TopUpScreenState();
}

class _TopUpScreenState extends ConsumerState<TopUpScreen> {
  static const _presetAmounts = <int>[5, 10, 20, 50, 100];

  int? _selectedDinars = 20;
  String _paymentMethod = 'card';
  final TextEditingController _customController = TextEditingController();

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  int? _amountInCents() {
    if (_selectedDinars != null) return _selectedDinars! * 100;

    final raw = _customController.text.trim().replaceAll(',', '.');
    if (raw.isEmpty) return null;
    final value = double.tryParse(raw);
    if (value == null || value <= 0) return null;
    return (value * 100).round();
  }

  String _formatCents(int cents) => '${(cents / 100).toStringAsFixed(2)}€';

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider).valueOrNull;
    final user = authState is AuthAuthenticated ? authState.user : null;

    if (user?.isReseller != true) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        appBar: AppBar(
          centerTitle: true,
          title: const Text('Recharger mon compte'),
        ),
        body: const EmptyState(
          icon: Icons.credit_card_outlined,
          message: 'Le rechargement portefeuille est reserve aux revendeurs. Le flux B2C utilise le paiement direct.',
        ),
      );
    }

    final balanceAsync = ref.watch(walletBalanceProvider);
    final topUpState = ref.watch(topUpProvider);

    ref.listen<TopUpState>(topUpProvider, (_, next) {
      if (next is TopUpSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rechargement effectue avec succes.'),
            backgroundColor: Colors.green,
          ),
        );
        ref.read(topUpProvider.notifier).reset();
        Navigator.of(context).pop();
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

    final amount = _amountInCents();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        centerTitle: true,
        title: const Text('Recharger mon compte'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          balanceAsync.when(
            data: (b) => _BalanceSmallCard(balance: b),
            loading: () => const _BalanceSmallCard(balance: WalletBalance(balance: 0)),
            error: (_, __) => const _BalanceSmallCard(balance: WalletBalance(balance: 0)),
          ),
          const SizedBox(height: 16),
          const Text(
            'Choisissez un montant',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 10),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _presetAmounts.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 2.4,
            ),
            itemBuilder: (_, i) {
              final dinars = _presetAmounts[i];
              final selected = _selectedDinars == dinars;
              return InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () {
                  setState(() => _selectedDinars = dinars);
                  _customController.clear();
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: selected ? const Color(0xFFF5F3FF) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: selected ? const Color(0xFF7C3AED) : const Color(0xFFE5E7EB),
                      width: 1.8,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '$dinars TND',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
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
            controller: _customController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) {
              if (_selectedDinars != null) {
                setState(() => _selectedDinars = null);
              }
            },
            decoration: InputDecoration(
              hintText: 'Montant personnalise',
              suffixText: 'TND',
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
          ),
          const SizedBox(height: 18),
          const Text(
            'Methode de paiement',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 10),
          _MethodTile(
            value: 'card',
            selected: _paymentMethod,
            icon: Icons.credit_card,
            title: 'Carte bancaire',
            subtitle: 'Visa, Mastercard',
            onTap: () => setState(() => _paymentMethod = 'card'),
          ),
          const SizedBox(height: 8),
          _MethodTile(
            value: 'apple_pay',
            selected: _paymentMethod,
            icon: Icons.phone_iphone,
            title: 'Apple Pay',
            subtitle: 'Paiement rapide',
            onTap: () => setState(() => _paymentMethod = 'apple_pay'),
          ),
          const SizedBox(height: 6),
          const Text(
            '// TODO: integrer une vraie passerelle de paiement',
            style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFACC15),
              foregroundColor: const Color(0xFF111827),
              minimumSize: const Size(double.infinity, 52),
              textStyle: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: topUpState is TopUpLoading
                ? null
                : () {
                    if (amount == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Veuillez choisir un montant valide.'),
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
                : Text(
                    'Confirmer le rechargement ${amount != null ? _formatCents(amount) : ''}',
                  ),
          ),
        ],
      ),
    );
  }
}

class _BalanceSmallCard extends StatelessWidget {
  const _BalanceSmallCard({required this.balance});

  final WalletBalance balance;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          const Icon(Icons.account_balance_wallet_outlined, color: AppColors.primary),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Solde actuel',
              style: TextStyle(color: Color(0xFF4B5563), fontWeight: FontWeight.w600),
            ),
          ),
          Text(
            balance.formatted,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
        ],
      ),
    );
  }
}

class _MethodTile extends StatelessWidget {
  const _MethodTile({
    required this.value,
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String value;
  final String selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final active = value == selected;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFF5F3FF) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: active ? const Color(0xFF7C3AED) : const Color(0xFFE5E7EB),
            width: 1.8,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: active ? const Color(0xFF7C3AED) : const Color(0xFF6B7280)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            ),
            Icon(
              active ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: active ? const Color(0xFF7C3AED) : const Color(0xFF9CA3AF),
            ),
          ],
        ),
      ),
    );
  }
}
