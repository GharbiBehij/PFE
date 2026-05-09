import { IsInt, IsPositive, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTopUpDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'CARD', enum: ['CARD', 'CASH'] })
  @IsIn(['CARD', 'CASH'])
  paymentMethod: 'CARD' | 'CASH';
}
