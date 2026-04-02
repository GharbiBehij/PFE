
import {WalletStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsNotEmpty,IsString} from 'class-validator'




export class CreateWalletTransactionDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
amount: number ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
paymentMethod: string ;
@ApiProperty({
  enum: WalletStatus,
  enumName: 'WalletStatus',
})
@IsNotEmpty()
@IsEnum(WalletStatus)
status: WalletStatus ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
balanceAfter: number ;
}
