import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

class MotionPressable extends StatefulWidget {
  const MotionPressable({
    super.key,
    required this.child,
    required this.onTap,
    this.scale = 0.985,
    this.haptic = HapticFeedback.lightImpact,
  });

  final Widget child;
  final VoidCallback onTap;
  final double scale;
  final Future<void> Function() haptic;

  @override
  State<MotionPressable> createState() => _MotionPressableState();
}

class _MotionPressableState extends State<MotionPressable> {
  bool _pressed = false;

  void _handleTapDown(TapDownDetails _) => setState(() => _pressed = true);
  void _handleTapUp(TapUpDetails _) => setState(() => _pressed = false);
  void _handleTapCancel() => setState(() => _pressed = false);

  void _handleTap() {
    widget.haptic().then((_) => widget.onTap());
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: AnimatedScale(
        scale: _pressed ? widget.scale : 1.0,
        duration: AppMotion.interaction,
        curve: AppMotion.primary,
        child: widget.child,
      ),
    );
  }
}
