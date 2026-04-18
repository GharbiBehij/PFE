import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/motion/widgets/motion_fade_slide_switcher.dart';
import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/features/payment/models/purchase_result.dart';
import 'package:esim_frontend/features/payment/presentation/providers/payment_providers.dart';

class SuccessScreen extends ConsumerStatefulWidget {
  const SuccessScreen({this.result, super.key});

  final PurchaseResult? result;

  @override
  ConsumerState<SuccessScreen> createState() => _SuccessScreenState();
}

class _SuccessScreenState extends ConsumerState<SuccessScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _iconProgress;
  late final Animation<double> _textOpacity;
  late final Animation<Offset> _textOffset;
  late final Animation<double> _cardOpacity;
  late final Animation<Offset> _cardOffset;

  Timer? _copiedTimer;
  Timer? _pollTimer;
  bool _copied = false;

  static const _pollInterval = Duration(seconds: 3);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppMotion.slow);

    _iconProgress = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.55, curve: AppMotion.elasticOut),
    );
    _textOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.2, 0.55, curve: AppMotion.easeOut),
    );
    _textOffset = Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.2, 0.55, curve: AppMotion.easeOutCubic),
          ),
        );
    _cardOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.4, 1.0, curve: AppMotion.easeOut),
    );
    _cardOffset = Tween<Offset>(begin: const Offset(0, 0.16), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.4, 1.0, curve: AppMotion.easeOutCubic),
          ),
        );

    _controller.forward();
    _maybeStartPolling();
  }

  void _maybeStartPolling() {
    if (widget.result == null) return;
    final id = widget.result!.transactionId;
    _pollTimer = Timer.periodic(_pollInterval, (_) {
      if (!mounted) {
        _pollTimer?.cancel();
        return;
      }
      final tx = ref.read(transactionDetailProvider(id)).value;
      if (tx != null) {
        final hasCode =
            tx.esims?.isNotEmpty == true && tx.esims!.first.qrCode != null;
        if (hasCode || tx.isFailed) {
          _pollTimer?.cancel();
          return;
        }
      }
      ref.invalidate(transactionDetailProvider(id));
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _copiedTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleCopy(String code) async {
    await Clipboard.setData(ClipboardData(text: code));
    if (!mounted) return;

    setState(() => _copied = true);
    _copiedTimer?.cancel();
    _copiedTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _copied = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final id = widget.result?.transactionId;
    final tx = id != null
        ? ref.watch(transactionDetailProvider(id)).value
        : null;
    final esims = tx?.esims;
    final activationCode = (esims != null && esims.isNotEmpty)
        ? esims.first.qrCode
        : null;
    final isProvisioning =
        activationCode == null && (tx == null || !tx.isFailed);

    if (id != null) {
      ref.listen(transactionDetailProvider(id), (_, next) {
        final transaction = next.value;
        if (transaction == null) return;
        final hasCode =
            transaction.esims?.isNotEmpty == true &&
            transaction.esims!.first.qrCode != null;
        if (hasCode || transaction.isFailed) _pollTimer?.cancel();
      });
    }

    return Scaffold(
      body: MotionPageEnter(
        child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
          ),
        ),
        child: Stack(
          children: [
            const Positioned.fill(
              child: IgnorePointer(child: _BackgroundDecorations()),
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 24,
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 390),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AnimatedBuilder(
                          animation: _iconProgress,
                          builder: (context, child) {
                            final t = _iconProgress.value
                                .clamp(0.0, 1.0)
                                .toDouble();
                            final rotation = -math.pi * (1 - t);
                            return Transform.rotate(
                              angle: rotation,
                              child: Transform.scale(scale: t, child: child),
                            );
                          },
                          child: Container(
                            width: 96,
                            height: 96,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.22),
                                  blurRadius: 26,
                                  offset: const Offset(0, 12),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.check_rounded,
                              size: 52,
                              color: Color(0xFF7C3AED),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        FadeTransition(
                          opacity: _textOpacity,
                          child: SlideTransition(
                            position: _textOffset,
                            child: Column(
                              children: [
                                Text(
                                  'Paiement réussi !',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 32,
                                    fontWeight: FontWeight.w800,
                                    height: 1.1,
                                  ),
                                ),
                                SizedBox(height: 8),
                                ConstrainedBox(
                                  constraints: BoxConstraints(maxWidth: 270),
                                  child: Text(
                                    isProvisioning
                                        ? 'Paiement accepté. Préparation de votre eSIM...'
                                        : 'Votre eSIM est prête à être activée.',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: Color(0xFFC4B5FD),
                                      fontSize: 15,
                                      fontWeight: FontWeight.w500,
                                      height: 1.35,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 28),
                        FadeTransition(
                          opacity: _cardOpacity,
                          child: SlideTransition(
                            position: _cardOffset,
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(28),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.24),
                                    blurRadius: 34,
                                    offset: const Offset(0, 16),
                                  ),
                                ],
                              ),
                              child: Column(
                                children: [
                                  Container(
                                    width: double.infinity,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF3F4F6),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: AspectRatio(
                                      aspectRatio: 1,
                                      child: activationCode != null
                                          ? ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                              child: QrImageView(
                                                data: activationCode,
                                                version: QrVersions.auto,
                                                backgroundColor: const Color(
                                                  0xFFF3F4F6,
                                                ),
                                              ),
                                            )
                                          : CustomPaint(
                                              painter: _DashedBorderPainter(
                                                color: const Color(0xFFD1D5DB),
                                              ),
                                              child: const Center(
                                                child: Column(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: [
                                                    SizedBox(
                                                      width: 24,
                                                      height: 24,
                                                      child:
                                                          CircularProgressIndicator(
                                                            strokeWidth: 2,
                                                            color: Color(
                                                              0xFF9CA3AF,
                                                            ),
                                                          ),
                                                    ),
                                                    SizedBox(height: 10),
                                                    Text(
                                                      'Préparation de l\'eSIM...',
                                                      style: TextStyle(
                                                        color: Color(
                                                          0xFF9CA3AF,
                                                        ),
                                                        fontSize: 13,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF9FAFB),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: const Color(0xFFF3F4F6),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            activationCode ?? 'Préparation...',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: Color(0xFF4B5563),
                                              fontSize: 13,
                                              fontFamily: 'monospace',
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        DecoratedBox(
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withValues(
                                                  alpha: 0.08,
                                                ),
                                                blurRadius: 8,
                                                offset: const Offset(0, 2),
                                              ),
                                            ],
                                          ),
                                          child: MotionPressable(
                                            onTap: activationCode != null
                                                ? () => _handleCopy(
                                                    activationCode,
                                                  )
                                                : () {},
                                            child: SizedBox(
                                              width: 38,
                                              height: 38,
                                              child: MotionFadeSlideSwitcher(
                                                child: Icon(
                                                  _copied
                                                      ? Icons.check_rounded
                                                      : Icons.copy_rounded,
                                                  key: ValueKey(_copied),
                                                  color: const Color(
                                                    0xFF7C3AED,
                                                  ),
                                                  size: 19,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  Column(
                                    children: [
                                      SizedBox(
                                        width: double.infinity,
                                        child: MotionPressable(
                                          onTap: () {
                                            // Navigate to eSIM detail if available
                                            final esimId =
                                                esims?.isNotEmpty == true
                                                ? esims!.first.id
                                                : null;
                                            if (esimId != null) {
                                              context.go(
                                                RouteNames.esimDetail(esimId.toString()),
                                              );
                                            }
                                          },
                                          haptic: HapticFeedback.lightImpact,
                                          child: Container(
                                            height: 50,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFACC15),
                                              borderRadius: BorderRadius.circular(14),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black.withValues(alpha: 0.2),
                                                  blurRadius: 3,
                                                  offset: const Offset(0, 1),
                                                ),
                                              ],
                                            ),
                                            child: const Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                Icon(Icons.download_rounded, color: Color(0xFF4C1D95)),
                                                SizedBox(width: 8),
                                                Text(
                                                  'Activer l\'eSIM',
                                                  style: TextStyle(
                                                    color: Color(0xFF4C1D95),
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      SizedBox(
                                        width: double.infinity,
                                        child: MotionPressable(
                                          onTap: () => context.go(RouteNames.home),
                                          haptic: HapticFeedback.lightImpact,
                                          child: Container(
                                            height: 50,
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              border: Border.all(color: const Color(0xFFE5E7EB)),
                                              borderRadius: BorderRadius.circular(14),
                                            ),
                                            alignment: Alignment.center,
                                            child: const Text(
                                              'Retour à l\'accueil',
                                              style: TextStyle(
                                                color: Color(0xFF4B5563),
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}

class _BackgroundDecorations extends StatelessWidget {
  const _BackgroundDecorations();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: const [
        Positioned(
          top: 130,
          left: 24,
          child: _BlurCircle(size: 240, color: Color(0x808B5CF6)),
        ),
        Positioned(
          bottom: 80,
          right: -30,
          child: _BlurCircle(size: 340, color: Color(0x806366F1)),
        ),
      ],
    );
  }
}

class _BlurCircle extends StatelessWidget {
  const _BlurCircle({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: 48, sigmaY: 48),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  const _DashedBorderPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = RRect.fromRectAndRadius(
      Offset.zero & size,
      const Radius.circular(14),
    );
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    const double dash = 8;
    const double gap = 7;
    final path = Path()..addRRect(rect);
    for (final metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final next = math.min(distance + dash, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter oldDelegate) {
    return oldDelegate.color != color;
  }
}
