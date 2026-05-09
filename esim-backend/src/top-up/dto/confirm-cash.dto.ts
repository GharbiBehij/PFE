import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class ConfirmCashDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  topUpRequestId: number;
}
