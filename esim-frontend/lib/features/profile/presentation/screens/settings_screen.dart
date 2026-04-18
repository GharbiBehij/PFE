import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/features/profile/presentation/screens/profile_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;

  @override
  Widget build(BuildContext context) {
    final safeTop = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SettingsPage(
        safeTop: safeTop,
        notificationsEnabled: _notificationsEnabled,
        onBack: () => context.pop(),
        onNotificationsToggle: () {
          setState(() => _notificationsEnabled = !_notificationsEnabled);
        },
      ),
    );
  }
}
