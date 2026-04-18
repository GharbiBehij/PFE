import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionEsimSummaryDto {
  @ApiProperty({ example: 77 })
  id: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'LPA:1$smdp.io$ACT-2026-ABC',
  })
  qrCode?: string | null;
}

export class TransactionItemResponseDto {
  @ApiProperty({ example: 9001 })
  id: number;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'B2C' })
  channel: string;

  @ApiProperty({ example: 1800 })
  amount: number;

  @ApiProperty({ example: 'TND' })
  currency: string;

  @ApiProperty({ example: 42 })
  userId: number;

  @ApiProperty({ example: 101 })
  offerId: number;

  @ApiProperty({ example: '2026-04-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-09T10:35:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: [TransactionEsimSummaryDto] })
  esims: TransactionEsimSummaryDto[];
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionItemResponseDto] })
  transactions: TransactionItemResponseDto[];
}

export class TransactionDetailCoreDto {
  @ApiProperty({ example: 9001 })
  id: number;

  @ApiProperty({ example: 'SUCCEEDED' })
  status: string;

  @ApiProperty({ example: 'B2C' })
  channel: string;

  @ApiProperty({ example: 1800 })
  amount: number;

  @ApiProperty({ example: 'TND' })
  currency: string;

  @ApiProperty({ example: 42 })
  userId: number;

  @ApiProperty({ example: 101 })
  offerId: number;

  @ApiProperty({ example: '2026-04-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-09T10:35:00.000Z' })
  updatedAt: Date;
}

export class TransactionDetailResponseDto {
  @ApiProperty({ type: TransactionDetailCoreDto })
  transaction: TransactionDetailCoreDto;

  @ApiProperty({ type: [TransactionEsimSummaryDto] })
  esims: TransactionEsimSummaryDto[];
}

export class PurchaseResponseDto {
  @ApiProperty({ example: 9001 })
  transactionId: number;

  @ApiPropertyOptional({ example: 'PENDING' })
  status?: string;

  @ApiProperty({ example: 'SUCCESS' })
  message: string;

  @ApiPropertyOptional({ example: 'Card declined' })
  error?: string;
}
