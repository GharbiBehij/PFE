import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';
import 'package:esim_frontend/features/esims/data/models/esim_model.dart';

@injectable
class EsimRemoteDataSource {
  const EsimRemoteDataSource(this._dio);

  final Dio _dio;

  Future<List<EsimModel>> getMyEsims() async {
    final data = await _fetchEsimGroups();
    final active = _parseList(data['active']);
    final expired = _parseList(data['expired']);

    if (active.isNotEmpty || expired.isNotEmpty) {
      return [...active, ...expired];
    }

    final esimsList = data['esims'];
    if (esimsList is List) {
      return _parseList(esimsList);
    }

    return const [];
  }

  Future<EsimModel> getEsimById(String id) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/esims/$id');
      final data = res.data ?? <String, dynamic>{};
      final payload = data['esim'];
      if (payload is Map<String, dynamic>) {
        return EsimModel.fromJson(payload);
      }
      return EsimModel.fromJson(data);
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<EsimModel> syncUsage(String id) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>('/esims/$id/sync-usage');
      final data = res.data ?? <String, dynamic>{};
      final payload = data['esim'];
      if (payload is Map<String, dynamic>) {
        return EsimModel.fromJson(payload);
      }
      return EsimModel.fromJson(data);
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<void> deleteEsim(String id) async {
    try {
      await _dio.delete<void>('/esims/$id');
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> _fetchEsimGroups() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/esims');
      return res.data ?? <String, dynamic>{};
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      if (code == 404 || code == 400) {
        try {
          final fallback = await _dio.get<Map<String, dynamic>>('/esims/my-esims');
          return fallback.data ?? <String, dynamic>{};
        } on DioException catch (fallbackError) {
          throw ErrorHandler.handle(fallbackError);
        }
      }
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  List<EsimModel> _parseList(dynamic raw) {
    if (raw is! List) return const [];
    return raw
        .whereType<Map<String, dynamic>>()
        .map(EsimModel.fromJson)
        .toList(growable: false);
  }
}
