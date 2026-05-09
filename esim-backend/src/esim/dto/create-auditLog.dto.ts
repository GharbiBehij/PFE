
import {AuditLayer,AuditTrigger,Prisma,SystemEvent,statusDomain} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreateAuditLogDto {
  @ApiProperty({
  enum: AuditLayer,
  enumName: 'AuditLayer',
})
@IsNotEmpty()
@IsEnum(AuditLayer)
layer: AuditLayer ;
@ApiProperty({
  enum: SystemEvent,
  enumName: 'SystemEvent',
})
@IsNotEmpty()
@IsEnum(SystemEvent)
event: SystemEvent ;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
jobId?: string  | null;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
  nullable: true,
})
@IsOptional()
@IsInt()
attemptNumber?: number  | null;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
sessionId?: string  | null;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
requestId?: string  | null;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
fromStatus?: string  | null;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
toStatus: string ;
@ApiProperty({
  enum: statusDomain,
  enumName: 'statusDomain',
})
@IsNotEmpty()
@IsEnum(statusDomain)
statusDomain: statusDomain ;
@ApiProperty({
  enum: AuditTrigger,
  enumName: 'AuditTrigger',
})
@IsNotEmpty()
@IsEnum(AuditTrigger)
triggeredBy: AuditTrigger ;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
trigger?: string  | null;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
  nullable: true,
})
@IsOptional()
@IsInt()
durationMs?: number  | null;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
  nullable: true,
})
@IsOptional()
@IsInt()
providerLatencyMs?: number  | null;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
providerCode?: string  | null;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
paymentProvider?: string  | null;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
message?: string  | null;
@ApiProperty({
  type: () => Object,
  required: false,
  nullable: true,
})
@IsOptional()
details?: Prisma.InputJsonValue  | Prisma.NullableJsonNullValueInput;
}
