
import {ApiProperty} from '@nestjs/swagger'


export class OfferDto {
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
}
