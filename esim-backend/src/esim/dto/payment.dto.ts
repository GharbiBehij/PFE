
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class PaymentDto {
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
  type: 'string',
  nullable: true,
})
gatewayPaymentId: string  | null;
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
  type: () => Object,
  nullable: true,
})
rawPayload: Prisma.JsonValue  | null;
@ApiProperty({
  type: 'string',
  nullable: true,
})
paymentUrl: string  | null;
@ApiProperty({
  type: 'string',
  nullable: true,
})
clientSecret: string  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
updatedAt: Date ;
}
