import 'package:injectable/injectable.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/features/esims/data/datasources/esim_remote_datasource.dart';
import 'package:esim_frontend/features/esims/data/models/esim_model.dart';
import 'package:esim_frontend/features/esims/domain/repositories/esim_repository.dart';

@injectable
class EsimRepositoryImpl implements EsimRepository {
  const EsimRepositoryImpl(this._remoteDataSource);

  final EsimRemoteDataSource _remoteDataSource;

  @override
  Future<List<EsimModel>> getMyEsims() async {
    try {
      return await _remoteDataSource.getMyEsims();
    } on AppException {
      rethrow;
    } catch (_) {
      throw const ServerException('Impossible de charger vos eSIMs.');
    }
  }

  @override
  Future<EsimModel> getEsimById(String id) async {
    try {
      return await _remoteDataSource.getEsimById(id);
    } on AppException {
      rethrow;
    } catch (_) {
      throw const ServerException('Impossible de recuperer cette eSIM.');
    }
  }

  @override
  Future<EsimModel> syncUsage(String id) async {
    try {
      return await _remoteDataSource.syncUsage(id);
    } on AppException {
      rethrow;
    } catch (_) {
      throw const ServerException('La synchronisation a echoue.');
    }
  }

  @override
  Future<void> deleteEsim(String id) async {
    try {
      await _remoteDataSource.deleteEsim(id);
    } on AppException {
      rethrow;
    } catch (_) {
      throw const ServerException('Suppression impossible pour le moment.');
    }
  }
}
