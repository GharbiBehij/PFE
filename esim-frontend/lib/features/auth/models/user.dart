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

  String get formattedBalance => '${(balance / 1000).toStringAsFixed(3)} TND';

  bool get isAdmin => role == 'ADMIN';
  bool get isSalesman => role == 'SALESMAN';
  bool get isReseller => role == 'SALESMAN';
  bool get isB2CClient => role == 'CLIENT' || role == 'CUSTOMER';
}
