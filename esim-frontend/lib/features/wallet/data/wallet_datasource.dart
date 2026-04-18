import 'package:dio/dio.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';

class WalletDatasource {
  const WalletDatasource(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> getBalance() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/walletTransaction/balance');
      return res.data ?? <String, dynamic>{};
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getHistory() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/walletTransaction/history');
      final entries = (res.data?['data'] as List<dynamic>? ?? <dynamic>[])
          .cast<Map<String, dynamic>>();
      return entries;
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> topUp(int amount) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/walletTransaction/topup/request',
        data: {'amount': amount},
      );
      return res.data ?? <String, dynamic>{};
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }
}
