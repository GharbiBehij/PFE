class WalletBalance {
  const WalletBalance({required this.balance});

  final int balance;

  factory WalletBalance.fromJson(Map<String, dynamic> json) {
    return WalletBalance(
      balance: (json['balance'] as num?)?.toInt() ?? 0,
    );
  }

  String get formatted => '${(balance / 100).toStringAsFixed(2)} TND';
}
