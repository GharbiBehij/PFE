import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Amina' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'P1234567' })
  @IsString()
  @IsOptional()
  passportId?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.CLIENT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
