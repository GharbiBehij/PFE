
import {EsimEventStatus,EsimStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class EsimDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'string',
})
iccid: string ;
@ApiProperty({
  type: 'string',
})
activationCode: string ;
@ApiProperty({
  enum: EsimStatus,
  enumName: 'EsimStatus',
})
status: EsimStatus ;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
})
event: EsimEventStatus ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
updatedAt: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  nullable: true,
})
activatedAt: Date  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
expiryDate: Date ;
}
