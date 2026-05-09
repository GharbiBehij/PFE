
import {LedgerType,WalletAttemptStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class WalletAttemptDto {
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
}
