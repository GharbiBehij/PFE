import 'package:dio/dio.dart';
import 'package:esim_frontend/core/errors/app_exception.dart';

class ErrorHandler {
  const ErrorHandler._();

  static AppException handle(DioException e) {
    return switch (e.type) {
      DioExceptionType.connectionError ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.connectionTimeout =>
        const NetworkException(),
      DioExceptionType.badResponse => _fromStatus(e.response),
      _ => ServerException(e.message ?? 'Unexpected error.'),
    };
  }

  static AppException _fromStatus(Response<dynamic>? res) {
    final code = res?.statusCode ?? 0;
    final msg = _message(res);
    return switch (code) {
      400 => ValidationException(msg),
      401 => UnauthenticatedException(msg),
      403 => ForbiddenException(msg),
      404 => NotFoundException(msg),
      422 => ValidationException(msg),
      _ => ServerException(msg),
    };
  }

  static String _message(Response<dynamic>? res) {
    try {
      final data = res?.data;
      if (data is Map) return data['message']?.toString() ?? 'Server error.';
    } catch (_) {}
    return 'Server error.';
  }
}
