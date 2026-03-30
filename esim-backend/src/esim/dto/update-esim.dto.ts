
import {EsimEventStatus,EsimStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsDateString,IsEnum,IsOptional,IsString} from 'class-validator'




export class UpdateEsimDto {
  @ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
iccid?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
activationCode?: string ;
@ApiProperty({
  enum: EsimStatus,
  enumName: 'EsimStatus',
  required: false,
})
@IsOptional()
@IsEnum(EsimStatus)
status?: EsimStatus ;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
  required: false,
})
@IsOptional()
@IsEnum(EsimEventStatus)
event?: EsimEventStatus ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  required: false,
  nullable: true,
})
@IsOptional()
@IsDateString()
activatedAt?: Date  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  required: false,
})
@IsOptional()
@IsDateString()
expiryDate?: Date ;
}
