import 'package:flutter/material.dart';

import 'package:esim_frontend/features/esims/data/models/esim_model.dart';

class DataUsageGauge extends StatelessWidget {
  const DataUsageGauge({required this.esim, this.size = 140, super.key});

  final EsimModel esim;
  final double size;

  @override
  Widget build(BuildContext context) {
    final ratio = esim.usageRatio;
    final pct = esim.usagePercent;
    final color = _colorForUsage(ratio);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: size,
          height: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: size,
                height: size,
                child: CircularProgressIndicator(
                  value: ratio,
                  strokeWidth: 10,
                  backgroundColor: const Color(0xFFE5E7EB),
                  color: color,
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$pct%',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'utilise',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          esim.usageSummaryFr,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF4B5563),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Color _colorForUsage(double ratio) {
    if (ratio > 0.9) return const Color(0xFFDC2626);
    if (ratio >= 0.7) return const Color(0xFFD97706);
    return const Color(0xFF16A34A);
  }
}
