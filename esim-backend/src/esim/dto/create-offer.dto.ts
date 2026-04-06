
import {ApiProperty} from '@nestjs/swagger'
import {IsInt,IsNotEmpty,IsString} from 'class-validator'




export class CreateOfferDto {
  @ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
country: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
Region: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
Destination: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
Category: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
title: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
description: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
popularity: string ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
dataVolume: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
validityDays: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
price: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
InternalMargin: number ;
}
