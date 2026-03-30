
import {Prisma,ProvisioningEventType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsOptional} from 'class-validator'




export class UpdateProvisioningEventDto {
  @ApiProperty({
  enum: ProvisioningEventType,
  enumName: 'ProvisioningEventType',
  required: false,
})
@IsOptional()
@IsEnum(ProvisioningEventType)
type?: ProvisioningEventType ;
@ApiProperty({
  type: () => Object,
  required: false,
  nullable: true,
})
@IsOptional()
metadata?: Prisma.InputJsonValue  | Prisma.NullableJsonNullValueInput;
}
