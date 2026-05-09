import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class EsimTopupDto {
  @ApiProperty({ description: 'Offer ID to use for top-up' })
  @IsNumber()
  offerId: number;

  @ApiProperty({ description: 'Payment method for B2C' })
  @IsString()
  paymentMethod: string;
}
