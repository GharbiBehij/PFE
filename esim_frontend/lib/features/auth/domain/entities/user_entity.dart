/// Pure domain object — no Dio, no JSON, no Flutter dependency.
class UserEntity {
  const UserEntity({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.balance,
  });

  final String id;
  final String email;
  final String name;
  final String role; // 'CLIENT' | 'SALESMAN' | 'ADMIN'
  final double balance;
}
