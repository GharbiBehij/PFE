
import {Prisma,ProvisioningEventType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsNotEmpty,IsOptional} from 'class-validator'




export class CreateProvisioningEventDto {
  @ApiProperty({
  enum: ProvisioningEventType,
  enumName: 'ProvisioningEventType',
})
@IsNotEmpty()
@IsEnum(ProvisioningEventType)
type: ProvisioningEventType ;
@ApiProperty({
  type: () => Object,
  required: false,
  nullable: true,
})
@IsOptional()
metadata?: Prisma.InputJsonValue  | Prisma.NullableJsonNullValueInput;
}
