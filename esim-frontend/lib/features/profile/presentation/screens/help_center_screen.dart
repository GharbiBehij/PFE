import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/features/profile/presentation/screens/profile_screen.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final safeTop = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: HelpPage(safeTop: safeTop, onBack: () => context.pop()),
    );
  }
}
