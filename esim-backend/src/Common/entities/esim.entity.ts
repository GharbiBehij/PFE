
import { EsimEventStatus, EsimStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';
import { Offer } from './offer.entity';
import { Provider } from './provider.entity';
import { Usage } from './usage.entity';
import { ActivationAttempt } from './activationAttempt.entity';

export class Esim {
  @ApiProperty({ example: 77, description: 'eSIM record ID', type: 'integer' })
  id: number;

  @ApiProperty({ example: '8937201901234567890', description: 'ICCID' })
  iccid: string;

  @ApiProperty({ example: 'LPA:1$smdp.io$ACT-2026-XYZ', description: 'Activation code / LPA URI' })
  activationCode: string;

  @ApiProperty({ enum: EsimStatus, enumName: 'EsimStatus', example: EsimStatus.ACTIVE })
  status: EsimStatus;

  @ApiProperty({ enum: EsimEventStatus, enumName: 'EsimEventStatus', example: EsimEventStatus.ACTIVATION_SUCCESS })
  event: EsimEventStatus;

  @ApiProperty({ example: null, description: 'QR code string', nullable: true })
  qrCode: string | null;

  @ApiProperty({ example: 5120, description: 'Total data in MB', type: 'integer' })
  dataTotal: number;

  @ApiProperty({ example: 1200, description: 'Used data in MB', type: 'integer' })
  dataUsed: number;

  @ApiProperty({ example: null, description: 'Last usage sync timestamp', type: 'string', format: 'date-time', nullable: true })
  lastUsageSync: Date | null;

  @ApiProperty({ example: '2026-04-09T08:30:00.000Z', type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-09T08:30:00.000Z', type: 'string', format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ example: '2026-04-09T08:30:00.000Z', description: 'Activation timestamp', type: 'string', format: 'date-time', nullable: true })
  activatedAt: Date | null;

  @ApiProperty({ example: '2026-05-10T00:00:00.000Z', description: 'Expiry date', type: 'string', format: 'date-time' })
  expiryDate: Date;

  @ApiProperty({ example: 42, description: 'Owner user ID', type: 'integer' })
  userId: number;

  @ApiProperty({ type: () => User, required: false })
  user?: User;

  @ApiProperty({ example: 9001, description: 'Linked transaction ID', type: 'integer' })
  transactionId: number;

  @ApiProperty({ type: () => Transaction, required: false })
  transaction?: Transaction;

  @ApiProperty({ example: 101, description: 'Offer ID', type: 'integer', nullable: true })
  offerId: number | null;

  @ApiProperty({ type: () => Offer, required: false, nullable: true })
  offer?: Offer | null;

  @ApiProperty({ example: 3, description: 'Provider ID', type: 'integer' })
  providerId: number;

  @ApiProperty({ type: () => Provider, required: false })
  provider?: Provider;

  @ApiProperty({ type: () => Usage, isArray: true, required: false })
  usages?: Usage[];

  @ApiProperty({ type: () => ActivationAttempt, isArray: true, required: false })
  activationAttempts?: ActivationAttempt[];
}
