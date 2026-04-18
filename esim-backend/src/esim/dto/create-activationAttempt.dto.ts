
import {ActivationAttemptStatus,Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsDateString,IsEnum,IsInt,IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreateActivationAttemptDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
attemptNumber: number ;
@ApiProperty({
  enum: ActivationAttemptStatus,
  enumName: 'ActivationAttemptStatus',
})
@IsNotEmpty()
@IsEnum(ActivationAttemptStatus)
status: ActivationAttemptStatus ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
providerRequestId: string ;
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
