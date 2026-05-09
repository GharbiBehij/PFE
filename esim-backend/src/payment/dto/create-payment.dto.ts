import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 42 })
  userId: number;

  @ApiProperty({ example: 1800, description: 'Payment amount in minor units' })
  amount: number;
  @ApiProperty({ example: 'TND', description: 'Currency code' })
  currency: string;
}
