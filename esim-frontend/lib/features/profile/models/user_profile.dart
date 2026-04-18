class UserProfile {
  const UserProfile({
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

  /// First letter of each word in the name, e.g. "Jean Dupont" → "JD"
  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    return parts.map((w) => w[0].toUpperCase()).take(2).join();
  }
}
