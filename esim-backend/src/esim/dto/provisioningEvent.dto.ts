
import {Prisma,ProvisioningEventType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class ProvisioningEventDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  enum: ProvisioningEventType,
  enumName: 'ProvisioningEventType',
})
type: ProvisioningEventType ;
@ApiProperty({
  type: () => Object,
  nullable: true,
})
metadata: Prisma.JsonValue  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
}
