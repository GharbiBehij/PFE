import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';

class ScaffoldWithBottomNav extends StatelessWidget {
  const ScaffoldWithBottomNav({required this.child, super.key});

  final Widget child;

  static const _tabs = [
    _TabItem(label: 'Home', icon: Icons.home_outlined, activeIcon: Icons.home, route: RouteNames.home),
    _TabItem(label: 'Mes eSIMs', icon: Icons.language_outlined, activeIcon: Icons.language, route: RouteNames.myEsims),
    _TabItem(label: 'Profile', icon: Icons.person_outline, activeIcon: Icons.person, route: RouteNames.profile),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].route)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          boxShadow: [
            BoxShadow(color: Color(0x14000000), blurRadius: 16, offset: Offset(0, -4)),
          ],
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          child: NavigationBar(
            selectedIndex: currentIndex,
            onDestinationSelected: (i) => context.go(_tabs[i].route),
            destinations: _tabs
                .map((t) => NavigationDestination(
                      icon: Icon(t.icon),
                      selectedIcon: Icon(t.activeIcon),
                      label: t.label,
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }
}

class _TabItem {
  const _TabItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.route,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String route;
}
