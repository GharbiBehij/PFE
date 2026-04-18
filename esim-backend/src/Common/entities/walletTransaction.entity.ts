
import {WalletStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {User} from './user.entity'
import {Transaction} from './transaction.entity'
import {WalletLedger} from './walletLedger.entity'


export class WalletTransaction {
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
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
userId: number ;
@ApiProperty({
  type: () => User,
  required: false,
})
user?: User ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  nullable: true,
})
transactionId: number  | null;
@ApiProperty({
  type: () => Transaction,
  required: false,
  nullable: true,
})
transaction?: Transaction  | null;
@ApiProperty({
  type: () => WalletLedger,
  isArray: true,
  required: false,
})
ledgerEntries?: WalletLedger[] ;
}
