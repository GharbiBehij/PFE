import 'package:dio/dio.dart';
import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';
import 'package:esim_frontend/features/auth/models/auth_response.dart';
import 'package:esim_frontend/features/auth/models/user.dart';

class AuthDatasource {
  const AuthDatasource(this._dio);

  final Dio _dio;

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return AuthResponse.fromJson(res.data!);
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<AuthResponse> signup({
    required String email,
    required String password,
    required String firstname,
    required String lastname,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/signup',
        data: {'email': email, 'password': password, 'firstname': firstname, 'lastname': lastname},
      );
      return AuthResponse.fromJson(res.data!);
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<User> getMe() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/auth/me');
      return User.fromJson(res.data!);
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post<void>('/auth/logout');
    } catch (_) {}
  }
}
