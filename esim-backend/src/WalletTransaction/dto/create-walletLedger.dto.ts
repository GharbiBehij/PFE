
import {LedgerReason,LedgerType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsNotEmpty,IsOptional} from 'class-validator'




export class CreateWalletLedgerDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
amount: number ;
@ApiProperty({
  enum: LedgerType,
  enumName: 'LedgerType',
})
@IsNotEmpty()
@IsEnum(LedgerType)
type: LedgerType ;
@ApiProperty({
  enum: LedgerReason,
  enumName: 'LedgerReason',
})
@IsNotEmpty()
@IsEnum(LedgerReason)
reason: LedgerReason ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
  nullable: true,
})
@IsOptional()
@IsInt()
referenceId?: number  | null;
}
