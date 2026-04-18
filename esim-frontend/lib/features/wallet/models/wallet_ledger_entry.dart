class WalletLedgerEntry {
  const WalletLedgerEntry({
    required this.id,
    required this.amount,
    required this.status,
    this.description,
    this.transactionId,
    required this.createdAt,
  });

  final int id;
  final int amount;
  final String status; // RESERVED, COMMITTED, RELEASED
  final String? description;
  final int? transactionId;
  final DateTime createdAt;

  // Keep backward-compatible getter
  String get type => status;

  String get formattedAmount =>
      amount >= 0 ? '+${(amount / 1000).toStringAsFixed(3)} TND' : '${(amount / 1000).toStringAsFixed(3)} TND';

  bool get isCredit => status == 'RELEASED';
  bool get isDebit => status == 'RESERVED' || status == 'COMMITTED';
}
