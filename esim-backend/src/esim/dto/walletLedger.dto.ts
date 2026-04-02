
import {LedgerReason,LedgerType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class WalletLedgerDto {
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
}
