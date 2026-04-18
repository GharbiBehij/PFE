import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

CustomTransitionPage<T> motionFadePage<T>({
  required Widget child,
  LocalKey? key,
}) {
  return CustomTransitionPage<T>(
    key: key,
    child: child,
    transitionDuration: AppMotion.page,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: AppMotion.primary,
      );
      return FadeTransition(opacity: curved, child: child);
    },
  );
}

CustomTransitionPage<T> motionSlideUpPage<T>({
  required Widget child,
  LocalKey? key,
}) {
  return CustomTransitionPage<T>(
    key: key,
    child: child,
    transitionDuration: AppMotion.page,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: AppMotion.primary,
      );
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 1),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      );
    },
  );
}

CustomTransitionPage<T> motionSlideRightPage<T>({
  required Widget child,
  LocalKey? key,
}) {
  return CustomTransitionPage<T>(
    key: key,
    child: child,
    transitionDuration: AppMotion.page,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: AppMotion.primary,
      );
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(1, 0),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      );
    },
  );
}
