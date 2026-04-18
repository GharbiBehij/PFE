import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/features/esims/data/datasources/esim_remote_datasource.dart';
import 'package:esim_frontend/features/esims/data/models/esim_model.dart';
import 'package:esim_frontend/features/esims/data/repositories/esim_repository_impl.dart';
import 'package:esim_frontend/features/esims/domain/repositories/esim_repository.dart';

part 'esims_provider.freezed.dart';

@freezed
class EsimsState with _$EsimsState {
  const factory EsimsState.initial() = _Initial;
  const factory EsimsState.loading() = _Loading;
  const factory EsimsState.loaded(List<EsimModel> esims) = _Loaded;
  const factory EsimsState.error(String message) = _Error;
}

@freezed
class EsimDetailState with _$EsimDetailState {
  const factory EsimDetailState.initial() = _DetailInitial;
  const factory EsimDetailState.loading() = _DetailLoading;
  const factory EsimDetailState.loaded(EsimModel esim) = _DetailLoaded;
  const factory EsimDetailState.syncing(EsimModel esim) = _Syncing;
  const factory EsimDetailState.error(String message) = _DetailError;
}

final esimRemoteDatasourceProvider = Provider<EsimRemoteDataSource>((ref) {
  return EsimRemoteDataSource(ref.read(dioProvider));
});

final esimRepositoryProvider = Provider<EsimRepository>((ref) {
  return EsimRepositoryImpl(ref.read(esimRemoteDatasourceProvider));
});

class EsimsNotifier extends StateNotifier<EsimsState> {
  EsimsNotifier(this._repository, this._ref) : super(const EsimsState.initial());

  final EsimRepository _repository;
  final Ref _ref;
  void Function(dynamic)? _usageUpdatedListener;

  Future<void> fetchEsims() async {
    state = const EsimsState.loading();
    try {
      final esims = await _repository.getMyEsims();
      state = EsimsState.loaded(esims);
    } on AppException catch (e) {
      state = EsimsState.error(e.message);
    } catch (_) {
      state = const EsimsState.error('Erreur inattendue lors du chargement.');
    }
  }

  Future<void> refresh() => fetchEsims();

  void upsertEsim(EsimModel esim) {
    state.maybeWhen(
      loaded: (esims) {
        final list = [...esims];
        final index = list.indexWhere((item) => item.id == esim.id);
        if (index == -1) {
          list.insert(0, esim);
        } else {
          list[index] = esim;
        }
        state = EsimsState.loaded(list);
      },
      orElse: () {},
    );
  }

  void removeEsim(String id) {
    state.maybeWhen(
      loaded: (esims) {
        state = EsimsState.loaded(
          esims.where((item) => item.id != id).toList(growable: false),
        );
      },
      orElse: () {},
    );
  }

  void bindRealtimeUpdates() {
    final wsClient = _ref.read(wsClientProvider);
    final socket = wsClient.socketOrNull;
    if (socket == null || _usageUpdatedListener != null) return;

    _usageUpdatedListener = (payload) {
      if (payload is! Map<String, dynamic>) return;
      final esimPayload = payload['esim'];
      if (esimPayload is! Map<String, dynamic>) return;
      upsertEsim(EsimModel.fromJson(esimPayload));
    };

    socket.on('esim:usage-updated', _usageUpdatedListener!);
  }

  @override
  void dispose() {
    final wsClient = _ref.read(wsClientProvider);
    final socket = wsClient.socketOrNull;
    if (socket != null && _usageUpdatedListener != null) {
      socket.off('esim:usage-updated', _usageUpdatedListener);
    }
    super.dispose();
  }
}

class EsimDetailNotifier extends StateNotifier<EsimDetailState> {
  EsimDetailNotifier(
    this._repository,
    this._ref,
    this.esimId,
  ) : super(const EsimDetailState.initial());

  final EsimRepository _repository;
  final Ref _ref;
  final String esimId;

  Future<void> loadEsim() async {
    state = const EsimDetailState.loading();
    try {
      final esim = await _repository.getEsimById(esimId);
      state = EsimDetailState.loaded(esim);
      _ref.read(esimsProvider.notifier).upsertEsim(esim);
    } on AppException catch (e) {
      state = EsimDetailState.error(e.message);
    } catch (_) {
      state = const EsimDetailState.error('Impossible de charger cette eSIM.');
    }
  }

  Future<void> syncUsage() async {
    final previous = state.maybeWhen(loaded: (esim) => esim, orElse: () => null);
    if (previous == null) return;

    state = EsimDetailState.syncing(previous);

    try {
      final synced = await _repository.syncUsage(esimId);
      state = EsimDetailState.loaded(synced);
      _ref.read(esimsProvider.notifier).upsertEsim(synced);
    } on AppException catch (e) {
      state = EsimDetailState.error(e.message);
      state = EsimDetailState.loaded(previous);
    } catch (_) {
      state = const EsimDetailState.error('Synchronisation impossible.');
      state = EsimDetailState.loaded(previous);
    }
  }

  Future<bool> deleteEsim() async {
    final current = state.maybeWhen(loaded: (esim) => esim, orElse: () => null);
    if (current == null) return false;

    state = const EsimDetailState.loading();

    try {
      await _repository.deleteEsim(esimId);
      _ref.read(esimsProvider.notifier).removeEsim(esimId);
      return true;
    } on AppException catch (e) {
      state = EsimDetailState.error(e.message);
      state = EsimDetailState.loaded(current);
      return false;
    } catch (_) {
      state = const EsimDetailState.error('Suppression impossible.');
      state = EsimDetailState.loaded(current);
      return false;
    }
  }
}

final esimsProvider = StateNotifierProvider.autoDispose<EsimsNotifier, EsimsState>((ref) {
  final notifier = EsimsNotifier(ref.read(esimRepositoryProvider), ref);
  notifier.fetchEsims();
  notifier.bindRealtimeUpdates();
  return notifier;
});

final esimDetailProvider = StateNotifierProvider.autoDispose
    .family<EsimDetailNotifier, EsimDetailState, String>((ref, esimId) {
  final notifier = EsimDetailNotifier(ref.read(esimRepositoryProvider), ref, esimId);
  notifier.loadEsim();
  return notifier;
});
