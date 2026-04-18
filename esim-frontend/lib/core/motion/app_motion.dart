import 'package:flutter/animation.dart';

import 'package:esim_frontend/core/motion/motion_presets.dart';

class AppMotion {
  const AppMotion._();

  static const fast = Motion.fast;
  static const normal = Motion.normal;
  static const slow = Motion.slow;

  // Curve aliases kept for non-home contexts that reference them directly.
  static const easeOutCubic = Curves.easeOutCubic;
  static const easeInCubic = Curves.easeInCubic;
  static const easeOut = Curves.easeOut;
  static const elasticOut = Curves.elasticOut;

  // Single primary easing — use this everywhere in new code.
  static const primary = easeOutCubic;

  // Semantic duration aliases.
  static const page = slow;
  static const element = normal;
  static const interaction = fast;
  static const switcher = normal;

  // Spatial tokens.
  static const double pageDriftPx = 10;
  static const double listDriftFraction = 0.03;
  static const easeInOut= Curves.easeInOut;

  // Stagger tokens.
  static const stagger = Duration(milliseconds: 50);
  static const staggerLead = Duration(milliseconds: 40);
}
