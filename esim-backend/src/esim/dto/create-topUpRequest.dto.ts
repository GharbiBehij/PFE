
import {ApiProperty} from '@nestjs/swagger'
import {IsNotEmpty,IsNumber} from 'class-validator'




export class CreateTopUpRequestDto {
  @ApiProperty({
  type: 'number',
  format: 'float',
})
@IsNotEmpty()
@IsNumber()
amount: number ;
}
