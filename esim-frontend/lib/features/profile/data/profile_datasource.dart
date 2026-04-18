import 'package:dio/dio.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';

class ProfileDatasource {
  const ProfileDatasource(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> getProfile() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/user/profile');
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/user/profile',
        data: data,
      );
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<void> changePassword(Map<String, dynamic> data) async {
    try {
      await _dio.post<void>('/user/change-password', data: data);
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }
}
