class TransactionEsim {
  const TransactionEsim({
    required this.id,
    required this.offerId,
    required this.qrCode,
    required this.status,
    required this.activatedAt,
    required this.expiresAt,
  });

  final int id;
  final int offerId;
  final String? qrCode;
  final String status; // PENDING, ACTIVE, EXPIRED
  final DateTime? activatedAt;
  final DateTime? expiresAt;

  factory TransactionEsim.fromJson(Map<String, dynamic> json) {
    return TransactionEsim(
      id: (json['id'] as num).toInt(),
      offerId: (json['offerId'] as num?)?.toInt() ?? 0,
      qrCode: json['qrCode'] as String?,
      status: (json['status'] ?? '').toString(),
      activatedAt: DateTime.tryParse((json['activatedAt'] ?? '').toString()),
      expiresAt: DateTime.tryParse((json['expiresAt'] ?? '').toString()),
    );
  }

  bool get isActive => status == 'ACTIVE';
  bool get isExpired => status == 'EXPIRED';
  int? get daysRemaining => expiresAt != null ? expiresAt!.difference(DateTime.now()).inDays : null;
}
