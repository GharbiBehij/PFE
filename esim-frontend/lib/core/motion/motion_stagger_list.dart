import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

class MotionStaggerList extends StatelessWidget {
  const MotionStaggerList({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        children.length,
        (i) => _StaggerItem(
          delay: Duration(
            milliseconds:
                AppMotion.staggerLead.inMilliseconds +
                i * AppMotion.stagger.inMilliseconds,
          ),
          child: children[i],
        ),
      ),
    );
  }
}

class _StaggerItem extends StatefulWidget {
  const _StaggerItem({required this.child, required this.delay});

  final Widget child;
  final Duration delay;

  @override
  State<_StaggerItem> createState() => _StaggerItemState();
}

class _StaggerItemState extends State<_StaggerItem> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSlide(
      duration: AppMotion.normal,
      curve: AppMotion.primary,
      offset: _visible ? Offset.zero : Offset(0, AppMotion.listDriftFraction),
      child: AnimatedOpacity(
        duration: AppMotion.normal,
        curve: AppMotion.primary,
        opacity: _visible ? 1 : 0,
        child: widget.child,
      ),
    );
  }
}
