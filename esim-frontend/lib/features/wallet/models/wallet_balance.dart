class WalletBalance {
  const WalletBalance({required this.balance});

  final int balance;

  String get formatted => '${(balance / 1000).toStringAsFixed(3)} TND';
}
