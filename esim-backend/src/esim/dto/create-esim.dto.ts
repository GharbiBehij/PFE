
import {EsimEventStatus,EsimStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsDateString,IsEnum,IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreateEsimDto {
  @ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
iccid: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
activationCode: string ;
@ApiProperty({
  enum: EsimStatus,
  enumName: 'EsimStatus',
})
@IsNotEmpty()
@IsEnum(EsimStatus)
status: EsimStatus ;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
})
@IsNotEmpty()
@IsEnum(EsimEventStatus)
event: EsimEventStatus ;
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
})
@IsNotEmpty()
@IsDateString()
expiryDate: Date ;
}
