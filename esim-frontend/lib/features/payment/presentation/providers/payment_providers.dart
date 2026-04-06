import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/payment/data/payment_datasource.dart';
import 'package:esim_frontend/features/payment/data/payment_repository.dart';
import 'package:esim_frontend/features/payment/data/transaction_datasource.dart';
import 'package:esim_frontend/features/payment/data/transaction_repository.dart';
import 'package:esim_frontend/features/payment/models/purchase_result.dart';
import 'package:esim_frontend/features/payment/models/transaction.dart';
import 'package:esim_frontend/features/wallet/presentation/providers/wallet_providers.dart';

// ── Infrastructure providers ───────────────────────────────────────────────

final paymentDatasourceProvider = Provider<PaymentDatasource>((ref) {
  return PaymentDatasource(ref.read(dioProvider));
});

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(ref.read(paymentDatasourceProvider));
});

final transactionDatasourceProvider = Provider<TransactionDatasource>((ref) {
  return TransactionDatasource(ref.read(dioProvider));
});

final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  return TransactionRepository(ref.read(transactionDatasourceProvider));
});

// ── Purchase state ─────────────────────────────────────────────────────────

sealed class PurchaseState {}

class PurchaseInitial extends PurchaseState {}

class PurchaseLoading extends PurchaseState {}

class PurchaseSuccess extends PurchaseState {
  PurchaseSuccess(this.result);
  final PurchaseResult result;
}

class PurchaseError extends PurchaseState {
  PurchaseError(this.message);
  final String message;
}

// ── Notifier ───────────────────────────────────────────────────────────────

class PurchaseNotifier extends StateNotifier<PurchaseState> {
  PurchaseNotifier(this._repository, this._ref) : super(PurchaseInitial());

  final PaymentRepository _repository;
  final Ref _ref;

  Future<void> purchase({
    required int offerId,
    required String paymentMethod,
  }) async {
    state = PurchaseLoading();
    try {
      final result = await _repository.purchaseOffer(
        offerId: offerId,
        paymentMethod: paymentMethod,
      );

      _ref.invalidate(userTransactionsProvider);
      if (paymentMethod == 'wallet') {
        _ref.invalidate(walletBalanceProvider);
        _ref.invalidate(walletHistoryProvider);
        _ref.invalidate(authProvider);
      }

      state = PurchaseSuccess(result);
    } catch (e) {
      state = PurchaseError(e.toString());
    }
  }

  void reset() => state = PurchaseInitial();
}

final purchaseProvider =
    StateNotifierProvider<PurchaseNotifier, PurchaseState>((ref) {
  return PurchaseNotifier(ref.read(paymentRepositoryProvider), ref);
});

final userTransactionsProvider = FutureProvider<List<Transaction>>((ref) {
  return ref.read(transactionRepositoryProvider).getUserTransactions();
});

final transactionDetailProvider =
    FutureProvider.family<Transaction, int>((ref, id) {
  return ref.read(transactionRepositoryProvider).getTransactionDetail(id);
});
