import 'package:esim_frontend/features/payment/models/transaction_esim.dart';

class TransactionEsimDto {
  const TransactionEsimDto({
    required this.id,
    required this.offerId,
    this.qrCode,
    required this.status,
    this.activatedAt,
    this.expiresAt,
  });

  final int id;
  final int offerId;
  final String? qrCode;
  final String status;
  final DateTime? activatedAt;
  final DateTime? expiresAt;

  factory TransactionEsimDto.fromJson(Map<String, dynamic> json) =>
      TransactionEsimDto(
        id: (json['id'] as num).toInt(),
        offerId: (json['offerId'] as num?)?.toInt() ?? 0,
        qrCode: json['qrCode'] as String?,
        status: (json['status'] ?? '').toString(),
        activatedAt: DateTime.tryParse((json['activatedAt'] ?? '').toString()),
        expiresAt: DateTime.tryParse((json['expiresAt'] ?? '').toString()),
      );

  TransactionEsim toDomain() => TransactionEsim(
        id: id,
        offerId: offerId,
        qrCode: qrCode,
        status: status,
        activatedAt: activatedAt,
        expiresAt: expiresAt,
      );
}
