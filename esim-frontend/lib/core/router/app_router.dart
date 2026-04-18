import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/app_motion.dart';
import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/widgets/bottom_nav.dart';

// Auth
import 'package:esim_frontend/features/auth/presentation/screens/login_screen.dart';
import 'package:esim_frontend/features/auth/presentation/screens/register_screen.dart';

// Home
import 'package:esim_frontend/features/home/presentation/screens/home_screen.dart';

// Offers / destinations
import 'package:esim_frontend/features/offers/presentation/screens/destinations_screen.dart';
import 'package:esim_frontend/features/offers/presentation/screens/search_screen.dart';
import 'package:esim_frontend/features/offers/presentation/screens/package_listing_screen.dart';
import 'package:esim_frontend/features/offers/presentation/screens/package_detail_screen.dart';

// Payment
import 'package:esim_frontend/features/payment/models/purchase_result.dart';
import 'package:esim_frontend/features/payment/presentation/screens/payment_screen.dart';
import 'package:esim_frontend/features/payment/presentation/screens/success_screen.dart';

// eSIMs
import 'package:esim_frontend/features/esims/presentation/screens/my_esims_screen.dart';
import 'package:esim_frontend/features/esims/presentation/screens/esim_detail_screen.dart';

// Profile
import 'package:esim_frontend/features/profile/presentation/screens/profile_screen.dart';
import 'package:esim_frontend/features/profile/presentation/screens/personal_details_screen.dart';
import 'package:esim_frontend/features/profile/presentation/screens/payment_methods_screen.dart';
import 'package:esim_frontend/features/profile/presentation/screens/settings_screen.dart';
import 'package:esim_frontend/features/profile/presentation/screens/help_center_screen.dart';

// Wallet / finance
import 'package:esim_frontend/features/wallet/presentation/screens/wallet_screen.dart';
import 'package:esim_frontend/features/wallet/presentation/screens/topup_screen.dart';

CustomTransitionPage<T> _buildTransitionPage<T>({
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionDuration: AppMotion.slow,
    reverseTransitionDuration: AppMotion.normal,
    transitionsBuilder: (_, animation, secondaryAnimation, pageChild) {
      final slide = Tween<Offset>(
        begin: const Offset(0.08, 0),
        end: Offset.zero,
      ).chain(CurveTween(curve: AppMotion.easeOutCubic));

      return FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: animation.drive(slide),
          child: pageChild,
        ),
      );
    },
  );
}

final routerProvider = Provider<GoRouter>((ref) {
  final tokenStorage = ref.read(tokenStorageProvider);

  return GoRouter(
    initialLocation: RouteNames.home,
    debugLogDiagnostics: true,

    // ── Auth redirect ────────────────────────────────────────────────────────
    redirect: (context, state) async {
      final token = await tokenStorage.getAccessToken();
      final loc = state.matchedLocation;

      final isAuthRoute =
          loc == RouteNames.login ||
          loc == RouteNames.signup ||
          loc == RouteNames.register;

      if (token == null && !isAuthRoute) return RouteNames.login;
      if (token != null && isAuthRoute) return RouteNames.home;
      return null;
    },

    routes: [
      // ── Auth ──────────────────────────────────────────────────────────────
      GoRoute(
        path: RouteNames.login,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const LoginScreen()),
      ),
      GoRoute(
        path: RouteNames.signup,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const RegisterScreen()),
      ),
      GoRoute(
        path: RouteNames.register,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const RegisterScreen()),
      ),

      // ── Shell — bottom nav visible ─────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => ScaffoldWithBottomNav(child: child),
        routes: [
          GoRoute(
            path: RouteNames.home,
            pageBuilder: (_, state) =>
                _buildTransitionPage(state: state, child: const HomeScreen()),
          ),
          GoRoute(
            path: RouteNames.destinations,
            pageBuilder: (_, state) => _buildTransitionPage(
              state: state,
              child: const DestinationsScreen(),
            ),
          ),
          GoRoute(
            path: RouteNames.myEsims,
            pageBuilder: (_, state) => _buildTransitionPage(
              state: state,
              child: const MyEsimsScreen(),
            ),
            routes: [
              GoRoute(
                path: ':id',
                pageBuilder: (_, state) => _buildTransitionPage(
                  state: state,
                  child: EsimDetailScreen(esimId: state.pathParameters['id']!),
                ),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.profile,
            pageBuilder: (_, state) => _buildTransitionPage(
              state: state,
              child: const ProfileScreen(),
            ),
          ),
        ],
      ),

      // ── Offer flow — full screen, no bottom nav ────────────────────────────
      GoRoute(
        path: RouteNames.search,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const SearchScreen()),
      ),
      GoRoute(
        path: '/packages/:countryId',
        pageBuilder: (_, state) {
          final extra = state.extra is Map<String, dynamic>
              ? state.extra as Map<String, dynamic>
              : null;
          return _buildTransitionPage(
            state: state,
            child: PackageListingScreen(
              countryId: state.pathParameters['countryId']!,
              heroCountry: extra?['country'] as String?,
              heroImageUrl: extra?['imageUrl'] as String?,
            ),
          );
        },
      ),
      GoRoute(
        path: '/package/:packageId',
        pageBuilder: (_, state) => _buildTransitionPage(
          state: state,
          child: PackageDetailScreen(
            packageId: state.pathParameters['packageId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/payment/:packageId',
        pageBuilder: (_, state) => _buildTransitionPage(
          state: state,
          child: PaymentScreen(packageId: state.pathParameters['packageId']!),
        ),
      ),
      GoRoute(
        path: RouteNames.success,
        pageBuilder: (_, state) => _buildTransitionPage(
          state: state,
          child: SuccessScreen(result: state.extra as PurchaseResult?),
        ),
      ),

      // ── Profile sub-screens — full screen, no bottom nav ─────────────────
      GoRoute(
        path: RouteNames.profilePersonal,
        pageBuilder: (_, state) => _buildTransitionPage(
          state: state,
          child: const PersonalDetailsScreen(),
        ),
      ),
      GoRoute(
        path: RouteNames.profilePayment,
        pageBuilder: (_, state) => _buildTransitionPage(
          state: state,
          child: const PaymentMethodsScreen(),
        ),
      ),
      GoRoute(
        path: RouteNames.profileSettings,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const SettingsScreen()),
      ),
      GoRoute(
        path: RouteNames.profileHelp,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const HelpCenterScreen()),
      ),

      // ── Wallet / finance ──────────────────────────────────────────────────
      GoRoute(
        path: RouteNames.wallet,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const WalletScreen()),
      ),
      GoRoute(
        path: RouteNames.topup,
        pageBuilder: (_, state) =>
            _buildTransitionPage(state: state, child: const TopUpScreen()),
      ),
    ],
  );
});
