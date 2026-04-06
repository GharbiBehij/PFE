import 'package:esim_frontend/features/wallet/data/wallet_datasource.dart';
import 'package:esim_frontend/features/wallet/models/wallet_balance.dart';
import 'package:esim_frontend/features/wallet/models/wallet_ledger_entry.dart';

class WalletRepository {
  const WalletRepository(this._datasource);

  final WalletDatasource _datasource;

  Future<WalletBalance> getBalance() async {
    final raw = await _datasource.getBalance();
    return WalletBalance.fromJson(raw);
  }

  Future<List<WalletLedgerEntry>> getHistory() async {
    final raw = await _datasource.getHistory();
    return raw.map(WalletLedgerEntry.fromJson).toList();
  }

  Future<WalletBalance> topUp(int amount) async {
    final raw = await _datasource.topUp(amount);
    return WalletBalance.fromJson(raw);
  }
}
