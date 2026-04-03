import 'package:dio/dio.dart';
import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';

/// Raw HTTP calls — returns plain Maps; no entity mapping here.
class AuthRemoteDatasource {
  const AuthRemoteDatasource(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.fromDioException(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {'email': email, 'password': password, 'name': name},
      );
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.fromDioException(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/auth/me');
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.fromDioException(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.fromDioException(e);
    } on AppException {
      rethrow;
    }
  }
}
