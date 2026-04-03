import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/features/auth/domain/entities/user_entity.dart';
import 'package:esim_frontend/features/auth/domain/repositories/auth_repository.dart';
import 'package:esim_frontend/features/auth/presentation/states/auth_state.dart';

// Provides the repository — wired in core_providers.dart via ProviderScope overrides.
// Declared here as a simple Provider so auth_provider stays self-contained.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  throw UnimplementedError('Override authRepositoryProvider in ProviderScope');
});

part 'auth_provider.g.dart';

/// [AsyncNotifier] — build() re-hydrates the session on cold start.
/// State type is [AsyncValue<AuthState>] (provided by Riverpod automatically).
@riverpod
class AuthNotifier extends _$AuthNotifier {
  AuthRepository get _repo => ref.read(authRepositoryProvider);

  /// Called automatically when the provider is first read.
  /// Returns [AuthAuthenticated] if a valid token exists, else [AuthUnauthenticated].
  @override
  Future<AuthState> build() async {
    try {
      final user = await _repo.getCurrentUser();
      return AuthAuthenticated(user);
    } on UnauthenticatedException {
      return const AuthUnauthenticated();
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _repo.login(email: email, password: password);
      return AuthAuthenticated(user);
    });
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _repo.register(
        email: email,
        password: password,
        name: name,
      );
      return AuthAuthenticated(user);
    });
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncData(AuthUnauthenticated());
  }

  /// Convenience getter — null-safe access to the current user.
  UserEntity? get currentUser {
    final s = state.valueOrNull;
    return s is AuthAuthenticated ? s.user : null;
  }
}
