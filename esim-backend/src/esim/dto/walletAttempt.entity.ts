
import {LedgerType,WalletAttemptStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {Transaction} from './transaction.entity'
import {User} from './user.entity'


export class WalletAttempt {
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
  enum: LedgerType,
  enumName: 'LedgerType',
})
type: LedgerType ;
@ApiProperty({
  enum: WalletAttemptStatus,
  enumName: 'WalletAttemptStatus',
})
status: WalletAttemptStatus ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
failureReason: string  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
startedAt: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  nullable: true,
})
completedAt: Date  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
transactionId: number ;
@ApiProperty({
  type: () => Transaction,
  required: false,
})
transaction?: Transaction ;
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
}
