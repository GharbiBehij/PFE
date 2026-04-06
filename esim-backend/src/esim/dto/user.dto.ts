
import {Role,UserStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class UserDto {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
passportId: string  | null;
@ApiProperty({
  type: 'string',
})
firstname: string ;
@ApiProperty({
  type: 'string',
})
lastname: string ;
@ApiProperty({
  type: 'string',
})
email: string ;
@ApiProperty({
  type: 'string',
})
hashedPassword: string ;
@ApiProperty({
  type: 'string',
  nullable: true,
})
hashedRefreshToken: string  | null;
@ApiProperty({
  type: 'boolean',
})
isDeleted: boolean ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
balance: number ;
@ApiProperty({
  enum: UserStatus,
  enumName: 'UserStatus',
})
status: UserStatus ;
@ApiProperty({
  enum: Role,
  enumName: 'Role',
})
role: Role ;
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
