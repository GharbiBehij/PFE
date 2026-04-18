import 'package:intl/intl.dart';

class Esim {
  const Esim({
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
  final int dataTotal; // MB
  final int dataUsed; // MB
  final String status; // ACTIVE, EXPIRED, PENDING, DELETED
  final String? qrCode;
  final DateTime? activatedAt;
  final DateTime? expiresAt;
  final DateTime createdAt;

  int get dataRemaining => (dataTotal - dataUsed).clamp(0, dataTotal);
  double get usagePercentage =>
      dataTotal > 0 ? (dataUsed / dataTotal).clamp(0.0, 1.0) : 0;
  int get daysRemaining => expiresAt != null
      ? expiresAt!.difference(DateTime.now()).inDays.clamp(0, 999)
      : 0;
  bool get isActive => status == 'ACTIVE';
  bool get isExpired => status == 'NOT_ACTIVE';
  bool get canBeDeleted => !isActive || dataRemaining == 0;

  String get countryCode => country.toLowerCase();

  String get formattedDataUsed =>
      dataUsed >= 1024 ? '${(dataUsed / 1024).toStringAsFixed(1)} GB' : '$dataUsed MB';
  String get formattedDataRemaining =>
      dataRemaining >= 1024 ? '${(dataRemaining / 1024).toStringAsFixed(1)} GB' : '$dataRemaining MB';
  String get formattedDataTotal =>
      dataTotal >= 1024 ? '${(dataTotal / 1024).toStringAsFixed(0)} GB' : '$dataTotal MB';
  String get formattedExpiry =>
      expiresAt != null ? DateFormat('MMM d, yyyy').format(expiresAt!) : '-';
  String get formattedActivatedAt =>
      activatedAt != null ? DateFormat('MMM d, yyyy').format(activatedAt!) : '-';

}
