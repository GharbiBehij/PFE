import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ActivateEsimRequestDto {
  @ApiProperty({ example: 9001 })
  @IsNumber()
  @IsNotEmpty()
  transactionId: number;
}
