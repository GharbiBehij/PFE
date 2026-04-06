
import { Prisma, EsimEventStatus } from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {Transaction} from './transaction.entity'


export class ProvisioningEvent {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
})
type: EsimEventStatus ;
@ApiProperty({
  type: () => Object,
  nullable: true,
})
metadata: Prisma.JsonValue  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
transactionId: number ;
@ApiProperty({
  type: () => Transaction,
  required: false,
})
transaction?: Transaction ;
}
