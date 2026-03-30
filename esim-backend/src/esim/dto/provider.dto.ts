
import {ApiProperty} from '@nestjs/swagger'


export class ProviderDto {
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
}
