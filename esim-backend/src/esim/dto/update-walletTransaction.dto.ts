
import {WalletStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsOptional,IsString} from 'class-validator'




export class UpdateWalletTransactionDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
amount?: number ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
paymentMethod?: string ;
@ApiProperty({
  enum: WalletStatus,
  enumName: 'WalletStatus',
  required: false,
})
@IsOptional()
@IsEnum(WalletStatus)
status?: WalletStatus ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
balanceAfter?: number ;
}
