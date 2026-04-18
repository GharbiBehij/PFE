import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/widgets/country_flag.dart';
import 'package:esim_frontend/features/esims/data/models/esim_model.dart';

class EsimListItem extends StatelessWidget {
  const EsimListItem({
    required this.esim,
    required this.onTap,
    super.key,
  });

  final EsimModel esim;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(esim.status);

    return MotionPressable(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Hero(
                  tag: 'esim-header-${esim.id}',
                  child: Material(
                    color: Colors.transparent,
                    child: Row(
                      children: [
                        CountryFlag(
                          countryCode: esim.offer.countryCode,
                          size: FlagSize.md,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          esim.destinationLabel,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                _StatusBadge(status: esim.status, color: statusColor),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                minHeight: 8,
                value: esim.usageRatio,
                backgroundColor: const Color(0xFFE5E7EB),
                valueColor: AlwaysStoppedAnimation<Color>(
                  _usageColor(esim.usageRatio),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              esim.usageSummaryFr,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF4B5563),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _expiryText(esim),
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _expiryText(EsimModel model) {
    if (model.expiresAt == null) return 'Validite non disponible';
    if (model.daysRemaining != null && model.daysRemaining! > 0) {
      return 'Expire dans ${model.daysRemaining} jours';
    }
    return 'Actif jusqu\'au ${model.formattedExpiresAt}';
  }

  Color _statusColor(EsimStatus status) {
    return switch (status) {
      EsimStatus.active => const Color(0xFF15803D),
      EsimStatus.pending => const Color(0xFFD97706),
      EsimStatus.expired => const Color(0xFF6B7280),
      EsimStatus.deleted => const Color(0xFF6B7280),
    };
  }

  Color _usageColor(double ratio) {
    if (ratio > 0.9) return const Color(0xFFDC2626);
    if (ratio >= 0.7) return const Color(0xFFD97706);
    return const Color(0xFF16A34A);
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status, required this.color});

  final EsimStatus status;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.labelFr,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}
