
import {Role,UserStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {Transaction} from './transaction.entity'
import {Payment} from './payment.entity'
import {WalletTransaction} from './walletTransaction.entity'
import {Esim} from './esim.entity'
import {Segment} from './segment.entity'
import {TopUpRequest} from './topUpRequest.entity'


export class User {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'string',
})
passportId: string ;
@ApiProperty({
  type: 'string',
})
firstname: string ;
@ApiProperty({
  type: 'string',
})
lastname: string ;
@ApiProperty({
  type: 'string',
})
email: string ;
@ApiProperty({
  type: 'string',
})
hashedPassword: string ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
hashedRefreshToken: string  | null;
@ApiProperty({
  type: 'boolean',
})
isDeleted: boolean ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
balance: number ;
@ApiProperty({
  enum: UserStatus,
  enumName: 'UserStatus',
})
status: UserStatus ;
@ApiProperty({
  enum: Role,
  enumName: 'Role',
})
role: Role ;
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
  type: () => Transaction,
  isArray: true,
  required: false,
})
transactions?: Transaction[] ;
@ApiProperty({
  type: () => Payment,
  isArray: true,
  required: false,
})
payments?: Payment[] ;
@ApiProperty({
  type: () => WalletTransaction,
  isArray: true,
  required: false,
})
walletTransactions?: WalletTransaction[] ;
@ApiProperty({
  type: () => Esim,
  isArray: true,
  required: false,
})
esims?: Esim[] ;
@ApiProperty({
  type: () => Segment,
  isArray: true,
  required: false,
})
segment?: Segment[] ;
@ApiProperty({
  type: () => TopUpRequest,
  isArray: true,
  required: false,
})
salesmanTopUps?: TopUpRequest[] ;
@ApiProperty({
  type: () => TopUpRequest,
  isArray: true,
  required: false,
})
reviewedTopUps?: TopUpRequest[] ;
}
