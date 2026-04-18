import 'package:esim_frontend/features/auth/data/dto/user_dto.dart';

class AuthResponseDto {
  const AuthResponseDto({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final UserDto user;

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) => AuthResponseDto(
        accessToken: json['access_token'] as String,
        refreshToken: json['refresh_token'] as String,
        user: UserDto.fromJson(json['user'] as Map<String, dynamic>),
      );
}
