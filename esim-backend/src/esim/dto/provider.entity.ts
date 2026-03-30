
import {ApiProperty} from '@nestjs/swagger'
import {Esim} from './esim.entity'
import {Offer} from './offer.entity'


export class Provider {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'string',
})
name: string ;
@ApiProperty({
  type: 'string',
})
apiUrl: string ;
@ApiProperty({
  type: 'string',
})
apiKey: string ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
createdAt: Date ;
@ApiProperty({
  type: () => Esim,
  isArray: true,
  required: false,
})
esims?: Esim[] ;
@ApiProperty({
  type: () => Offer,
  isArray: true,
  required: false,
})
offer?: Offer[] ;
}
