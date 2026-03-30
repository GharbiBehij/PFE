
import {EsimEventStatus,EsimStatus,Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreateEsimAuditLogDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
userId: number ;
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
})
@IsNotEmpty()
@IsEnum(EsimEventStatus)
event: EsimEventStatus ;
@ApiProperty({
  enum: EsimStatus,
  enumName: 'EsimStatus',
})
@IsNotEmpty()
@IsEnum(EsimStatus)
status: EsimStatus ;
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
