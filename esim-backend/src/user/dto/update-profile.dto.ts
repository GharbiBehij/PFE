import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Amina' })
  @IsString()
  @IsOptional()
  firstname?: string;

  @ApiPropertyOptional({ example: 'Diallo' })
  @IsString()
  @IsOptional()
  lastname?: string;

  @ApiPropertyOptional({ example: 'new@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+21612345678' })
  @IsString()
  @IsOptional()
  phone?: string;
}
