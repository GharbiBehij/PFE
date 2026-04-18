import { ApiProperty } from '@nestjs/swagger';

export class CreateOfferDto {
    @ApiProperty({ example: 'France' })
    country: string;

    @ApiProperty({ example: 'Europe' })
    Region: string;

    @ApiProperty({ example: 'Paris' })
    Destination: string;

    @ApiProperty({ example: 'Tourism' })
    Category: string;

    @ApiProperty({ example: 'France 5GB - 30 Days' })
    title: string;

    @ApiProperty({ example: 'Affordable eSIM package for short trips in France.' })
    description: string;

    @ApiProperty({ example: 'HIGH' })
    popularity: string;

    @ApiProperty({ example: 5120, description: 'Data volume in MB' })
    dataVolume: number;

    @ApiProperty({ example: 30 })
    validityDays: number;

    @ApiProperty({ example: 1800, description: 'Price in minor units' })
    price: number;

    @ApiProperty({ example: 250, description: 'Internal margin in minor units' })
    InternalMargin: number;

    @ApiProperty({ example: 3 })
    providerId: number;
}
