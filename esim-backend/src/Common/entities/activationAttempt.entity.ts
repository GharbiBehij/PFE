
import {ActivationAttemptStatus,Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {Esim} from './esim.entity'


export class ActivationAttempt {
  @ApiProperty({
  type: 'string',
})
id: string ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
attemptNumber: number ;
@ApiProperty({
  enum: ActivationAttemptStatus,
  enumName: 'ActivationAttemptStatus',
})
status: ActivationAttemptStatus ;
@ApiProperty({
  type: 'string',
})
providerRequestId: string ;
@ApiProperty({
  type: () => Object,
  nullable: true,
})
providerResponse: Prisma.JsonValue  | null;
@ApiProperty({
  type: 'string',
  nullable: true,
})
errorCode: string  | null;
@ApiProperty({
  type: 'string',
  nullable: true,
})
errorMessage: string  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
startedAt: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  nullable: true,
})
completedAt: Date  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
esimId: number ;
@ApiProperty({
  type: () => Esim,
  required: false,
})
esim?: Esim ;
}
