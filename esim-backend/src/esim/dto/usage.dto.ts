
import {ApiProperty} from '@nestjs/swagger'


export class UsageDto {
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
}
