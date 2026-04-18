import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ example: 'pay_a1b2c3d4' })
  paymentId?: string;

  @ApiPropertyOptional({ example: false })
  retryable?: boolean;

  @ApiPropertyOptional({ example: 'Card declined (insufficient funds or fraud).' })
  error?: string;
}
