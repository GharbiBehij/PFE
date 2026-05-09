import { SystemEvent, Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class EsimAuditLogDto {
  @ApiProperty({
    type: 'string',
  })
  id: string;
  @ApiProperty({
    type: 'integer',
    format: 'int32',
  })
  userId: number;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  jobId: string | null;
  @ApiProperty({
    enum: SystemEvent,
    enumName: 'SystemEvent',
  })
  event: SystemEvent;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  message: string | null;
  @ApiProperty({
    type: () => Object,
    nullable: true,
  })
  details: Prisma.JsonValue | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}
