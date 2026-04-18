import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

String _normalizeHeroKey(String value) {
  final decoded = Uri.decodeComponent(value);
  return decoded.trim().toLowerCase().replaceAll(RegExp(r'\\s+'), '-');
}

String destinationImageHeroTag(String country) =>
    'destination-image-${_normalizeHeroKey(country)}';

String packageCardHeroTag(int packageId) => 'package-card-$packageId';

Widget _heroShuttle(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection direction,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  final curved = CurvedAnimation(
    parent: animation,
    curve: AppMotion.easeOutCubic,
    reverseCurve: AppMotion.easeInCubic,
  );

  final targetHero =
      (direction == HeroFlightDirection.push
              ? toHeroContext.widget
              : fromHeroContext.widget)
          as Hero;

  return FadeTransition(
    opacity: Tween<double>(begin: 0.9, end: 1.0).animate(curved),
    child: ScaleTransition(
      scale: Tween<double>(begin: 0.985, end: 1.0).animate(curved),
      child: targetHero.child,
    ),
  );
}

Hero destinationImageHero({required String country, required Widget child}) {
  return Hero(
    tag: destinationImageHeroTag(country),
    transitionOnUserGestures: true,
    createRectTween: (begin, end) =>
        MaterialRectCenterArcTween(begin: begin, end: end),
    flightShuttleBuilder: _heroShuttle,
    child: child,
  );
}

Hero packageCardHero({required int packageId, required Widget child}) {
  return Hero(
    tag: packageCardHeroTag(packageId),
    transitionOnUserGestures: true,
    createRectTween: (begin, end) =>
        MaterialRectCenterArcTween(begin: begin, end: end),
    flightShuttleBuilder: _heroShuttle,
    child: child,
  );
}
