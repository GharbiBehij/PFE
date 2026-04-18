import 'package:esim_frontend/features/wallet/models/wallet_balance.dart';

class WalletBalanceDto {
  const WalletBalanceDto({required this.balance});

  final int balance;

  factory WalletBalanceDto.fromJson(Map<String, dynamic> json) =>
      WalletBalanceDto(
        balance: (json['balance'] as num?)?.toInt() ?? 0,
      );

  WalletBalance toDomain() => WalletBalance(balance: balance);
}
