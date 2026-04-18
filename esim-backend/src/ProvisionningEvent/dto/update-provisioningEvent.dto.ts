
import { Prisma, EsimEventStatus } from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsOptional} from 'class-validator'




export class UpdateProvisioningEventDto {
  @ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
  required: false,
})
@IsOptional()
@IsEnum(EsimEventStatus)
type?: EsimEventStatus ;
@ApiProperty({
  type: () => Object,
  required: false,
  nullable: true,
})
@IsOptional()
metadata?: Prisma.InputJsonValue  | Prisma.NullableJsonNullValueInput;
}
