import 'package:dio/dio.dart';
import 'package:esim_frontend/core/errors/app_exception.dart';

/// Maps [DioException] → typed [AppException].
/// Call this inside every datasource catch block.
class ErrorHandler {
  const ErrorHandler._();

  static AppException fromDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.connectionTimeout:
        return const NetworkException();

      case DioExceptionType.badResponse:
        return _fromStatusCode(e.response);

      default:
        return ServerException(e.message ?? 'Unexpected error.');
    }
  }

  static AppException _fromStatusCode(Response<dynamic>? response) {
    final statusCode = response?.statusCode ?? 0;
    final message = _extractMessage(response);

    return switch (statusCode) {
      400 => ValidationException(message),
      401 => UnauthenticatedException(message),
      403 => ForbiddenException(message),
      404 => NotFoundException(message),
      422 => ValidationException(message, fieldErrors: _extractFieldErrors(response)),
      _ => ServerException(message),
    };
  }

  static String _extractMessage(Response<dynamic>? response) {
    try {
      final data = response?.data;
      if (data is Map) return data['message']?.toString() ?? 'Server error.';
    } catch (_) {}
    return 'Server error.';
  }

  static Map<String, String> _extractFieldErrors(Response<dynamic>? response) {
    try {
      final errors = response?.data['errors'] as Map<String, dynamic>?;
      return errors?.map((k, v) => MapEntry(k, v.toString())) ?? {};
    } catch (_) {
      return {};
    }
  }
}
