
import {LedgerReason,LedgerType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {WalletTransaction} from './walletTransaction.entity'


export class WalletLedger {
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
  enum: LedgerReason,
  enumName: 'LedgerReason',
})
reason: LedgerReason ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  nullable: true,
})
referenceId: number  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
walletId: number ;
@ApiProperty({
  type: () => WalletTransaction,
  required: false,
})
wallet?: WalletTransaction ;
}
