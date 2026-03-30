import { IsEmail, IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInt()
  id: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  Password: string;
}
