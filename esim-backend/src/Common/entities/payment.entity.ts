
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {User} from './user.entity'
import {Transaction} from './transaction.entity'


export class Payment {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'string',
})
paymentProvider: string ;
@ApiProperty({
  type: 'string',
})
providerRefId: string ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
amount: number ;
@ApiProperty({
  type: 'string',
})
status: string ;
@ApiProperty({
  type: () => Object,
  nullable: true,
})
rawResponse: Prisma.JsonValue  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
userId: number ;
@ApiProperty({
  type: () => User,
  required: false,
})
user?: User ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
transactionId: number ;
@ApiProperty({
  type: () => Transaction,
  required: false,
})
transaction?: Transaction ;
}
