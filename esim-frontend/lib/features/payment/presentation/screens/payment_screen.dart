import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter/services.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/core/widgets/country_flag.dart';
import 'package:esim_frontend/core/widgets/empty_state.dart';
import 'package:esim_frontend/features/offers/models/offer.dart';
import 'package:esim_frontend/features/offers/presentation/providers/offer_providers.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({required this.packageId, super.key});

  final String packageId;

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  String _selectedMethod = 'card';
  bool _isLoading = false;

  int get _offerId => int.tryParse(widget.packageId) ?? 0;

  Future<void> _onPayPressed() async {
    if (_isLoading) return;

    setState(() => _isLoading = true);
    await Future<void>.delayed(const Duration(seconds: 2));
  }

  @override
  Widget build(BuildContext context) {
    final offerAsync = ref.watch(offerDetailProvider(_offerId));

    return offerAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (_, _) => Scaffold(
        body: EmptyState(
          message: 'Package not found',
          icon: Icons.error_outline,
          onRetry: () => ref.invalidate(offerDetailProvider(_offerId)),
        ),
      ),
      data: (offer) => _CheckoutView(
        offer: offer,
        selectedMethod: _selectedMethod,
        isLoading: _isLoading,
        onSelectMethod: (method) {
          if (_isLoading) return;
          setState(() => _selectedMethod = method);
        },
        onPayPressed: _onPayPressed,
      ),
    );
  }
}

class _CheckoutView extends StatelessWidget {
  const _CheckoutView({
    required this.offer,
    required this.selectedMethod,
    required this.isLoading,
    required this.onSelectMethod,
    required this.onPayPressed,
  });

  final Offer offer;
  final String selectedMethod;
  final bool isLoading;
  final ValueChanged<String> onSelectMethod;
  final VoidCallback? onPayPressed;

  @override
  Widget build(BuildContext context) {
    final safeTop = MediaQuery.of(context).padding.top;
    final safeBottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: MotionPageEnter(
        child: Stack(
          children: [
          SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              16,
              safeTop + 84,
              16,
              safeBottom + 118,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _OrderSummaryCard(offer: offer),
                const SizedBox(height: 24),
                _PaymentMethodTile(
                  value: 'card',
                  selectedValue: selectedMethod,
                  icon: Icons.credit_card_rounded,
                  title: 'Carte bancaire',
                  subtitle: 'Visa, Mastercard, etc.',
                  onTap: () => onSelectMethod('card'),
                ),
                const SizedBox(height: 12),
                _PaymentMethodTile(
                  value: 'apple_pay',
                  selectedValue: selectedMethod,
                  icon: Icons.apple,
                  title: 'Apple Pay',
                  subtitle: 'Touch ID or Face ID',
                  onTap: () => onSelectMethod('apple_pay'),
                ),
                const SizedBox(height: 24),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.lock_outline_rounded,
                      size: 14,
                      color: Color(0xFF9CA3AF),
                    ),
                    SizedBox(width: 6),
                    Text(
                      'le payment est sécurisé',
                      style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _StickyHeader(safeTop: safeTop),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(16, 12, 16, safeBottom + 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x12000000),
                    blurRadius: 16,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: _PayButton(isLoading: isLoading, onPressed: onPayPressed),
            ),
          ),
        ],
      ),
      ),
    );
  }
}

class _StickyHeader extends StatelessWidget {
  const _StickyHeader({required this.safeTop});

  final double safeTop;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, safeTop + 12, 20, 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE5E7EB))),
      ),
      child: Row(
        children: [
          MotionPressable(
            onTap: () => context.pop(),
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_back_rounded,
                size: 20,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          const Expanded(
            child: Text(
              'Checkout',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
          ),
          const SizedBox(width: 40),
        ],
      ),
    );
  }
}

class _OrderSummaryCard extends StatelessWidget {
  const _OrderSummaryCard({required this.offer});

  final Offer offer;

