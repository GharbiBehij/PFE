import { Prisma, SystemEvent } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ProvisioningEventDto {
  @ApiProperty({
    type: 'integer',
    format: 'int32',
  })
  id: number;
  @ApiProperty({
    enum: SystemEvent,
    enumName: 'SystemEvent',
  })
  type: SystemEvent;
  @ApiProperty({
    type: () => Object,
    nullable: true,
  })
  metadata: Prisma.JsonValue | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}
