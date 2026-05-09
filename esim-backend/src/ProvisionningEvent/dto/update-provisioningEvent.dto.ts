import { Prisma, SystemEvent } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateProvisioningEventDto {
  @ApiProperty({
    enum: SystemEvent,
    enumName: 'SystemEvent',
    required: false,
  })
  @IsOptional()
  @IsEnum(SystemEvent)
  type?: SystemEvent;
  @ApiProperty({
    type: () => Object,
    required: false,
    nullable: true,
  })
  @IsOptional()
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}
