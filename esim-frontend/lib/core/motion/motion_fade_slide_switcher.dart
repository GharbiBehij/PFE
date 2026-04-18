import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

class MotionFadeSlideSwitcher extends StatelessWidget {
  const MotionFadeSlideSwitcher({
    super.key,
    required this.valueKey,
    required this.child,
  });

  final Object valueKey;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: AppMotion.switcher,
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: CurvedAnimation(
          parent: animation,
          curve: AppMotion.primary,
        ),
        child: child,
      ),
      child: KeyedSubtree(key: ValueKey(valueKey), child: child),
    );
  }
}
