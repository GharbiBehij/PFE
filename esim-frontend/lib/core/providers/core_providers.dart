import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:esim_frontend/core/constants/api_constants.dart';
import 'package:esim_frontend/core/network/auth_interceptor.dart';
import 'package:esim_frontend/core/network/dio_client.dart';
import 'package:esim_frontend/core/network/refresh_interceptor.dart';
import 'package:esim_frontend/core/network/ws_client.dart';
import 'package:esim_frontend/core/storage/token_storage.dart';

// ── Storage ────────────────────────────────────────────────────────────────

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return const TokenStorage(FlutterSecureStorage());
});

// ── Network ────────────────────────────────────────────────────────────────

final _authInterceptorProvider = Provider<AuthInterceptor>((ref) {
  return AuthInterceptor(ref.read(tokenStorageProvider));
});

final dioProvider = Provider<Dio>((ref) {
  // RefreshInterceptor needs a Dio reference — use a separate plain Dio
  // so it doesn't cause circular calls through the same interceptor stack.
  final plainDio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  final refreshInterceptor = RefreshInterceptor(
    plainDio,
    ref.read(tokenStorageProvider),
  );
  return buildDioClient(
    authInterceptor: ref.read(_authInterceptorProvider),
    refreshInterceptor: refreshInterceptor,
  );
});

final wsClientProvider = Provider<WsClient>((ref) {
  return WsClient(ref.read(tokenStorageProvider));
});
