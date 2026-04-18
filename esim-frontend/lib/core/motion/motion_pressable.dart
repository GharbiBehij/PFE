import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
abstract class MotionPressable extends StatefulWidget {
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
}