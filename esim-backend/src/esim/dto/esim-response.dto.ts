import { Expose, Transform } from 'class-transformer';
import { EsimStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EsimResponseDto {
  @ApiProperty({ example: 77 })
  @Expose()
  id: number;

  @ApiPropertyOptional({ nullable: true, example: 'France' })
  @Expose()
  @Transform(({ obj }) => obj.offer?.country ?? null)
  country: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Europe' })
  @Expose()
  @Transform(({ obj }) => obj.offer?.Region ?? null)
  region: string | null;

  @ApiProperty({ example: 5120, description: 'Total data in MB' })
  @Expose()
  dataTotal: number;

  @ApiProperty({ example: 1200, description: 'Used data in MB' })
  @Expose()
  dataUsed: number;

  @ApiProperty({ example: 3920, description: 'Remaining data in MB' })
  @Expose()
  @Transform(({ obj }) => Math.max(0, (obj.dataTotal ?? 0) - (obj.dataUsed ?? 0)))
  dataRemaining: number;

  @ApiProperty({ example: 23, description: 'Usage percentage from 0 to 100' })
  @Expose()
  @Transform(({ obj }) =>
    obj.dataTotal > 0 ? Math.round(((obj.dataUsed ?? 0) / obj.dataTotal) * 100) : 0,
  )
  usagePercentage: number;

  @ApiProperty({ enum: EsimStatus, example: EsimStatus.ACTIVE })
  @Expose()
  status: EsimStatus;

  @ApiPropertyOptional({
    required: false,
    nullable: true,
    example: 'LPA:1$smdp.io$ACT-2026-ABC',
  })
  @Expose()
  qrCode: string | null;

  @ApiPropertyOptional({
    required: false,
    nullable: true,
    example: '2026-04-09T08:30:00.000Z',
  })
  @Expose()
  activatedAt: Date | null;

  @ApiPropertyOptional({
    required: false,
    nullable: true,
    example: '2026-05-09T08:30:00.000Z',
  })
  @Expose()
  @Transform(({ obj }) => obj.expiryDate ?? null)
  expiresAt: Date | null;

  @ApiPropertyOptional({ required: false, nullable: true, example: 21 })
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.expiryDate) return null;
    const msPerDay = 86_400_000;
    const remaining = Math.ceil(
      (new Date(obj.expiryDate).getTime() - Date.now()) / msPerDay,
    );
    return Math.max(0, remaining);
  })
  daysRemaining: number | null;

  @ApiProperty({ example: '2026-04-09T08:30:00.000Z' })
  @Expose()
  createdAt: Date;
}

export class EsimListResponseDto {
  @ApiProperty({ type: [EsimResponseDto] })
  active: EsimResponseDto[];

  @ApiProperty({ type: [EsimResponseDto] })
  expired: EsimResponseDto[];
}

export class EsimMessageResponseDto {
  @ApiProperty({ example: 'eSIM deleted successfully' })
  message: string;
}
