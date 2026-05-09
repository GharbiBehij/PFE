
import {LedgerType,WalletAttemptStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsDateString,IsEnum,IsInt,IsOptional,IsString} from 'class-validator'




export class UpdateWalletAttemptDto {
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
  enum: WalletAttemptStatus,
  enumName: 'WalletAttemptStatus',
  required: false,
})
@IsOptional()
@IsEnum(WalletAttemptStatus)
status?: WalletAttemptStatus ;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
failureReason?: string  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  required: false,
})
@IsOptional()
@IsDateString()
startedAt?: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  required: false,
  nullable: true,
})
@IsOptional()
@IsDateString()
completedAt?: Date  | null;
}
