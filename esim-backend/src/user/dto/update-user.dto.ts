
import {ApiProperty} from '@nestjs/swagger'
import {IsOptional,IsString} from 'class-validator'




export class UpdateUserDto {
  @ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
passportId?: string  | null;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
firstname?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
lastname?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
email?: string ;
@ApiProperty({
  type: 'string',
  required: false,
})
@IsOptional()
@IsString()
hashedPassword?: string ;
@ApiProperty({
  type: 'string',
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
hashedRefreshToken?: string  | null;
}
