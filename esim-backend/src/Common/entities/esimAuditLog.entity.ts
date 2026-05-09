import { AuditLayer, AuditTrigger, SystemEvent, Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from './transaction.entity';

export class AuditLog {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ enum: AuditLayer, enumName: 'AuditLayer' })
  layer: AuditLayer;

  @ApiProperty({ enum: SystemEvent, enumName: 'SystemEvent' })
  event: SystemEvent;

  @ApiProperty({ type: 'integer', format: 'int32' })
  userId: number;

  @ApiProperty({ type: 'string', nullable: true })
  jobId: string | null;

  @ApiProperty({ type: 'integer', format: 'int32', nullable: true })
  attemptNumber: number | null;

  @ApiProperty({ type: 'string', nullable: true })
  fromStatus: string | null;

  @ApiProperty({ type: 'string' })
  toStatus: string;

  @ApiProperty({ enum: AuditTrigger, enumName: 'AuditTrigger' })
  triggeredBy: AuditTrigger;

  @ApiProperty({ type: 'string', nullable: true })
  trigger: string | null;

  @ApiProperty({ type: 'integer', format: 'int32', nullable: true })
  durationMs: number | null;

  @ApiProperty({ type: 'integer', format: 'int32', nullable: true })
  providerLatencyMs: number | null;

  @ApiProperty({ type: 'string', nullable: true })
  providerCode: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  paymentProvider: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  message: string | null;

  @ApiProperty({ type: () => Object, nullable: true })
  details: Prisma.JsonValue | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: 'integer', format: 'int32' })
  transactionId: number;

  @ApiProperty({ type: () => Transaction, required: false })
  transaction?: Transaction;
}
