import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/features/esims/data/datasources/esim_remote_datasource.dart';
import 'package:esim_frontend/features/esims/data/models/esim_model.dart';
import 'package:esim_frontend/features/esims/data/repositories/esim_repository_impl.dart';
import 'package:esim_frontend/features/esims/domain/repositories/esim_repository.dart';
import 'package:esim_frontend/features/esims/models/esim.dart';
import 'package:esim_frontend/features/esims/models/esim_list.dart';

final esimDatasourceProvider = Provider<EsimRemoteDataSource>((ref) {
  return EsimRemoteDataSource(ref.read(dioProvider));
});

final esimRepositoryProvider = Provider<EsimRepository>((ref) {
  return EsimRepositoryImpl(ref.read(esimDatasourceProvider));
});

final userEsimsProvider = FutureProvider<EsimList>((ref) async {
  final esims = await ref.read(esimRepositoryProvider).getMyEsims();
  final mapped = esims.map(_toLegacyEsim).toList(growable: false);

  final active = mapped.where((item) => item.status == 'ACTIVE').toList(growable: false);
  final expired = mapped
      .where((item) => item.status == 'EXPIRED' || item.status == 'DELETED')
      .toList(growable: false);

  return EsimList(active: active, expired: expired);
});

final esimDetailProvider = FutureProvider.family<Esim, int>((ref, id) async {
  final esim = await ref.read(esimRepositoryProvider).getEsimById(id.toString());
  return _toLegacyEsim(esim);
});

// ── Action state ───────────────────────────────────────────────────────────

sealed class EsimActionState {}

class EsimActionInitial extends EsimActionState {}

class EsimActionLoading extends EsimActionState {}

class EsimActionSuccess extends EsimActionState {
  EsimActionSuccess(this.message);
  final String message;
}

class EsimActionError extends EsimActionState {
  EsimActionError(this.message);
  final String message;
}

class EsimActionNotifier extends StateNotifier<EsimActionState> {
  EsimActionNotifier(this._repository, this._ref) : super(EsimActionInitial());

  final EsimRepository _repository;
  final Ref _ref;

  Future<void> syncUsage(int id) async {
    state = EsimActionLoading();
    try {
      await _repository.syncUsage(id.toString());
      _ref.invalidate(esimDetailProvider(id));
      _ref.invalidate(userEsimsProvider);
      state = EsimActionSuccess('Utilisation synchronisée avec succès.');
    } catch (e) {
      state = EsimActionError(e.toString());
    }
  }

  Future<void> deleteEsim(int id) async {
    state = EsimActionLoading();
    try {
      await _repository.deleteEsim(id.toString());
      _ref.invalidate(userEsimsProvider);
      state = EsimActionSuccess('eSIM supprimé avec succès.');
    } catch (e) {
      state = EsimActionError(e.toString());
    }
  }

  void reset() => state = EsimActionInitial();
}

final esimActionProvider =
    StateNotifierProvider<EsimActionNotifier, EsimActionState>((ref) {
  return EsimActionNotifier(ref.read(esimRepositoryProvider), ref);
});

Esim _toLegacyEsim(EsimModel esim) {
  return Esim(
    id: int.tryParse(esim.id) ?? 0,
    country: esim.offer.country,
    region: esim.offer.region.isEmpty ? null : esim.offer.region,
    dataTotal: esim.dataTotal,
    dataUsed: esim.dataUsed,
    status: _statusToLegacyValue(esim.status),
    qrCode: esim.qrCode,
    activatedAt: esim.activatedAt,
    expiresAt: esim.expiresAt,
    createdAt: esim.activatedAt ?? DateTime.now(),
  );
}

String _statusToLegacyValue(EsimStatus status) {
  return switch (status) {
    EsimStatus.active => 'ACTIVE',
    EsimStatus.expired => 'EXPIRED',
    EsimStatus.deleted => 'DELETED',
    EsimStatus.pending => 'PENDING',
  };
}
