import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LoginDto } from './login.dto';

export class SignupDto extends LoginDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsString()
  @IsOptional()
  passportId?: string;
}
