
import { TransactionChannel, TransactionStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty({ example: 9001, description: 'Transaction ID', type: 'integer' })
  id: number;

  @ApiProperty({ enum: TransactionStatus, enumName: 'TransactionStatus', example: TransactionStatus.SUCCEEDED })
  status: TransactionStatus;

  @ApiProperty({ enum: TransactionChannel, enumName: 'TransactionChannel', example: TransactionChannel.B2C })
  channel: TransactionChannel;

  @ApiProperty({ example: 1800, description: 'Amount in minor units', type: 'integer' })
  amount: number;

  @ApiProperty({ example: 'TND', description: 'Currency code' })
  currency: string;

  @ApiProperty({ example: '2026-04-09T08:30:00.000Z', type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-09T08:30:00.000Z', type: 'string', format: 'date-time' })
  updatedAt: Date;
}
