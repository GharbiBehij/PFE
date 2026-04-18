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
  final String status; // PENDING, PROCESSING, SUCCEEDED, FAILED
  final int totalAmount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<TransactionEsim>? esims;

  String get formattedAmount => '${(totalAmount / 1000).toStringAsFixed(3)} TND';
  bool get isPending => status == 'PENDING';
  bool get isCompleted => status == 'SUCCEEDED';
  bool get isFailed => status == 'FAILED';
}
