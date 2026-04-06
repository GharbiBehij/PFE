import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/features/payment/models/purchase_result.dart';

class SuccessScreen extends StatefulWidget {
  const SuccessScreen({this.result, super.key});

  final PurchaseResult? result;

  @override
  State<SuccessScreen> createState() => _SuccessScreenState();
}

class _SuccessScreenState extends State<SuccessScreen>
    with TickerProviderStateMixin {
  late final AnimationController _checkController;
  late final AnimationController _contentController;

  late final Animation<double> _checkScale;
  late final Animation<double> _checkRotation;
  late final Animation<double> _textOpacity;
  late final Animation<Offset> _cardSlide;

  bool _copied = false;

  @override
  void initState() {
    super.initState();

    // Redirect if navigated directly with no result
    if (widget.result == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go(RouteNames.home);
      });
      return;
    }

    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _checkScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _checkController,
        curve: Curves.elasticOut,
      ),
    );

    _checkRotation = Tween<double>(begin: -0.5, end: 0.0).animate(
      CurvedAnimation(
        parent: _checkController,
        curve: Curves.easeOutBack,
      ),
    );

    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _contentController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );

    _cardSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _contentController,
        curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    _checkController.forward();
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _contentController.forward();
    });
  }

  @override
  void dispose() {
    if (widget.result != null) {
      _checkController.dispose();
      _contentController.dispose();
    }
    super.dispose();
  }

  Future<void> _copyCode() async {
    final code = widget.result?.esim.qrCode;
    if (code == null) return;
    await Clipboard.setData(ClipboardData(text: code));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.result == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final esim = widget.result!.esim;
    final safeBottom = MediaQuery.of(context).padding.bottom;
    final safeTop = MediaQuery.of(context).padding.top;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF7C3AED), Color(0xFF4338CA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            // ── Decorative blurred circles ─────────────────────────────
            Positioned(
              top: -80,
              left: -80,
              child: _BlurCircle(
                size: 280,
                color: const Color(0xFF8B5CF6).withValues(alpha: 0.5),
              ),
            ),
            Positioned(
              bottom: -100,
              right: -80,
              child: _BlurCircle(
                size: 300,
                color: const Color(0xFF6366F1).withValues(alpha: 0.5),
              ),
            ),

            // ── Content ────────────────────────────────────────────────
            SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24, safeTop + 24, 24, safeBottom + 24),
              child: Column(
                children: [
                  const SizedBox(height: 24),

                  // ── Animated checkmark ─────────────────────────────
                  AnimatedBuilder(
                    animation: _checkController,
                    builder: (_, _) => Transform.rotate(
                      angle: _checkRotation.value * 3.14159,
                      child: Transform.scale(
                        scale: _checkScale.value,
                        child: Container(
                          width: 96,
                          height: 96,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            size: 48,
                            color: Color(0xFF10B981), // emerald-500
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Text (fade in) ────────────────────────────────
                  FadeTransition(
                    opacity: _textOpacity,
                    child: Column(
                      children: const [
                        Text(
                          'Payment Successful!',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Your eSIM is ready to be Activated.',
                          style: TextStyle(
                            color: Color(0xFFDDD6FE), // violet-200
                            fontSize: 14,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // ── QR Code Card (slide up) ───────────────────────
                  SlideTransition(
                    position: _cardSlide,
                    child: FadeTransition(
                      opacity: _textOpacity,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 380),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 24,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // ── QR area ─────────────────────────
                              Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF3F4F6), // gray-100
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: const Color(0xFFD1D5DB),
                                    style: BorderStyle.solid,
                                  ),
                                ),
                                child: AspectRatio(
                                  aspectRatio: 1,
                                  child: Center(
                                    child: esim.qrCode != null
                                        ? Padding(
                                            padding: const EdgeInsets.all(16),
                                            child: QrImageView(
                                              data: esim.qrCode!,
                                              version: QrVersions.auto,
                                            ),
                                          )
                                        : const Text(
                                            'QR Code Placeholder',
                                            style: TextStyle(
                                              color: Color(0xFF9CA3AF),
                                              fontSize: 14,
                                            ),
                                          ),
                                  ),
                                ),
                              ),

                              const SizedBox(height: 16),

                              // ── Activation code row ──────────────
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF9FAFB), // gray-50
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: const Color(0xFFF3F4F6)),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        esim.qrCode ?? 'N/A',
                                        style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontSize: 12,
                                          color: Color(0xFF374151),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    GestureDetector(
                                      onTap: _copyCode,
                                      child: AnimatedSwitcher(
                                        duration:
                                            const Duration(milliseconds: 200),
                                        child: Icon(
                                          _copied
                                              ? Icons.check_rounded
                                              : Icons.copy_rounded,
                                          key: ValueKey(_copied),
                                          size: 18,
                                          color: _copied
                                              ? const Color(0xFF10B981)
                                              : const Color(0xFF6B7280),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 20),

                              // ── Activate eSIM button ─────────────
                              ElevatedButton.icon(
                                onPressed: () {
                                  // TODO: implement eSIM activation flow
                                },
                                icon: const Icon(Icons.download_rounded,
                                    size: 18),
                                label: const Text(
                                  'Activate eSIM',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFFACC15),
                                  foregroundColor: const Color(0xFF3B0764),
                                  minimumSize: const Size(double.infinity, 48),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 2,
                                ),
                              ),

                              const SizedBox(height: 10),

                              // ── Return Home button ───────────────
                              OutlinedButton(
                                onPressed: () => context.go(RouteNames.home),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF4B5563),
                                  backgroundColor: Colors.white,
                                  side: const BorderSide(
                                      color: Color(0xFFE5E7EB)),
                                  minimumSize: const Size(double.infinity, 48),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text('Return Home'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

class _BlurCircle extends StatelessWidget {
  const _BlurCircle({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }
}
