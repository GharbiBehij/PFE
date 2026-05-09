import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopUpResponseDto {
  @ApiProperty()
  topUpRequestId: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  paymentUrl?: string;
}
