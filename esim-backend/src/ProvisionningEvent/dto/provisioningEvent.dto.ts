
import { Prisma, EsimEventStatus } from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class ProvisioningEventDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
})
type: EsimEventStatus ;
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
