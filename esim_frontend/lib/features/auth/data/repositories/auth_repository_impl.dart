import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/storage/token_storage.dart';
import 'package:esim_frontend/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:esim_frontend/features/auth/domain/entities/user_entity.dart';
import 'package:esim_frontend/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(this._remote, this._tokenStorage);

  final AuthRemoteDatasource _remote;
  final TokenStorage _tokenStorage;

  @override
  Future<UserEntity> login({
    required String email,
    required String password,
  }) async {
    final data = await _remote.login(email: email, password: password);
    await _tokenStorage.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
    return _mapUser(data['user'] as Map<String, dynamic>);
  }

  @override
  Future<UserEntity> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final data = await _remote.register(
      email: email,
      password: password,
      name: name,
    );
    await _tokenStorage.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
    return _mapUser(data['user'] as Map<String, dynamic>);
  }

  @override
  Future<void> logout() => _tokenStorage.clear();

  @override
  Future<UserEntity> getCurrentUser() async {
    final token = await _tokenStorage.getAccessToken();
    if (token == null) throw const UnauthenticatedException();
    final data = await _remote.getCurrentUser();
    return _mapUser(data);
  }

  @override
  Future<String> refreshToken() async {
    final token = await _tokenStorage.getRefreshToken();
    if (token == null) throw const UnauthenticatedException();
    final data = await _remote.refreshToken(token);
    final newAccess = data['accessToken'] as String;
    final newRefresh = data['refreshToken'] as String? ?? token;
    await _tokenStorage.saveTokens(
      accessToken: newAccess,
      refreshToken: newRefresh,
    );
    return newAccess;
  }

  // ── private helpers ────────────────────────────────────────────────────────

  UserEntity _mapUser(Map<String, dynamic> json) => UserEntity(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String,
        role: json['role'] as String,
        balance: (json['balance'] as num).toDouble(),
      );
}
