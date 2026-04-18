import 'package:esim_frontend/features/wallet/data/dto/wallet_balance_dto.dart';
import 'package:esim_frontend/features/wallet/data/dto/wallet_ledger_entry_dto.dart';
import 'package:esim_frontend/features/wallet/data/wallet_datasource.dart';
import 'package:esim_frontend/features/wallet/models/wallet_balance.dart';
import 'package:esim_frontend/features/wallet/models/wallet_ledger_entry.dart';

class WalletRepository {
  const WalletRepository(this._datasource);

  final WalletDatasource _datasource;

  Future<WalletBalance> getBalance() async {
    final raw = await _datasource.getBalance();
    return WalletBalanceDto.fromJson(raw).toDomain();
  }

  Future<List<WalletLedgerEntry>> getHistory() async {
    final raw = await _datasource.getHistory();
    return raw.map((j) => WalletLedgerEntryDto.fromJson(j).toDomain()).toList();
  }

  Future<WalletBalance> topUp(int amount) async {
    await _datasource.topUp(amount);
    final raw = await _datasource.getBalance();
    return WalletBalanceDto.fromJson(raw).toDomain();
  }
}
