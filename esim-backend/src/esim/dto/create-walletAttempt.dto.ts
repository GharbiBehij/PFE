
import {LedgerType,WalletAttemptStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsDateString,IsEnum,IsInt,IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreateWalletAttemptDto {
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
  enum: WalletAttemptStatus,
  enumName: 'WalletAttemptStatus',
})
@IsNotEmpty()
@IsEnum(WalletAttemptStatus)
status: WalletAttemptStatus ;
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
})
@IsNotEmpty()
@IsDateString()
startedAt: Date ;
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
