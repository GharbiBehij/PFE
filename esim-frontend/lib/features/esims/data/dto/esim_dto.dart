import 'package:esim_frontend/features/esims/models/esim.dart';

class EsimDto {
  const EsimDto({
    required this.id,
    required this.country,
    this.region,
    required this.dataTotal,
    required this.dataUsed,
    required this.status,
    this.qrCode,
    this.activatedAt,
    this.expiresAt,
    required this.createdAt,
  });

  final int id;
  final String country;
  final String? region;
  final int dataTotal;
  final int dataUsed;
  final String status;
  final String? qrCode;
  final DateTime? activatedAt;
  final DateTime? expiresAt;
  final DateTime createdAt;

  factory EsimDto.fromJson(Map<String, dynamic> json) => EsimDto(
        id: json['id'] as int,
        country: json['country'] as String,
        region: json['region'] as String?,
        dataTotal: json['dataTotal'] as int,
        dataUsed: json['dataUsed'] as int,
        status: json['status'] as String,
        qrCode: json['qrCode'] as String?,
        activatedAt: json['activatedAt'] != null
            ? DateTime.parse(json['activatedAt'] as String)
            : null,
        expiresAt: json['expiresAt'] != null
            ? DateTime.parse(json['expiresAt'] as String)
            : null,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  Esim toDomain() => Esim(
        id: id,
        country: country,
        region: region,
        dataTotal: dataTotal,
        dataUsed: dataUsed,
        status: status,
        qrCode: qrCode,
        activatedAt: activatedAt,
        expiresAt: expiresAt,
        createdAt: createdAt,
      );
}
