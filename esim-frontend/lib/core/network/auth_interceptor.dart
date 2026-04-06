import 'package:dio/dio.dart';
import 'package:esim_frontend/core/storage/token_storage.dart';

/// Attaches the Bearer token to every outgoing request.
class AuthInterceptor extends Interceptor {
  const AuthInterceptor(this._storage);

  final TokenStorage _storage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}
