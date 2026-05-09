
import {TopUpAttemptStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class TopUpAttemptDto {
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
}
