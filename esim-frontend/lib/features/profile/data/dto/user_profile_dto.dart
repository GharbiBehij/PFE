import 'package:esim_frontend/features/profile/models/user_profile.dart';

class UserProfileDto {
  const UserProfileDto({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.balance,
    required this.createdAt,
  });

  final int id;
  final String name;
  final String email;
  final String? phone;
  final int balance;
  final DateTime createdAt;

  factory UserProfileDto.fromJson(Map<String, dynamic> json) {
    final firstname = (json['firstname'] as String?)?.trim() ?? '';
    final lastname = (json['lastname'] as String?)?.trim() ?? '';
    final combinedName = '$firstname $lastname'.trim();
    final fallbackName = (json['name'] as String?)?.trim() ?? '';

    return UserProfileDto(
      id: (json['id'] as num).toInt(),
      name: combinedName.isNotEmpty ? combinedName : fallbackName,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      balance: (json['balance'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  UserProfile toDomain() => UserProfile(
    id: id,
    name: name,
    email: email,
    phone: phone,
    balance: balance,
    createdAt: createdAt,
  );
}
