
import {TopUpStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class TopUpRequestDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'number',
  format: 'float',
})
amount: number ;
@ApiProperty({
  enum: TopUpStatus,
  enumName: 'TopUpStatus',
})
status: TopUpStatus ;
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
}
