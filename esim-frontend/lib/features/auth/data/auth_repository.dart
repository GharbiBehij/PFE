import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/storage/token_storage.dart';
import 'package:esim_frontend/features/auth/data/auth_datasource.dart';
import 'package:esim_frontend/features/auth/models/user.dart';

class AuthRepository {
  const AuthRepository(this._datasource, this._storage);

  final AuthDatasource _datasource;
  final TokenStorage _storage;

  Future<User> login({required String email, required String password}) async {
    final res = await _datasource.login(email: email, password: password);
    await _storage.saveTokens(
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    );
    return res.user;
  }

  Future<User> signup({
    required String email,
    required String password,
    required String firstname,
    required String lastname,
  }) async {
    final res = await _datasource.signup(
      email: email,
      password: password,
      firstname: firstname,
      lastname: lastname,
    );
    await _storage.saveTokens(
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    );
    return res.user;
  }

  Future<void> logout() async {
    await _datasource.logout();
    await _storage.clear();
  }

  Future<User> getMe() async {
    final token = await _storage.getAccessToken();
    if (token == null) throw const UnauthenticatedException();
    return _datasource.getMe();
  }
}
