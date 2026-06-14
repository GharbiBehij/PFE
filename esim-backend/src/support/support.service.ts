import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportRepository } from './support.repository';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly supportRepository: SupportRepository,
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── Submit Support Ticket ─────────────────────────────────────────────────
  // Sends a confirmation notification to the user and forwards the ticket
  // to the internal support inbox via Postmark email.
  async submitTicket(dto: CreateSupportTicketDto, userId: number) {
    const user = await this.supportRepository.findUserById(userId);

    this.logger.log(
      `[support] New ticket from userId=${userId} email=${user?.email} subject="${dto.subject}"`,
    );

    // Notify user that their ticket was received
    this.notificationService
      .notifyUser(userId, 'support_received', {
        firstname: user?.firstname,
        subject: dto.subject,
      })
      .catch(() => {});

    // Forward ticket to internal support inbox
    const postmarkToken = this.config.get<string>('POSTMARK_SERVER_TOKEN');
    if (postmarkToken) {
      try {
        const response = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': postmarkToken,
          },
          body: JSON.stringify({
            From: 'noreply@netyfly.com',
            To: 'support@netyfly.com',
            Subject: `[Support] ${dto.subject}`,
            TextBody: [
              `De: ${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim(),
              `Email: ${user?.email ?? 'unknown'}`,
              `UserId: ${userId}`,
              '',
              `Sujet: ${dto.subject}`,
              '',
              'Message:',
              dto.message,
            ].join('\n'),
          }),
        });

        if (!response.ok) {
          this.logger.error(
            `[support] Postmark send failed status=${response.status}`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[support] Postmark error: ${message}`);
      }
    }

    return { success: true, message: 'Ticket submitted successfully' };
  }
}
