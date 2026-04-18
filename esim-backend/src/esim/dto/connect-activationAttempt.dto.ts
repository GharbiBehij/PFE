
import {ApiProperty} from '@nestjs/swagger'
import {IsOptional,IsString} from 'class-validator'




export class ConnectActivationAttemptDto {
  @ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
id?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
providerRequestId?: string ;
}
