import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/features/profile/presentation/providers/profile_providers.dart';
import 'package:esim_frontend/features/profile/presentation/screens/profile_screen.dart';

class PaymentMethodsScreen extends ConsumerWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final safeTop = MediaQuery.of(context).padding.top;
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (profile) => PaymentPage(
          safeTop: safeTop,
          cardholderName: profile.name,
          onBack: () => context.pop(),
        ),
      ),
    );
  }
}
