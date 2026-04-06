import 'package:dio/dio.dart';
import 'package:esim_frontend/core/constants/api_constants.dart';
import 'package:esim_frontend/core/network/auth_interceptor.dart';
import 'package:esim_frontend/core/network/logging_interceptor.dart';
import 'package:esim_frontend/core/network/refresh_interceptor.dart';

Dio buildDioClient({
  required AuthInterceptor authInterceptor,
  required RefreshInterceptor refreshInterceptor,
}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.addAll([
    authInterceptor,
    refreshInterceptor,
    LoggingInterceptor(),
  ]);

  return dio;
}
