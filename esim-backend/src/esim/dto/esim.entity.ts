
import {EsimEventStatus,EsimStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {User} from './user.entity'
import {Transaction} from './transaction.entity'
import {Offer} from './offer.entity'
import {Provider} from './provider.entity'
import {Usage} from './usage.entity'
import {ActivationAttempt} from './activationAttempt.entity'


export class Esim {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'string',
})
iccid: string ;
@ApiProperty({
  type: 'string',
})
activationCode: string ;
@ApiProperty({
  enum: EsimStatus,
  enumName: 'EsimStatus',
})
status: EsimStatus ;
@ApiProperty({
  enum: EsimEventStatus,
  enumName: 'EsimEventStatus',
})
event: EsimEventStatus ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
qrCode: string  | null;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
dataTotal: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
dataUsed: number ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
  nullable: true,
})
lastUsageSync: Date  | null;
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
@ApiProperty({
  type: 'string',
  format: 'date-time',
  nullable: true,
})
activatedAt: Date  | null;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
expiryDate: Date ;
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
@ApiProperty({
  type: 'integer',
  format: 'int32',
  nullable: true,
})
offerId: number  | null;
@ApiProperty({
  type: () => Offer,
  required: false,
  nullable: true,
})
offer?: Offer  | null;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
providerId: number ;
@ApiProperty({
  type: () => Provider,
  required: false,
})
provider?: Provider ;
@ApiProperty({
  type: () => Usage,
  isArray: true,
  required: false,
})
usages?: Usage[] ;
@ApiProperty({
  type: () => ActivationAttempt,
  isArray: true,
  required: false,
})
activationAttempts?: ActivationAttempt[] ;
}
