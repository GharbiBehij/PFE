
import {ApiProperty} from '@nestjs/swagger'
import {IsNotEmpty,IsOptional,IsString} from 'class-validator'




export class CreateUserDto {
  @ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
passportId: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
firstname: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
lastname: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
email: string ;
@ApiProperty({
  type: 'string',
})
@IsNotEmpty()
@IsString()
hashedPassword: string ;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
hashedRefreshToken?: string  | null;
}
