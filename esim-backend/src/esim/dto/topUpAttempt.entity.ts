
import {TopUpAttemptStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {TopUpRequest} from './topUpRequest.entity'
import {User} from './user.entity'


export class TopUpAttempt {
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
  enum: TopUpAttemptStatus,
  enumName: 'TopUpAttemptStatus',
})
status: TopUpAttemptStatus ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
failureReason: string  | null;
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
topUpRequestId: number ;
@ApiProperty({
  type: () => TopUpRequest,
  required: false,
})
topUpRequest?: TopUpRequest ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
userId: number ;
@ApiProperty({
  type: () => User,
  required: false,
})
user?: User ;
}
