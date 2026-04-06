
import {ApiProperty} from '@nestjs/swagger'
import {IsInt,IsOptional,IsString} from 'class-validator'




export class UpdateOfferDto {
  @ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
country?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
Region?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
Destination?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
Category?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
title?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
description?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
popularity?: string ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
dataVolume?: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
validityDays?: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
price?: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  required: false,
})
@IsOptional()
@IsInt()
InternalMargin?: number ;
}
