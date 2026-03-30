
import {EsimEventStatus,EsimStatus,Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsOptional,IsString} from 'class-validator'




export class UpdateEsimAuditLogDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
userId?: number ;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
jobId?: string  | null;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
  required: false,
})
@IsOptional()
@IsEnum(EsimEventStatus)
event?: EsimEventStatus ;
@ApiProperty({
  enum: EsimStatus,
  enumName: 'EsimStatus',
  required: false,
})
@IsOptional()
@IsEnum(EsimStatus)
status?: EsimStatus ;
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
