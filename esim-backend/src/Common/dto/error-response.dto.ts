import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Insufficient wallet balance' })
  message: string;

  @ApiPropertyOptional({ example: 'INSUFFICIENT_BALANCE' })
  code?: string;

  @ApiProperty({ example: 400 })
  statusCode: number;
}
