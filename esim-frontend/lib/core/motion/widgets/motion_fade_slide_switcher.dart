import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

class MotionFadeSlideSwitcher extends StatelessWidget {
  const MotionFadeSlideSwitcher({
    super.key,
    required this.child,
    this.slideOffset = 0.05,
  });

  final Widget child;
  final double slideOffset;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: AppMotion.switcher,
      transitionBuilder: (child, animation) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: AppMotion.primary,
        );

        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: Offset(slideOffset, 0),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}
