import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'package:esim_frontend/core/motion/widgets/motion_fade_slide_switcher.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';

class QrCodeCard extends StatefulWidget {
  const QrCodeCard({
    required this.qrCode,
    required this.iccid,
    super.key,
  });

  final String? qrCode;
  final String iccid;

  @override
  State<QrCodeCard> createState() => _QrCodeCardState();
}

class _QrCodeCardState extends State<QrCodeCard> {
  bool _expanded = true;
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    final qrValue = widget.qrCode;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          MotionPressable(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Code QR et ICCID',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF111827),
                    ),
                  ),
                ),
                Icon(
                  _expanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: const Color(0xFF6B7280),
                ),
              ],
            ),
          ),
          MotionFadeSlideSwitcher(
            child: _expanded
                ? Padding(
                    key: const ValueKey('qr_open'),
                    padding: const EdgeInsets.only(top: 14),
                    child: Column(
                      children: [
                        _QrView(qrCode: qrValue),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  widget.iccid.isEmpty ? '-' : widget.iccid,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF374151),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              MotionPressable(
                                onTap: _copyIccid,
                                child: Row(
                                  children: [
                                    Icon(
                                      _copied
                                          ? Icons.check_rounded
                                          : Icons.copy_rounded,
                                      size: 16,
                                      color: _copied
                                          ? const Color(0xFF16A34A)
                                          : const Color(0xFF6B7280),
                                    ),
                                    const SizedBox(width: 4),
                                    const Text(
                                      'Copier',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Touchez pour copier l\'ICCID.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(key: ValueKey('qr_closed')),
          ),
        ],
      ),
    );
  }

  Future<void> _copyIccid() async {
    await Clipboard.setData(ClipboardData(text: widget.iccid));
    if (!mounted) return;
    setState(() => _copied = true);
    await Future<void>.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() => _copied = false);
    }
  }
}

class _QrView extends StatelessWidget {
  const _QrView({required this.qrCode});

  final String? qrCode;

  @override
  Widget build(BuildContext context) {
    if (qrCode == null || qrCode!.trim().isEmpty) {
      return const _QrFallback();
    }

    final imageBytes = _decodeQrImage(qrCode!);
    if (imageBytes != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Image.memory(
          imageBytes,
          width: 210,
          height: 210,
          fit: BoxFit.cover,
        ),
      );
    }

    return QrImageView(
      data: qrCode!,
      size: 210,
      version: QrVersions.auto,
      backgroundColor: Colors.white,
    );
  }

  Uint8List? _decodeQrImage(String value) {
    try {
      final raw = value.contains(',') ? value.split(',').last : value;
      final normalized = raw.replaceAll('\n', '').trim();
      return base64Decode(normalized);
    } catch (_) {
      return null;
    }
  }
}

class _QrFallback extends StatelessWidget {
  const _QrFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 210,
      height: 210,
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(16),
      ),
      alignment: Alignment.center,
      child: const Text(
        'QR indisponible',
        style: TextStyle(
          fontSize: 13,
          color: Color(0xFF6B7280),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
