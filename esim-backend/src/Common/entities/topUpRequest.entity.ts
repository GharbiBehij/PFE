
import {TopUpStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {User} from './user.entity'


export class TopUpRequest {
  @ApiProperty({
  type: 'integer',
  format: 'int32',
})
id: number ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
})
salesmanId: number ;
@ApiProperty({
  type: 'number',
  format: 'float',
})
amount: number ;
@ApiProperty({
  enum: TopUpStatus,
  enumName: 'TopUpStatus',
})
status: TopUpStatus ;
@ApiProperty({
  type: 'integer',
  format: 'int32',
  nullable: true,
})
reviewedBy: number  | null;
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
@ApiProperty({
  type: () => User,
  required: false,
})
salesman?: User ;
@ApiProperty({
  type: () => User,
  required: false,
  nullable: true,
})
reviewer?: User  | null;
}
