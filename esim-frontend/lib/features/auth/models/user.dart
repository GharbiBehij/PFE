class User {
  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.balance,
  });

  final int id;
  final String email;
  final String name;
  final String role; // 'CLIENT' | 'SALESMAN' | 'CUSTOMER' | 'ADMIN'
  final int balance; 

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        email: json['email'] as String,
        name: '${json['firstname']} ${json['lastname']}',
        role: json['role'] as String,
        balance: (json['balance'] as num?)?.toInt() ?? 0,
      );

  String get formattedBalance => '${(balance / 100).toStringAsFixed(2)}TND';

  bool get isAdmin => role == 'ADMIN';
  bool get isSalesman => role == 'SALESMAN';
  bool get isReseller => role == 'SALESMAN';
  bool get isB2CClient => role == 'CLIENT' || role == 'CUSTOMER';
}
