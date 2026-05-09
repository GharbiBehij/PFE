
import {TransactionChannel,TransactionStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {User} from './user.entity'
import {Offer} from './offer.entity'
import {Esim} from './esim.entity'
import {Payment} from './payment.entity'
import {WalletTransaction} from './walletTransaction.entity'
import {WalletAttempt} from './walletAttempt.entity'
import {AuditLog} from './auditLog.entity'


export class Transaction {
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
})
offerId: number ;
@ApiProperty({
  type: () => Offer,
  required: false,
})
offer?: Offer ;
@ApiProperty({
  type: () => Esim,
  isArray: true,
  required: false,
})
esim?: Esim[] ;
@ApiProperty({
  type: () => Payment,
  required: false,
  nullable: true,
})
payment?: Payment  | null;
@ApiProperty({
  type: () => WalletTransaction,
  required: false,
  nullable: true,
})
walletTransaction?: WalletTransaction  | null;
@ApiProperty({
  type: () => WalletAttempt,
  required: false,
  nullable: true,
})
walletAttempt?: WalletAttempt  | null;
@ApiProperty({
  type: () => AuditLog,
  isArray: true,
  required: false,
})
auditLogs?: AuditLog[] ;
}
