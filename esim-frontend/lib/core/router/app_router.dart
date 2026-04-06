import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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

// Profile
import 'package:esim_frontend/features/profile/presentation/screens/profile_screen.dart';

// Wallet / finance
import 'package:esim_frontend/features/wallet/presentation/screens/wallet_screen.dart';
import 'package:esim_frontend/features/wallet/presentation/screens/topup_screen.dart';
// import 'package:esim_frontend/features/topup/presentation/screens/admin_topup_screen.dart';

// Usage (placeholder)
// import 'package:esim_frontend/features/usage/presentation/screens/usage_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final tokenStorage = ref.read(tokenStorageProvider);

  return GoRouter(
    initialLocation: RouteNames.home,
    debugLogDiagnostics: true,

    // ── Auth redirect ────────────────────────────────────────────────────────
    redirect: (context, state) async {
      final token = await tokenStorage.getAccessToken();
      final loc = state.matchedLocation;

      final isAuthRoute = loc == RouteNames.login ||
          loc == RouteNames.signup ||
          loc == RouteNames.register;

      if (token == null && !isAuthRoute) return RouteNames.login;
      if (token != null && isAuthRoute) return RouteNames.home;
      return null;
    },

    routes: [
      // ── Auth ──────────────────────────────────────────────────────────────
      GoRoute(path: RouteNames.login, builder: (_, __) => const LoginScreen()),
      GoRoute(path: RouteNames.signup, builder: (_, __) => const RegisterScreen()),
      GoRoute(path: RouteNames.register, builder: (_, __) => const RegisterScreen()),

      // ── Shell — bottom nav visible ─────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => ScaffoldWithBottomNav(child: child),
        routes: [
          GoRoute(path: RouteNames.home, builder: (_, __) => const HomeScreen()),
          GoRoute(path: RouteNames.destinations, builder: (_, __) => const DestinationsScreen()),
          GoRoute(path: RouteNames.myEsims, builder: (_, __) => const MyEsimsScreen()),
          GoRoute(path: RouteNames.profile, builder: (_, __) => const ProfileScreen()),
        ],
      ),

      // ── Offer flow — full screen, no bottom nav ────────────────────────────
      GoRoute(path: RouteNames.search, builder: (_, __) => const SearchScreen()),
      GoRoute(
        path: '/packages/:countryId',
        builder: (_, state) =>
            PackageListingScreen(countryId: state.pathParameters['countryId']!),
      ),
      GoRoute(
        path: '/package/:packageId',
        builder: (_, state) =>
            PackageDetailScreen(packageId: state.pathParameters['packageId']!),
      ),
      GoRoute(
        path: '/payment/:packageId',
        builder: (_, state) =>
            PaymentScreen(packageId: state.pathParameters['packageId']!),
      ),
      GoRoute(
        path: RouteNames.success,
        builder: (_, state) => SuccessScreen(
          result: state.extra as PurchaseResult?,
        ),
      ),

      // ── Wallet / finance ──────────────────────────────────────────────────
      GoRoute(path: RouteNames.wallet, builder: (_, __) => const WalletScreen()),
      GoRoute(path: RouteNames.topup, builder: (_, __) => const TopUpScreen()),
      // GoRoute(path: RouteNames.adminTopup, builder: (_, __) => const AdminTopupScreen()),

      // ── Usage — uncomment when screen is built ────────────────────────────
      // GoRoute(path: RouteNames.usage, builder: (_, __) => const UsageScreen()),
    ],
  );
});
