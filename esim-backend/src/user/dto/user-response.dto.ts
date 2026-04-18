import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Amina' })
  firstname: string;

  @ApiProperty({ example: 'Diallo' })
  lastname: string;

  @ApiPropertyOptional({ example: 'P1234567', nullable: true })
  passportId?: string | null;

  @ApiProperty({ example: '$2b$10$W3mM8S6YJY3Vh1JQDK2vGO3z8EmT9y4V4...' })
  hashedPassword: string;

  @ApiPropertyOptional({
    example: '$2b$10$Bv4NqzH1Yq0Qq2R2sV4A1uA2Pmjv2yM3...',
    nullable: true,
  })
  hashedRefreshToken?: string | null;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: 'CLIENT' })
  role: string;

  @ApiProperty({ example: 25000 })
  balance: number;

  @ApiProperty({ example: 'ONLINE' })
  status: string;

  @ApiProperty({ example: '2026-04-09T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-09T10:35:00.000Z' })
  updatedAt: Date;
}
