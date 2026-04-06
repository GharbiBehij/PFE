import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  const TokenStorage(this._storage);

  final FlutterSecureStorage _storage;

  static const _kAccess = 'access_token';
  static const _kRefresh = 'refresh_token';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) =>
      Future.wait([
        _storage.write(key: _kAccess, value: accessToken),
        _storage.write(key: _kRefresh, value: refreshToken),
      ]).then((_) {});

  Future<String?> getAccessToken() => _storage.read(key: _kAccess);
  Future<String?> getRefreshToken() => _storage.read(key: _kRefresh);

  Future<void> clear() => Future.wait([
        _storage.delete(key: _kAccess),
        _storage.delete(key: _kRefresh),
      ]).then((_) {});
}
