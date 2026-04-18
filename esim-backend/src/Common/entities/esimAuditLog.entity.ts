
import {EsimEventStatus,EsimStatus,Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {Transaction} from './transaction.entity'


export class EsimAuditLog {
  @ApiProperty({
  type: 'string',
})
id: string ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
userId: number ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
jobId: string  | null;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
})
event: EsimEventStatus ;
@ApiProperty({
  enum: EsimStatus,
  enumName: 'EsimStatus',
})
status: EsimStatus ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
message: string  | null;
@ApiProperty({
  type: () => Object,
  nullable: true,
})
details: Prisma.JsonValue  | null;
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
