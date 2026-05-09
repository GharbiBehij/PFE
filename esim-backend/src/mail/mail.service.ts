import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { resellerCredentialsTemplate } from './templates/reseller-credentials.template';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('POSTMARK_SERVER_TOKEN');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'POSTMARK_SERVER_TOKEN is not configured',
      );
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = 'onboarding@resend.dev';
  }

  async sendResellerCredentials(data: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
  }): Promise<void> {
    const template = resellerCredentialsTemplate(data);

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: data.email,
        subject: template.subject,
        html: template.html,
      });

      this.logger.log(
        `Reseller credentials email sent to ${data.email} - ID: ${result.data?.id ?? 'unknown'}`,
      );
    } catch {
      this.logger.error(`Failed to send credentials email to ${data.email}`);
      throw new InternalServerErrorException(
        'Failed to send credentials email',
      );
    }
  }
}
