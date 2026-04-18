
import {ApiProperty} from '@nestjs/swagger'
import {IsNumber,IsOptional} from 'class-validator'




export class UpdateTopUpRequestDto {
  @ApiProperty({
  type: 'number',
  format: 'float',
  required: false,
})
@IsOptional()
@IsNumber()
amount?: number ;
}
