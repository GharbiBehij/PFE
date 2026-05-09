import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResellerResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstname: string;

  @ApiProperty()
  lastname: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  zone?: string;

  @ApiProperty({ example: 'SALESMAN' })
  role: string;

  @ApiProperty({
    example:
      'Reseller account created successfully. Credentials sent via email.',
  })
  message: string;
}
