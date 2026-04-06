import 'package:dio/dio.dart';
import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/storage/token_storage.dart';

/// On 401, tries to refresh the access token once and retries the request.
/// If refresh fails, clears tokens and rethrows [UnauthenticatedException].
class RefreshInterceptor extends Interceptor {
  RefreshInterceptor(this._dio, this._storage);

  final Dio _dio;
  final TokenStorage _storage;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.requestOptions.extra['skipRefresh'] == true) return handler.next(err);
    if (err.response?.statusCode != 401) return handler.next(err);

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) throw const UnauthenticatedException();

      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(extra: {'skipRefresh': true}),
      );

      final newAccess = res.data!['accessToken'] as String;
      final newRefresh = res.data!['refreshToken'] as String? ?? refreshToken;
      await _storage.saveTokens(
        accessToken: newAccess,
        refreshToken: newRefresh,
      );

      // Retry original request with new token.
      final opts = err.requestOptions
        ..headers['Authorization'] = 'Bearer $newAccess';
      final retried = await _dio.fetch<dynamic>(opts);
      handler.resolve(retried);
    } catch (_) {
      await _storage.clear();
      handler.reject(
        DioException(
          requestOptions: err.requestOptions,
          error: const UnauthenticatedException(),
        ),
      );
    }
  }
}
