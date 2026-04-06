class WalletLedgerEntry {
  const WalletLedgerEntry({
    required this.id,
    required this.amount,
    required this.type,
    required this.description,
    required this.transactionId,
    required this.createdAt,
  });

  final int id;
  final int amount;
  final String type; // RESERVED, COMMITTED, RELEASED, TOPUP
  final String? description;
  final int? transactionId;
  final DateTime createdAt;

  factory WalletLedgerEntry.fromJson(Map<String, dynamic> json) {
    return WalletLedgerEntry(
      id: (json['id'] as num).toInt(),
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      type: (json['type'] ?? '').toString(),
      description: json['description'] as String?,
      transactionId: (json['transactionId'] as num?)?.toInt(),
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()) ?? DateTime.now(),
    );
  }

  String get formattedAmount =>
      amount >= 0 ? '+${(amount / 100).toStringAsFixed(2)} TND' : '${(amount / 100).toStringAsFixed(2)} TND';

  bool get isCredit => type == 'TOPUP' || type == 'RELEASED';
  bool get isDebit => type == 'RESERVED' || type == 'COMMITTED';
}
