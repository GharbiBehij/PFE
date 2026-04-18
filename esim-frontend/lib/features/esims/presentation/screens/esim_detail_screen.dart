import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/widgets/country_flag.dart';
import 'package:esim_frontend/features/esims/data/models/esim_model.dart';
import 'package:esim_frontend/features/esims/presentation/providers/esims_provider.dart';
import 'package:esim_frontend/features/esims/presentation/widgets/data_usage_gauge.dart';
import 'package:esim_frontend/features/esims/presentation/widgets/qr_code_card.dart';

class EsimDetailScreen extends ConsumerWidget {
  const EsimDetailScreen({required this.esimId, super.key});

  final String esimId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(esimDetailProvider(esimId));

    ref.listen<EsimDetailState>(esimDetailProvider(esimId), (previous, next) {
      next.maybeWhen(
        error: (message) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        },
        orElse: () {},
      );
    });

    final esim = state.maybeWhen(
      loaded: (value) => value,
      syncing: (value) => value,
      orElse: () => null,
    );

    final isInitialOrLoading = state.maybeWhen(
      initial: () => true,
      loading: () => true,
      orElse: () => false,
    );

    if (isInitialOrLoading || esim == null) {
      return const Scaffold(
        backgroundColor: Color(0xFFF9FAFB),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF7C3AED)),
        ),
      );
    }

    final isSyncing = state.maybeWhen(
      syncing: (_) => true,
      orElse: () => false,
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: MotionPageEnter(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.white,
              title: Hero(
                tag: 'esim-header-${esim.id}',
                child: Material(
                  color: Colors.transparent,
                  child: Row(
                    children: [
                      CountryFlag(
                        countryCode: esim.offer.countryCode,
                        size: FlagSize.sm,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          esim.destinationLabel,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              leading: IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 18, 24, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _HeroCard(esim: esim),
                    const SizedBox(height: 18),
                    _UsageCard(esim: esim),
                    const SizedBox(height: 16),
                    QrCodeCard(qrCode: esim.qrCode, iccid: esim.iccid),
                    const SizedBox(height: 16),
                    _DetailsCard(esim: esim),
                    const SizedBox(height: 18),
                    _Actions(
                      isSyncing: isSyncing,
                      canDelete: esim.canDelete,
                      onSync: () => ref
                          .read(esimDetailProvider(esimId).notifier)
                          .syncUsage(),
                      onDelete: () => _onDeletePressed(context, ref),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onDeletePressed(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Supprimer cette eSIM ?'),
          content: const Text('Cette action est irreversible.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Annuler'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
              ),
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Supprimer'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    final deleted = await ref
        .read(esimDetailProvider(esimId).notifier)
        .deleteEsim();
    if (deleted && context.mounted) {
      context.pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('eSIM supprimee avec succes.'),
          backgroundColor: Color(0xFF15803D),
        ),
      );
    }
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.esim});

  final EsimModel esim;

  bool get _isExpired =>
      esim.status == EsimStatus.expired || esim.status == EsimStatus.deleted;

  bool get _isPending => esim.status == EsimStatus.pending;

  String get _statusText {
    if (_isExpired) return 'Expired';
    if (_isPending) return 'Pending';
    return 'Connected';
  }

  Color get _statusColor {
    if (_isExpired) return const Color(0xFFD1D5DB);
    if (_isPending) return const Color(0xFFFACC15);
    return const Color(0xFF86EFAC);
  }

  List<Color> get _gradient {
    if (_isExpired) {
      return const [Color(0xFF9CA3AF), Color(0xFF6B7280)];
    }
    if (_isPending) {
      return const [Color(0xFF8B5CF6), Color(0xFF6D28D9)];
    }
    return const [Color(0xFF7C3AED), Color(0xFF4338CA)];
  }

  int _daysRemaining() {
    final exp = esim.expiresAt;
    if (exp == null) return 0;
    final days = exp.difference(DateTime.now()).inDays;
    return days > 0 ? days : 0;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          colors: _gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            Positioned(
              top: -16,
              right: -10,
              child: Icon(
                Icons.public,
                size: 122,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.12),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.signal_cellular_alt_rounded,
                              size: 12,
                              color: _statusColor,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _statusText,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      Text(
                        esim.offer.region.isEmpty ? '-' : esim.offer.region,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      CountryFlag(
                        countryCode: esim.offer.countryCode,
                        size: FlagSize.lg,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          esim.destinationLabel,
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            height: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    esim.offer.country,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_rounded,
                        size: 14,
                        color: Colors.white70,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isExpired
                            ? 'Expired'
                            : '${_daysRemaining()} days left',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '• ${esim.formattedExpiresAt}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UsageCard extends StatelessWidget {
  const _UsageCard({required this.esim});

  final EsimModel esim;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Data Usage',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111827),
              ),
            ),
          ),
          const SizedBox(height: 14),
          DataUsageGauge(esim: esim),
          const SizedBox(height: 14),
          Row(
            children: [
              _UsageStat(label: 'Used', value: esim.formattedDataUsed),
              const SizedBox(width: 10),
              _UsageStat(
                label: 'Remaining',
                value: esim.formattedDataRemaining,
              ),
              const SizedBox(width: 10),
              _UsageStat(label: 'Total', value: esim.formattedDataTotal),
            ],
          ),
        ],
      ),
    );
  }
}

class _UsageStat extends StatelessWidget {
  const _UsageStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF3F4F6)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 3),
            Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111827),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailsCard extends StatelessWidget {
  const _DetailsCard({required this.esim});

  final EsimModel esim;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Plan Details',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111827),
              ),
            ),
          ),
          const SizedBox(height: 8),
          _InfoRow(label: 'Activation Date', value: esim.formattedActivatedAt),
          _InfoRow(label: 'Expiry Date', value: esim.formattedExpiresAt),
          _InfoRow(
            label: 'Days Remaining',
            value: esim.daysRemaining?.toString() ?? '-',
          ),
          _InfoRow(label: 'Total Data', value: esim.formattedDataTotal),
          _InfoRow(label: 'Data Left', value: esim.formattedDataRemaining),
          _InfoRow(
            label: 'Destination',
            value: esim.destinationLabel,
            isLast: true,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.isLast = false,
  });

  final String label;
  final String value;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
              ),
              const Spacer(),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF111827),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        if (!isLast) const Divider(height: 1, color: Color(0xFFE5E7EB)),
      ],
    );
  }
}

class _Actions extends StatelessWidget {
  const _Actions({
    required this.isSyncing,
    required this.canDelete,
    required this.onSync,
    required this.onDelete,
  });

  final bool isSyncing;
  final bool canDelete;
  final VoidCallback onSync;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: MotionPressable(
            onTap: isSyncing ? () {} : onSync,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                gradient: const LinearGradient(
                  colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF7C3AED).withValues(alpha: 0.28),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: isSyncing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Refresh Usage',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: MotionPressable(
            onTap: canDelete ? onDelete : () {},
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: canDelete
                    ? const Color(0xFFFEE2E2)
                    : const Color(0xFFF3F4F6),
                border: Border.all(
                  color: canDelete
                      ? const Color(0xFFFECACA)
                      : const Color(0xFFE5E7EB),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                'Delete eSIM',
                style: TextStyle(
                  color: canDelete
                      ? const Color(0xFFB91C1C)
                      : const Color(0xFF9CA3AF),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
