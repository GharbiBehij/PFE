
import {ActivationAttemptStatus,Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsDateString,IsEnum,IsInt,IsOptional,IsString} from 'class-validator'




export class UpdateActivationAttemptDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
attemptNumber?: number ;
@ApiProperty({
  enum: ActivationAttemptStatus,
  enumName: 'ActivationAttemptStatus',
  required: false,
})
@IsOptional()
@IsEnum(ActivationAttemptStatus)
status?: ActivationAttemptStatus ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
providerRequestId?: string ;
@ApiProperty({
  type: () => Object,
  required: false,
  nullable: true,
})
@IsOptional()
providerResponse?: Prisma.InputJsonValue  | Prisma.NullableJsonNullValueInput;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
errorCode?: string  | null;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
errorMessage?: string  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  required: false,
})
@IsOptional()
@IsDateString()
startedAt?: Date ;
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
