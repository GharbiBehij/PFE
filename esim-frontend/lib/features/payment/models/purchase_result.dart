import 'package:esim_frontend/features/payment/models/transaction.dart';

class PurchaseResult {
  const PurchaseResult({
    required this.transaction,
    required this.esim,
  });

  final Transaction transaction;
  final PurchasedEsim esim;

  factory PurchaseResult.fromJson(Map<String, dynamic> json) => PurchaseResult(
        transaction: Transaction.fromJson(
            json['transaction'] as Map<String, dynamic>),
        esim: PurchasedEsim.fromJson(json['esim'] as Map<String, dynamic>),
      );
}

class PurchasedEsim {
  const PurchasedEsim({
    required this.id,
    this.qrCode,
    required this.status,
  });

  final int id;
  final String? qrCode;
  final String status;

  factory PurchasedEsim.fromJson(Map<String, dynamic> json) => PurchasedEsim(
        id: json['id'] as int,
        qrCode: json['qrCode'] as String?,
        status: json['status'] as String,
      );
}
