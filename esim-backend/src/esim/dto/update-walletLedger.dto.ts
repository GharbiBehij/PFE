
import {LedgerReason,LedgerType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsOptional} from 'class-validator'




export class UpdateWalletLedgerDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
amount?: number ;
@ApiProperty({
  enum: LedgerType,
  enumName: 'LedgerType',
  required: false,
})
@IsOptional()
@IsEnum(LedgerType)
type?: LedgerType ;
@ApiProperty({
  enum: LedgerReason,
  enumName: 'LedgerReason',
  required: false,
})
@IsOptional()
@IsEnum(LedgerReason)
reason?: LedgerReason ;
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
