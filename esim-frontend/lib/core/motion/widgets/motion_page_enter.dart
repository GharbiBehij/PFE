import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

class MotionPageEnter extends StatefulWidget {
  const MotionPageEnter({super.key, required this.child});

  final Widget child;

  @override
  State<MotionPageEnter> createState() => _MotionPageEnterState();
}

class _MotionPageEnterState extends State<MotionPageEnter> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      duration: AppMotion.page,
      curve: AppMotion.primary,
      opacity: _visible ? 1 : 0,
      child: TweenAnimationBuilder<double>(
        duration: AppMotion.page,
        curve: AppMotion.primary,
        tween: Tween<double>(
          begin: AppMotion.pageDriftPx,
          end: _visible ? 0 : AppMotion.pageDriftPx,
        ),
        builder: (context, driftY, child) =>
            Transform.translate(offset: Offset(0, driftY), child: child),
        child: widget.child,
      ),
    );
  }
}
