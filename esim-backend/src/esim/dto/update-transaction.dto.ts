
import {TransactionChannel,TransactionStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsEnum,IsInt,IsOptional,IsString} from 'class-validator'




export class UpdateTransactionDto {
  @ApiProperty({
  enum: TransactionStatus,
  enumName: 'TransactionStatus',
  required: false,
})
@IsOptional()
@IsEnum(TransactionStatus)
status?: TransactionStatus ;
@ApiProperty({
  enum: TransactionChannel,
  enumName: 'TransactionChannel',
  required: false,
})
@IsOptional()
@IsEnum(TransactionChannel)
channel?: TransactionChannel ;
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
currency?: string ;
}
