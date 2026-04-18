import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 25000, description: 'Wallet balance in minor units' })
  balance: number;
}

export class WalletLedgerEntryResponseDto {
  @ApiProperty({ example: 11 })
  id: number;

  @ApiProperty({ example: 5000 })
  amount: number;

  @ApiProperty({ example: 'DEBIT' })
  type: string;

  @ApiProperty({ example: 'RESERVE' })
  reason: string;

  @ApiPropertyOptional({ example: 9001 })
  referenceId?: number;

  @ApiProperty({ example: '2026-04-09T10:30:00.000Z' })
  createdAt: Date;
}

export class WalletHistoryItemResponseDto {
  @ApiProperty({ example: 71 })
  id: number;

  @ApiProperty({ example: 5000 })
  amount: number;

  @ApiProperty({ example: 'WALLET' })
  paymentMethod: string;

  @ApiProperty({ example: 'RESERVED' })
  status: string;

  @ApiProperty({ example: 20000 })
  balanceAfter: number;

  @ApiProperty({ example: '2026-04-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: [WalletLedgerEntryResponseDto] })
  ledgerEntries: WalletLedgerEntryResponseDto[];
}

export class TopUpRequestResponseDto {
  @ApiProperty({ example: 25 })
  id: number;

  @ApiProperty({ example: 42 })
  salesmanId: number;

  @ApiProperty({ example: 15000 })
  amount: number;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiPropertyOptional({ nullable: true, example: 1 })
  reviewedBy?: number | null;

  @ApiProperty({ example: '2026-04-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-09T10:45:00.000Z' })
  updatedAt: Date;
}

export class SalesmanSummaryDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'seller@example.com' })
  email: string;

  @ApiProperty({ example: 'Sami' })
  firstname: string;

  @ApiProperty({ example: 'Trabelsi' })
  lastname: string;
}

export class PendingTopUpRequestResponseDto extends TopUpRequestResponseDto {
  @ApiPropertyOptional({ type: SalesmanSummaryDto })
  salesman?: SalesmanSummaryDto;
}

export class WalletHistoryResponseDto {
  @ApiProperty({ type: [WalletHistoryItemResponseDto] })
  data: WalletHistoryItemResponseDto[];

  @ApiProperty({ example: 35 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class TopUpHistoryResponseDto {
  @ApiProperty({ type: [TopUpRequestResponseDto] })
  data: TopUpRequestResponseDto[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class PendingTopUpHistoryResponseDto {
  @ApiProperty({ type: [PendingTopUpRequestResponseDto] })
  data: PendingTopUpRequestResponseDto[];

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
