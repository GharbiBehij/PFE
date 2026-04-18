import 'package:esim_frontend/features/auth/models/user.dart';

class UserDto {
  const UserDto({
    required this.id,
    required this.email,
    required this.firstname,
    required this.lastname,
    required this.role,
    required this.balance,
  });

  final int id;
  final String email;
  final String firstname;
  final String lastname;
  final String role;
  final int balance;

  factory UserDto.fromJson(Map<String, dynamic> json) => UserDto(
        id: json['id'] as int,
        email: json['email'] as String,
        firstname: (json['firstname'] as String?) ?? '',
        lastname: (json['lastname'] as String?) ?? '',
        role: json['role'] as String,
        balance: (json['balance'] as num?)?.toInt() ?? 0,
      );

  User toDomain() => User(
        id: id,
        email: email,
        name: '$firstname $lastname'.trim(),
        role: role,
        balance: balance,
      );
}
