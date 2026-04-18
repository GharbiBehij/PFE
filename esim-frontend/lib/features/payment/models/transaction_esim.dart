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

  bool get isActive => status == 'ACTIVE';
  bool get isExpired => status == 'EXPIRED';
  int? get daysRemaining => expiresAt?.difference(DateTime.now()).inDays;
}
