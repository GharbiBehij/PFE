import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Dev-only logger. Stripped in release builds via kDebugMode.
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('[REQ] ${options.method} ${options.uri}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response<dynamic> response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('[RES] ${response.statusCode} ${response.requestOptions.uri}');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('[ERR] ${err.response?.statusCode} ${err.requestOptions.uri} — ${err.message}');
    }
    handler.next(err);
  }
}
