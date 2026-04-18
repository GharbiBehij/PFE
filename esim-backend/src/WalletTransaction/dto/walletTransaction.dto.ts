
import {WalletStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class WalletTransactionDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
amount: number ;
@ApiProperty({
  type: 'string',
})
paymentMethod: string ;
@ApiProperty({
  enum: WalletStatus,
  enumName: 'WalletStatus',
})
status: WalletStatus ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
balanceAfter: number ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
}
