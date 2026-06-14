import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Notification Repository ───────────────────────────────────────────────────
// Handles all database lookups needed by NotificationService.
// Keeps DB access out of the service layer.

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Retrieve all fields needed to send a templated notification (email + push).
  async findUserNotificationData(userId: number): Promise<{
    email: string;
    firstname: string;
    lastname: string;
    pushToken: string | null;
  } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstname: true,
        lastname: true,
        pushToken: true,
      },
    });
  }

  // Retrieve only the push token (lightweight query for push-only notifications).
  async findUserPushToken(userId: number): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });
    return user?.pushToken ?? null;
  }
}
