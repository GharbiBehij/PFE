
import {TransactionChannel,TransactionStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsNotEmpty,IsString} from 'class-validator'




export class CreateTransactionDto {
  @ApiProperty({
  enum: TransactionStatus,
  enumName: 'TransactionStatus',
})
@IsNotEmpty()
@IsEnum(TransactionStatus)
status: TransactionStatus ;
@ApiProperty({
  enum: TransactionChannel,
  enumName: 'TransactionChannel',
})
@IsNotEmpty()
@IsEnum(TransactionChannel)
channel: TransactionChannel ;
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
currency: string ;
}
