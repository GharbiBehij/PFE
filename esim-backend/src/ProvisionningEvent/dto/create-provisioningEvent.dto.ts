import { Prisma, SystemEvent } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProvisioningEventDto {
  @ApiProperty({
    enum: SystemEvent,
    enumName: 'SystemEvent',
  })
  @IsNotEmpty()
  @IsEnum(SystemEvent)
  type: SystemEvent;
  @ApiProperty({
    type: () => Object,
    required: false,
    nullable: true,
  })
  @IsOptional()
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}
