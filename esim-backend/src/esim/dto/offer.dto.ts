
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
