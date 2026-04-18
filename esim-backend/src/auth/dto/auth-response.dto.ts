import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Amina' })
  firstname: string;

  @ApiProperty({ example: 'Diallo' })
  lastname: string;

  @ApiProperty({ example: 'CUSTOMER' })
  role: string;

  @ApiProperty({ example: 12500, description: 'User wallet balance in minor units' })
  balance: number;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refresh_token: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refresh_token: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}
