class PurchaseResult {
  const PurchaseResult({
    required this.transactionId,
    required this.status,
    required this.message,
    this.error,
  });

  final int transactionId;
  final String status;
  final String message;
  final String? error;

}