  String _formatTND(int millimes) {
    final value = millimes / 1000;
    return '${value.toStringAsFixed(2)}TND';
  }

  @override
  Widget build(BuildContext context) {
    final subtotal = _formatTND(offer.price);
    const taxes = '0.00TND';

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'PLAN',
                      style: TextStyle(
                        fontSize: 11,
                        height: 1,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        CountryFlag(
                          countryCode: offer.country,
                          size: FlagSize.md,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${offer.formattedData} Data',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            height: 1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${offer.validityDays} Days • ${offer.country}',
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFFEDE9FE),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.public_rounded,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          const SizedBox(height: 16),
          _PriceRow(label: 'Subtotal', value: subtotal),
          const SizedBox(height: 10),
          const _PriceRow(label: 'Taxes', value: taxes),
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          const SizedBox(height: 14),
          _PriceRow(label: 'Total', value: subtotal, highlighted: true),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({
    required this.label,
    required this.value,
    this.highlighted = false,
  });

  final String label;
  final String value;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final labelStyle = TextStyle(
      color: highlighted ? AppColors.textPrimary : const Color(0xFF6B7280),
      fontSize: highlighted ? 16 : 14,
      fontWeight: highlighted ? FontWeight.w700 : FontWeight.w500,
    );

    final valueStyle = TextStyle(
      color: highlighted ? AppColors.primary : const Color(0xFF6B7280),
      fontSize: highlighted ? 24 : 14,
      fontWeight: highlighted ? FontWeight.w700 : FontWeight.w500,
      height: highlighted ? 1 : 1.1,
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: labelStyle),
        Text(value, style: valueStyle),
      ],
    );
  }
}

class _PaymentMethodTile extends StatefulWidget {
  const _PaymentMethodTile({
    required this.value,
    required this.selectedValue,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String value;
  final String selectedValue;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  State<_PaymentMethodTile> createState() => _PaymentMethodTileState();
}

class _PaymentMethodTileState extends State<_PaymentMethodTile> {
  bool get _isSelected => widget.value == widget.selectedValue;

  @override
  Widget build(BuildContext context) {
    return MotionPressable(
      onTap: widget.onTap,
      haptic: HapticFeedback.selectionClick,
      child: AnimatedContainer(
          duration: AppMotion.fast,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: _isSelected ? AppColors.primary : AppColors.divider,
              width: _isSelected ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: _isSelected
                    ? AppColors.primary.withValues(alpha: 0.10)
                    : Colors.black.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _isSelected
                      ? const Color(0xFFEDE9FE)
                      : const Color(0xFFF3F4F6),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  widget.icon,
                  color: _isSelected
                      ? AppColors.primary
                      : const Color(0xFF6B7280),
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.subtitle,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _isSelected
                        ? AppColors.primary
                        : const Color(0xFFD1D5DB),
                    width: 2,
                  ),
                ),
                child: _isSelected
                    ? Center(
                        child: Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      )
                    : null,
              ),
            ],
          ),
        ),
    );
  }
}

class _PayButton extends StatelessWidget {
  const _PayButton({required this.isLoading, required this.onPressed});

  final bool isLoading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null;
    final canTap = onPressed != null && !isLoading;

    return AnimatedOpacity(
      duration: AppMotion.fast,
      opacity: isDisabled ? 0.55 : 1,
      child: Container(
        width: double.infinity,
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: isDisabled
              ? null
              : [
                  BoxShadow(
                    color: AppColors.secondary.withValues(alpha: 0.45),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
        ),
        child: MotionPressable(
          onTap: canTap ? onPressed! : () {},
          haptic: HapticFeedback.lightImpact,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.secondary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Center(
              child: isLoading
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Color(0xFF3B0764),
                          ),
                        ),
                        SizedBox(width: 10),
                        Text(
                          'Processing...',
                          style: TextStyle(
                            color: Color(0xFF3B0764),
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    )
                  : const Text(
                      'Confirm & Pay',
                      style: TextStyle(
                        color: Color(0xFF3B0764),
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
