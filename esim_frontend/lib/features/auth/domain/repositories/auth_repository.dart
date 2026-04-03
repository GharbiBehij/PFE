import 'package:esim_frontend/features/auth/domain/entities/user_entity.dart';

/// Abstract contract — the data layer implements this; the presentation layer
/// depends only on this interface (Dependency Inversion Principle).
abstract interface class AuthRepository {
  /// Authenticates and persists tokens via [TokenStorage].
  Future<UserEntity> login({required String email, required String password});

  /// Creates account, then authenticates.
  Future<UserEntity> register({
    required String email,
    required String password,
    required String name,
  });

  /// Clears stored tokens.
  Future<void> logout();

  /// Reads stored access token → fetches /auth/me.
  /// Throws [UnauthenticatedException] when no valid token exists.
  Future<UserEntity> getCurrentUser();

  /// Called by [RefreshInterceptor] on 401.
  Future<String> refreshToken();
}
