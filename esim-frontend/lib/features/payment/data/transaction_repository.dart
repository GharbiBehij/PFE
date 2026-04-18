import 'package:esim_frontend/features/payment/data/dto/transaction_dto.dart';
import 'package:esim_frontend/features/payment/data/transaction_datasource.dart';
import 'package:esim_frontend/features/payment/models/transaction.dart';

class TransactionRepository {
  const TransactionRepository(this._datasource);

  final TransactionDatasource _datasource;

  Future<List<Transaction>> getUserTransactions() async {
    final raw = await _datasource.getUserTransactions();
    return raw.map((j) => TransactionDto.fromJson(j).toDomain()).toList();
  }

  Future<Transaction> getTransactionDetail(int id) async {
    final raw = await _datasource.getTransactionDetail(id);

    final transactionMap =
        (raw['transaction'] as Map<String, dynamic>? ?? <String, dynamic>{});
    final esims = (raw['esims'] as List<dynamic>? ?? <dynamic>[])
        .cast<Map<String, dynamic>>();

    final merged = <String, dynamic>{...transactionMap, 'esims': esims};
    return TransactionDto.fromJson(merged).toDomain();
  }
}
