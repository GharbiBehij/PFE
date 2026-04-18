import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/features/auth/data/auth_datasource.dart';
import 'package:esim_frontend/features/auth/data/auth_repository.dart';
import 'package:esim_frontend/features/auth/models/user.dart';
import 'package:esim_frontend/features/profile/presentation/providers/profile_providers.dart';

// ── Repository provider ────────────────────────────────────────────────────

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    AuthDatasource(ref.read(dioProvider)),
    ref.read(tokenStorageProvider),
  );
});

// ── State ──────────────────────────────────────────────────────────────────

sealed class AuthState {}
class AuthInitial extends AuthState {}
class AuthAuthenticated extends AuthState {
  AuthAuthenticated(this.user);
  final User user;
}
class AuthUnauthenticated extends AuthState {}

// ── Notifier ───────────────────────────────────────────────────────────────

class AuthNotifier extends AsyncNotifier<AuthState> {
  AuthRepository get _repo => ref.read(authRepositoryProvider);

  /// Re-hydrates session on cold start.
  @override
  Future<AuthState> build() async {
    try {
      final user = await _repo.getMe();
      return AuthAuthenticated(user);
    } on UnauthenticatedException {
      return AuthUnauthenticated();
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _repo.login(email: email, password: password);
      return AuthAuthenticated(user);
    });
  }

  Future<void> signup({
    required String email,
    required String password,
    required String firstname,
    required String lastname, 
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _repo.signup(
        email: email,
        password: password,
        firstname: firstname,
        lastname: lastname,
      );
      return AuthAuthenticated(user);
    });
  }

  Future<void> logout() async {
    await _repo.logout();
    ref.invalidate(userProfileProvider);
    state = AsyncData(AuthUnauthenticated());
  }

  User? get currentUser {
    final s = state.valueOrNull;
    return s is AuthAuthenticated ? s.user : null;
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
