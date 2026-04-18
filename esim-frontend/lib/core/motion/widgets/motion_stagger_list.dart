import 'package:flutter/material.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';

class MotionStaggerList extends StatefulWidget {
  const MotionStaggerList({
    super.key,
    required this.children,
    this.itemDelay,
    this.leadDelay,
  });

  final List<Widget> children;
  final Duration? itemDelay;
  final Duration? leadDelay;

  @override
  State<MotionStaggerList> createState() => _MotionStaggerListState();
}

class _MotionStaggerListState extends State<MotionStaggerList>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  Duration get _itemDelay => widget.itemDelay ?? AppMotion.stagger;
  Duration get _leadDelay => widget.leadDelay ?? AppMotion.staggerLead;

  Duration get _totalDuration =>
      _leadDelay +
      Duration(
        milliseconds:
            widget.children.length * _itemDelay.inMilliseconds +
            AppMotion.normal.inMilliseconds,
      );

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: _totalDuration,
    )..forward();
  }

  @override
  void didUpdateWidget(MotionStaggerList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.children.length != widget.children.length) {
      _controller.duration = _totalDuration;
      _controller
        ..reset()
        ..forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final total = _totalDuration.inMilliseconds.toDouble();
    final lead = _leadDelay.inMilliseconds.toDouble();
    final item = _itemDelay.inMilliseconds.toDouble();
    final fadeDur = AppMotion.normal.inMilliseconds.toDouble();

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(widget.children.length, (i) {
            final start = (lead + i * item) / total;
            final end = ((lead + i * item + fadeDur) / total).clamp(0.0, 1.0);

            final interval = CurvedAnimation(
              parent: _controller,
              curve: Interval(start, end, curve: AppMotion.primary),
            );

            return FadeTransition(
              opacity: interval,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: Offset(0, AppMotion.listDriftFraction),
                  end: Offset.zero,
                ).animate(interval),
                child: widget.children[i],
              ),
            );
          }),
        );
      },
    );
  }
}
