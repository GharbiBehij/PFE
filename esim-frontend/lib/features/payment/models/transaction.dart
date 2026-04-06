import 'package:esim_frontend/features/payment/models/transaction_esim.dart';

class Transaction {
  const Transaction({
    required this.id,
    required this.userId,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
    required this.updatedAt,
    required this.esims,
  });

  final int id;
  final int userId;
  final String status; // PENDING, COMPLETED, FAILED
  final int totalAmount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<TransactionEsim>? esims;

  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(
        id: json['id'] as int,
        userId: (json['userId'] as int?) ?? 0,
        status: json['status'] as String,
        totalAmount: (json['totalAmount'] as num?)?.toInt() ??
            (json['amount'] as num?)?.toInt() ??
            0,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.tryParse((json['updatedAt'] ?? '').toString()) ??
            DateTime.parse(json['createdAt'] as String),
        esims: (json['esims'] as List<dynamic>?)
            ?.cast<Map<String, dynamic>>()
            .map(TransactionEsim.fromJson)
            .toList(),
      );

  String get formattedAmount => '${(totalAmount / 100).toStringAsFixed(2)}€';
  bool get isPending => status == 'PENDING';
  bool get isCompleted => status == 'COMPLETED';
  bool get isFailed => status == 'FAILED';
}
