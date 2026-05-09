
import {TopUpStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {User} from './user.entity'
import {TopUpAttempt} from './topUpAttempt.entity'


export class TopUpRequest {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
amount: number ;
@ApiProperty({
  type: 'string',
})
currency: string ;
@ApiProperty({
  type: 'string',
})
paymentMethod: string ;
@ApiProperty({
  enum: TopUpStatus,
  enumName: 'TopUpStatus',
})
status: TopUpStatus ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
gatewayPaymentId: string  | null;
@ApiProperty({
  type: 'string',
  nullable: true,
})
paymentUrl: string  | null;
@ApiProperty({
  type: 'string',
  nullable: true,
})
failureReason: string  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  nullable: true,
})
creditedAt: Date  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
updatedAt: Date ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
salesmanId: number ;
@ApiProperty({
  type: () => User,
  required: false,
})
salesman?: User ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  nullable: true,
})
reviewedBy: number  | null;
@ApiProperty({
  type: () => User,
  required: false,
  nullable: true,
})
reviewer?: User  | null;
@ApiProperty({
  type: () => TopUpAttempt,
  required: false,
  nullable: true,
})
topUpAttempt?: TopUpAttempt  | null;
}
