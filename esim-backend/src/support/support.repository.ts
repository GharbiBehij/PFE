import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Support Repository ────────────────────────────────────────────────────────
// Handles all database lookups needed by SupportService.

@Injectable()
export class SupportRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Retrieve user details needed to compose a support ticket email.
  async findUserById(userId: number): Promise<{
    email: string;
    firstname: string;
    lastname: string;
  } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstname: true,
        lastname: true,
      },
    });
  }
}
