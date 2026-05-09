class PurchaseResult {
  const PurchaseResult({
    required this.transactionId,
    required this.status,
    required this.message,
    this.error,
    this.paymentUrl,
    this.clientSecret,
    this.type,
  });

  final int transactionId;
  final String status;
  final String message;
  final String? error;
  final String? paymentUrl;
  final String? clientSecret;
  final String? type;

}
