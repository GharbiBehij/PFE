import 'package:esim_frontend/features/payment/data/dto/transaction_esim_dto.dart';
import 'package:esim_frontend/features/payment/models/transaction.dart';

class TransactionDto {
  const TransactionDto({
    required this.id,
    required this.userId,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
    required this.updatedAt,
    this.esims,
  });

  final int id;
  final int userId;
  final String status;
  final int totalAmount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<TransactionEsimDto>? esims;

  factory TransactionDto.fromJson(Map<String, dynamic> json) => TransactionDto(
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
            .map(TransactionEsimDto.fromJson)
            .toList(),
      );

  Transaction toDomain() => Transaction(
        id: id,
        userId: userId,
        status: status,
        totalAmount: totalAmount,
        createdAt: createdAt,
        updatedAt: updatedAt,
        esims: esims?.map((e) => e.toDomain()).toList(),
      );
}
