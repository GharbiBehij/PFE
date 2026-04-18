
import { ApiProperty } from '@nestjs/swagger';
import { Provider } from './provider.entity';
import { Transaction } from './transaction.entity';
import { Esim } from './esim.entity';

export class Offer {
  @ApiProperty({ example: 101, description: 'Offer ID', type: 'integer' })
  id: number;

  @ApiProperty({ example: 'France', description: 'Country name' })
  country: string;

  @ApiProperty({ example: 'Europe', description: 'Region name' })
  Region: string;

  @ApiProperty({ example: 'Paris', description: 'Destination' })
  Destination: string;

  @ApiProperty({ example: 'Tourism', description: 'Offer category' })
  Category: string;

  @ApiProperty({ example: 'France 5GB - 30 Days', description: 'Offer title' })
  title: string;

  @ApiProperty({ example: 'Affordable eSIM package for short trips in France.', description: 'Offer description' })
  description: string;

  @ApiProperty({ example: 'HIGH', description: 'Popularity indicator' })
  popularity: string;

  @ApiProperty({ example: 5120, description: 'Data volume in MB', type: 'integer' })
  dataVolume: number;

  @ApiProperty({ example: 30, description: 'Validity period in days', type: 'integer' })
  validityDays: number;

  @ApiProperty({ example: 1800, description: 'Price in minor units (e.g. millimes)', type: 'integer' })
  price: number;

  @ApiProperty({ example: 250, description: 'Internal margin in minor units', type: 'integer' })
  InternalMargin: number;

  @ApiProperty({ example: 3, description: 'Provider ID', type: 'integer' })
  providerId: number;

  @ApiProperty({ example: false, description: 'Soft-delete flag' })
  isDeleted: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-10T00:00:00.000Z', type: 'string', format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: () => Provider, required: false })
  provider?: Provider;

  @ApiProperty({ type: () => Transaction, isArray: true, required: false })
  transactions?: Transaction[];

  @ApiProperty({ type: () => Esim, isArray: true, required: false })
  esims?: Esim[];
}
