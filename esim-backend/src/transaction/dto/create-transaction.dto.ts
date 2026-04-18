import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '@prisma/client';

export type PaymentMethod = 'WALLET' | 'CASH';
export type TransactionChannelDto = 'B2C' | 'B2B2C';

export class CreateTransactionDto {
  @ApiProperty({ example: 'P1234567' })
  passportId: string;

  @ApiProperty({ example: 'client@example.com' })
  email: string;

  @ApiProperty({ example: 'Ali' })
  firstname: string;

  @ApiProperty({ example: 'Ben Salah' })
  lastname: string;

  @ApiProperty({ example: 42 })
  userId: number;

  @ApiProperty({ enum: TransactionStatus, enumName: 'TransactionStatus', example: TransactionStatus.PENDING })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status: TransactionStatus;

  @ApiProperty({ example: 101 })
  offerId: number;

  @ApiProperty({ example: 1800, description: 'Transaction amount in minor units' })
  amount: number;

  @ApiProperty({ example: 'TND' })
  currency: string;

  @ApiProperty({ enum: ['B2C', 'B2B2C'], example: 'B2C' })
  channel: TransactionChannelDto;

  @ApiPropertyOptional({ enum: ['WALLET', 'CASH'], example: 'WALLET' })
  paymentMethod?: PaymentMethod;
}

export class B2CPurchaseDto {
  @ApiProperty({ example: 101 })
  @IsNumber()
  offerId: number;

  @ApiProperty({ enum: ['WALLET', 'CASH'], example: 'WALLET' })
  @IsString()
  paymentMethod: string;
}
