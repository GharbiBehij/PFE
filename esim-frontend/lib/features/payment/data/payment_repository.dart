import 'package:esim_frontend/features/payment/data/payment_datasource.dart';
import 'package:esim_frontend/features/payment/models/purchase_result.dart';

class PaymentRepository {
  const PaymentRepository(this._datasource);

  final PaymentDatasource _datasource;

  Future<PurchaseResult> purchaseOffer({
    required int offerId,
    required String paymentMethod,
  }) async {
    final raw = await _datasource.purchaseOffer(
      offerId: offerId,
      paymentMethod: paymentMethod,
    );
    return PurchaseResult.fromJson(raw);
  }
}
