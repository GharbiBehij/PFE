import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentVerifyDto {
  @ApiProperty({ description: 'ClicToPay orderId returned from register.do' })
  @IsString()
  orderId: string;
}
