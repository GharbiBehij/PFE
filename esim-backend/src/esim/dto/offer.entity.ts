
import {CoverageType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {Provider} from './provider.entity'
import {Transaction} from './transaction.entity'
import {Esim} from './esim.entity'


export class Offer {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'string',
})
country: string ;
@ApiProperty({
  type: 'string',
})
Region: string ;
@ApiProperty({
  type: 'string',
})
Destination: string ;
@ApiProperty({
  type: 'string',
})
Category: string ;
@ApiProperty({
  type: 'string',
})
title: string ;
@ApiProperty({
  type: 'string',
})
description: string ;
@ApiProperty({
  type: 'string',
})
popularity: string ;
@ApiProperty({
  enum: CoverageType,
  enumName: 'CoverageType',
})
coverageType: CoverageType ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
dataVolume: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
validityDays: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
price: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
InternalMargin: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
providerId: number ;
@ApiProperty({
  type: 'boolean',
})
isDeleted: boolean ;
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
  type: () => Provider,
  required: false,
})
provider?: Provider ;
@ApiProperty({
  type: () => Transaction,
  isArray: true,
  required: false,
})
transactions?: Transaction[] ;
@ApiProperty({
  type: () => Esim,
  isArray: true,
  required: false,
})
esims?: Esim[] ;
}
