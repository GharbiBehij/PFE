
import {TopUpAttemptStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsDateString,IsEnum,IsInt,IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreateTopUpAttemptDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
amount: number ;
@ApiProperty({
  enum: TopUpAttemptStatus,
  enumName: 'TopUpAttemptStatus',
})
@IsNotEmpty()
@IsEnum(TopUpAttemptStatus)
status: TopUpAttemptStatus ;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
failureReason?: string  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
@IsNotEmpty()
@IsDateString()
startedAt: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  required: false,
  nullable: true,
})
@IsOptional()
@IsDateString()
completedAt?: Date  | null;
}
