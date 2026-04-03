import 'package:esim_frontend/features/auth/domain/entities/user_entity.dart';

/// Sealed union of all possible auth states.
/// No Freezed needed — sealed classes are native in Dart 3.
sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final UserEntity user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}
