import 'package:esim_frontend/features/wallet/models/wallet_ledger_entry.dart';

class WalletLedgerEntryDto {
  const WalletLedgerEntryDto({
    required this.id,
    required this.amount,
    required this.status,
    this.description,
    this.transactionId,
    required this.createdAt,
  });

  final int id;
  final int amount;
  final String status;
  final String? description;
  final int? transactionId;
  final DateTime createdAt;

  factory WalletLedgerEntryDto.fromJson(Map<String, dynamic> json) =>
      WalletLedgerEntryDto(
        id: (json['id'] as num).toInt(),
        amount: (json['amount'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? '').toString(),
        description: json['description'] as String?,
        transactionId: (json['transactionId'] as num?)?.toInt(),
        createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()) ??
            DateTime.now(),
      );

  WalletLedgerEntry toDomain() => WalletLedgerEntry(
        id: id,
        amount: amount,
        status: status,
        description: description,
        transactionId: transactionId,
        createdAt: createdAt,
      );
}
