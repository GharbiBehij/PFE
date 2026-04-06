import 'package:esim_frontend/features/auth/models/user.dart';

class AuthResponse {
  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final User user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        accessToken: json['access_token'] as String,
        refreshToken: json['refresh_token'] as String,
        user: User.fromJson(json['user'] as Map<String, dynamic>),
      );
}
