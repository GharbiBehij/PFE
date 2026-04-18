import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ProfileResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'Amina' })
  firstname: string;

  @ApiProperty({ example: 'Diallo' })
  lastname: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+21612345678', nullable: true })
  phone: string | null;

  @ApiProperty({ enum: Role, example: Role.CLIENT })
  role: Role;

  @ApiProperty({ example: 25000, description: 'Balance in millimes' })
  balance: number;

  @ApiProperty({ example: '2026-04-09T10:30:00.000Z' })
  createdAt: Date;
}
