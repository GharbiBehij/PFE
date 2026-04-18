import { ApiProperty } from '@nestjs/swagger';

export class CreateEsimDto {
  @ApiProperty({ example: 9001 })
  transactionId: number;

  @ApiProperty({ example: 101 })
  offerId: number;

  @ApiProperty({ example: 'France' })
  country: string;

  @ApiProperty({ example: 5120, description: 'Data volume in MB' })
  dataVolume: number;

  @ApiProperty({ example: 30 })
  validityDays: number;

  @ApiProperty({ example: 3 })
  providerId: number;

  @ApiProperty({ example: 42 })
  userId: number;
}
