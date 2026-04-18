
import {ApiProperty} from '@nestjs/swagger'
import {Esim} from './esim.entity'


export class Usage {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
remainingData: number ;
@ApiProperty({
  type: 'string',
  format: 'date-time',
})
recordedAt: Date ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
esimId: number ;
@ApiProperty({
  type: () => Esim,
  required: false,
})
esim?: Esim ;
}
