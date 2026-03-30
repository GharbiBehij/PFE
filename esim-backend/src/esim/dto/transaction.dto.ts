
import {TransactionChannel,TransactionStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class TransactionDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  enum: TransactionStatus,
  enumName: 'TransactionStatus',
})
status: TransactionStatus ;
@ApiProperty({
  enum: TransactionChannel,
  enumName: 'TransactionChannel',
})
channel: TransactionChannel ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
amount: number ;
@ApiProperty({
  type: 'string',
})
currency: string ;
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
