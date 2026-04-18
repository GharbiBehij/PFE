import 'package:esim_frontend/features/payment/models/purchase_result.dart';

class PurchaseResultDto {
  const PurchaseResultDto({
    required this.transactionId,
    required this.status,
    required this.message,
    this.error,
  });

  final int transactionId;
  final String status;
  final String message;
  final String? error;

  factory PurchaseResultDto.fromJson(Map<String, dynamic> json) =>
      PurchaseResultDto(
        transactionId: (json['transactionId'] as num).toInt(),
        status: (json['status'] ?? 'PENDING').toString(),
        message: (json['message'] ?? 'SUCCESS').toString(),
        error: json['error']?.toString(),
      );

  PurchaseResult toDomain() => PurchaseResult(
        transactionId: transactionId,
        status: status,
        message: message,
        error: error,
      );
}
