import 'package:dio/dio.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';

class TransactionDatasource {
  const TransactionDatasource(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> getUserTransactions() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/transactions');
      final list = (res.data?['transactions'] as List<dynamic>? ?? <dynamic>[])
          .cast<Map<String, dynamic>>();
      return list;
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getTransactionDetail(int id) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/transactions/$id');
      return res.data ?? <String, dynamic>{};
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }
}
