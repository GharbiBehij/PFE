
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {IsInt,IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreatePaymentDto {
  @ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
paymentProvider: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
providerRefId: string ;
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
status: string ;
@ApiProperty({
  type: () => Object,
  required: false,
  nullable: true,
})
@IsOptional()
rawResponse?: Prisma.InputJsonValue  | Prisma.NullableJsonNullValueInput;
}
