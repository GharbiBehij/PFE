import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/wallet/data/wallet_datasource.dart';
import 'package:esim_frontend/features/wallet/data/wallet_repository.dart';
import 'package:esim_frontend/features/wallet/models/wallet_balance.dart';
import 'package:esim_frontend/features/wallet/models/wallet_ledger_entry.dart';

final walletDatasourceProvider = Provider<WalletDatasource>((ref) {
  return WalletDatasource(ref.read(dioProvider));
});

final walletRepositoryProvider = Provider<WalletRepository>((ref) {
  return WalletRepository(ref.read(walletDatasourceProvider));
});

final walletBalanceProvider = FutureProvider<WalletBalance>((ref) {
  return ref.read(walletRepositoryProvider).getBalance();
});

final walletHistoryProvider = FutureProvider<List<WalletLedgerEntry>>((ref) {
  return ref.read(walletRepositoryProvider).getHistory();
});

sealed class TopUpState {}

class TopUpInitial extends TopUpState {}

class TopUpLoading extends TopUpState {}

class TopUpSuccess extends TopUpState {
  TopUpSuccess(this.newBalance);
  final WalletBalance newBalance;
}

class TopUpError extends TopUpState {
  TopUpError(this.message);
  final String message;
}

class TopUpNotifier extends StateNotifier<TopUpState> {
  TopUpNotifier(this._repository, this._ref) : super(TopUpInitial());

  final WalletRepository _repository;
  final Ref _ref;

  Future<void> topUp(int amount) async {
    if (amount <= 0) {
      state = TopUpError('Le montant doit etre superieur a 0.');
      return;
    }

    state = TopUpLoading();
    try {
      final result = await _repository.topUp(amount);
      _ref.invalidate(walletBalanceProvider);
      _ref.invalidate(walletHistoryProvider);
      _ref.invalidate(authProvider);
      state = TopUpSuccess(result);
    } catch (e) {
      state = TopUpError(e.toString());
    }
  }

  void reset() => state = TopUpInitial();
}

final topUpProvider = StateNotifierProvider<TopUpNotifier, TopUpState>((ref) {
  return TopUpNotifier(ref.read(walletRepositoryProvider), ref);
});
