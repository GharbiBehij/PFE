import 'package:dio/dio.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';

class PaymentDatasource {
  const PaymentDatasource(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> purchaseOffer({
    required int offerId,
    required String paymentMethod,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/transactions/purchase',
        data: {
          'offerId': offerId,
          'paymentMethod': paymentMethod,
        },
      );
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }
}
