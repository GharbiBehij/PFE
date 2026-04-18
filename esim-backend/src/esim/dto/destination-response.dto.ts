import { ApiProperty } from '@nestjs/swagger';

export class DestinationPriceRangeDto {
  @ApiProperty({ example: 500, description: 'Minimum destination offer price in cents' })
  min: number;

  @ApiProperty({ example: 5000, description: 'Maximum destination offer price in cents' })
  max: number;
}

export class DestinationResponseDto {
  @ApiProperty({ example: 'France' })
  country: string;

  @ApiProperty({ example: 'Europe' })
  region: string;

  @ApiProperty({ example: 'LOCAL' })
  coverageType: string;

  @ApiProperty({ example: 15 })
  offerCount: number;

  @ApiProperty({ type: DestinationPriceRangeDto })
  priceRange: DestinationPriceRangeDto;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  })
  imageUrl: string;

  @ApiProperty({
    example: 500,
    description: 'Backward-compatible alias for the minimum destination price in cents',
    required: false,
  })
  lowestPrice?: number;
}
