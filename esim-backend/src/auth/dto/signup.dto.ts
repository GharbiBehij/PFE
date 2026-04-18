import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LoginDto } from './login.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto extends LoginDto {
  @ApiProperty({ example: 'Amina' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiPropertyOptional({ example: 'P1234567' })
  @IsString()
  @IsOptional()
  passportId?: string;
}
