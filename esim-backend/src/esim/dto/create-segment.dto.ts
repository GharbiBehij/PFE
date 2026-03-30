
import {ApiProperty} from '@nestjs/swagger'
import {IsInt,IsNotEmpty,IsString} from 'class-validator'




export class CreateSegmentDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
@IsNotEmpty()
@IsInt()
id: number ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
name: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
description: string ;
}
