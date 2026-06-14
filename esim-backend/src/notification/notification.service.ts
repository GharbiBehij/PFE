import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationRepository } from './notification.repository';

type NotificationTemplate =
  | 'welcome'
  | 'payment_confirmed'
  | 'activation_success'
  | 'activation_failed'
  | 'activation_retrying'
  | 'topup_success'
  | 'support_received';

interface TemplateData {
  firstname?: string;
  country?: string;
  amount?: number;
  currency?: string;
  activationCode?: string;
  dataAdded?: number;
  subject?: string;
}

interface EmailPayload {
  subject: string;
  htmlBody: string;
  textBody: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly config: ConfigService,
  ) {}

  // ── Push Notification (raw payload) ──────────────────────────────────────
  // Sends a push notification directly without templates.
  // Used for quick inline alerts from other services.
  async send(userId: number, payload: { title: string; body: string }) {
    const pushToken =
      await this.notificationRepository.findUserPushToken(userId);
    if (!pushToken) return;
    await fetch('https://exp.host/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title: payload.title,
        body: payload.body,
        sound: 'default',
      }),
    });
  }

  // ── Templated Notification (email + push) ─────────────────────────────────
  // Sends both an email (via Postmark) and a push notification (via Expo)
  // using a pre-defined template. Silently skips missing users or tokens.
  async notifyUser(
    userId: number,
    template: NotificationTemplate,
    data: TemplateData = {},
  ): Promise<void> {
    try {
      const user =
        await this.notificationRepository.findUserNotificationData(userId);

      if (!user) return;

      const templateData = { ...data, firstname: user.firstname };
      const { subject, htmlBody, textBody } = this.buildTemplate(
        template,
        templateData,
      );

      await Promise.allSettled([
        this.sendEmail(user.email, subject, htmlBody, textBody),
        user.pushToken
          ? this.sendPush(user.pushToken, subject, textBody)
          : Promise.resolve(),
      ]);
    } catch (err) {
      this.logger.error(
        `[notification] Failed for userId=${userId} template=${template}: ${err}`,
      );
    }
  }

  // ── Push-Only Notification ────────────────────────────────────────────────
  // Sends only a push notification (no email). Used for lightweight alerts
  // such as retry progress updates during eSIM activation.
  async sendPushOnly(
    userId: number,
    title: string,
    body: string,
  ): Promise<void> {
    try {
      const pushToken =
        await this.notificationRepository.findUserPushToken(userId);
      if (!pushToken) return;
      await this.sendPush(pushToken, title, body);
    } catch (err) {
      this.logger.error(
        `[notification] Push failed for userId=${userId}: ${err}`,
      );
    }
  }

  // ── Private: Email Delivery ───────────────────────────────────────────────
  private async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody: string,
  ): Promise<void> {
    const token = this.config.get<string>('POSTMARK_SERVER_TOKEN');
    const from = this.config.get<string>('POSTMARK_FROM', 'behijg@gmail.com');

    if (!token) {
      this.logger.warn(
        '[notification] POSTMARK_SERVER_TOKEN not set — skipping email',
      );
      return;
    }

    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify({
        From: `NetyFly <${from}>`,
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: 'outbound',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`[notification] Postmark error: ${error}`);
    } else {
      this.logger.log(
        `[notification] Email sent to ${to} — subject: ${subject}`,
      );
    }
  }

  // ── Private: Push Delivery ────────────────────────────────────────────────
  private async sendPush(
    pushToken: string,
    title: string,
    body: string,
  ): Promise<void> {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        sound: 'default',
        data: { source: 'netyfly' },
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `[notification] Expo push error for token=${pushToken}`,
      );
    } else {
      this.logger.log(`[notification] Push sent to token=${pushToken}`);
    }
  }

  // ── Private: Template Builder ─────────────────────────────────────────────
  // Builds HTML and text email payloads for each notification template.
  private buildTemplate(
    template: NotificationTemplate,
    data: TemplateData,
  ): EmailPayload {
    const {
      firstname = 'Client',
      country = '',
      amount = 0,
      currency = 'TND',
    } = data;

    const base = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white;
                 border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #5B21B6, #7C3AED);
              padding: 32px; text-align: center; }
    .header-title { color: white; font-size: 24px; font-weight: 800;
                    margin: 0; letter-spacing: -0.5px; }
    .header-sub { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 4px; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1F2937; margin-bottom: 16px; }
    .message { font-size: 15px; color: #6B7280; line-height: 1.6; }
    .highlight { background: #F5F3FF; border-radius: 12px; padding: 16px;
                 margin: 24px 0; border-left: 4px solid #7C3AED; }
    .highlight-text { font-size: 14px; color: #7C3AED; font-weight: 600; }
    .button { display: inline-block; background: #FACC15; color: #1C1917;
              font-weight: 700; font-size: 15px; padding: 14px 32px;
              border-radius: 12px; text-decoration: none; margin-top: 24px; }
    .footer { background: #F9FAFB; padding: 24px; text-align: center;
              font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">✈ NetyFly</div>
      <div class="header-sub">connecté partout dans le monde</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      © 2026 NetyFly · support@netyfly.com
    </div>
  </div>
</body>
</html>`;

    switch (template) {
      case 'welcome':
        return {
          subject: 'Bienvenue sur NetyFly — Prêt à décoller ? ✈',
          htmlBody: base(`
            <div class="greeting">Bonjour ${firstname} 👋</div>
            <div class="message">
              Votre compte NetyFly est prêt. Vous pouvez maintenant
              acheter des forfaits eSIM pour voyager dans 190+ pays
              sans frais d'itinérance.
            </div>
            <div class="highlight">
              <div class="highlight-text">
                🌍 Connectivité instantanée · Sans SIM physique · Sans engagement
              </div>
            </div>
            <div class="message">
              Parcourez nos offres et partez l'esprit tranquille.
            </div>
          `),
          textBody: `Bienvenue sur NetyFly, ${firstname} ! Votre compte est prêt. Parcourez nos offres sur l'application.`,
        };

      case 'payment_confirmed':
        return {
          subject: 'Paiement confirmé — NetyFly ✓',
          htmlBody: base(`
            <div class="greeting">Paiement reçu ✓</div>
            <div class="message">
              Bonjour ${firstname}, votre paiement a été confirmé avec succès.
            </div>
            <div class="highlight">
              <div class="highlight-text">
                💳 Montant: ${amount} ${currency}<br/>
                🌍 Destination: ${country}<br/>
                ⏳ Activation de votre eSIM en cours...
              </div>
            </div>
            <div class="message">
              Votre eSIM sera activée dans quelques instants.
              Vous recevrez une confirmation dès que c'est prêt.
            </div>
          `),
          textBody: `Bonjour ${firstname}, votre paiement de ${amount} ${currency} a été confirmé. Activation de votre eSIM en cours.`,
        };

      case 'activation_success':
        return {
          subject: 'Votre eSIM est prête ! 🎉 — NetyFly',
          htmlBody: base(`
            <div class="greeting">eSIM activée ! 🎉</div>
            <div class="message">
              Bonjour ${firstname}, votre eSIM pour
              <strong>${country}</strong> est activée et prête à l'emploi.
            </div>
            <div class="highlight">
              <div class="highlight-text">
                📱 Ouvrez NetyFly → Mes eSIMs pour scanner votre QR code
              </div>
            </div>
            <div class="message">
              <strong>Comment installer votre eSIM :</strong><br/>
              1. Paramètres → Données mobiles<br/>
              2. Ajouter une eSIM<br/>
              3. Scanner le QR code dans l'application<br/>
              4. Activez à destination
            </div>
          `),
          textBody: `Bonjour ${firstname}, votre eSIM pour ${country} est activée ! Ouvrez NetyFly pour scanner votre QR code.`,
        };

      case 'activation_failed':
        return {
          subject: "Problème d'activation — NetyFly",
          htmlBody: base(`
            <div class="greeting">Nous avons rencontré un problème</div>
            <div class="message">
              Bonjour ${firstname}, nous n'avons pas pu activer
              votre eSIM pour <strong>${country}</strong>.
            </div>
            <div class="highlight">
              <div class="highlight-text">
                ⚠️ Notre équipe va relancer l'activation automatiquement.
                Si le problème persiste, contactez notre support.
              </div>
            </div>
            <div class="message">
              📞 WhatsApp: +216 26 497 904<br/>
              📧 Email: support@netyfly.com
            </div>
          `),
          textBody: `Bonjour ${firstname}, nous n'avons pas pu activer votre eSIM pour ${country}. Notre équipe relance l'activation. Support: support@netyfly.com`,
        };

      case 'activation_retrying':
        return {
          subject: 'Activation en cours — NetyFly',
          htmlBody: base(`
            <div class="greeting">Activation en cours ⏳</div>
            <div class="message">
              Bonjour ${firstname}, votre eSIM pour
              <strong>${country}</strong> est en cours d'activation.
              Cela peut prendre quelques minutes.
            </div>
            <div class="highlight">
              <div class="highlight-text">
                🔄 Nous réessayons automatiquement.
                Vous recevrez une confirmation dès que c'est prêt.
              </div>
            </div>
          `),
          textBody: `Bonjour ${firstname}, votre eSIM pour ${country} est en cours d'activation. Nous vous préviendrons dès que c'est prêt.`,
        };

      case 'topup_success':
        return {
          subject: 'Recharge réussie — NetyFly ✓',
          htmlBody: base(`
            <div class="greeting">Recharge réussie ✓</div>
            <div class="message">
              Bonjour ${firstname}, votre eSIM pour
              <strong>${country}</strong> a été rechargée avec succès.
            </div>
            <div class="highlight">
              <div class="highlight-text">
                📶 ${data.dataAdded ?? 0} MB ajoutés à votre eSIM
              </div>
            </div>
            <div class="message">
              Vos nouvelles données sont disponibles immédiatement.
            </div>
          `),
          textBody: `Bonjour ${firstname}, votre eSIM ${country} a été rechargée avec ${data.dataAdded ?? 0} MB supplémentaires.`,
        };

      case 'support_received':
        return {
          subject: 'Nous avons reçu votre message — NetyFly',
          htmlBody: base(`
            <div class="greeting">Message reçu ✓</div>
            <div class="message">
              Bonjour ${firstname}, nous avons bien reçu votre demande
              concernant : <strong>${data.subject ?? ''}</strong>
            </div>
            <div class="highlight">
              <div class="highlight-text">
                ⏱ Notre équipe vous répondra sous 24h à cette adresse email.
              </div>
            </div>
            <div class="message">
              Si votre demande est urgente, vous pouvez également
              nous contacter via WhatsApp : +216 26 497 904
            </div>
          `),
          textBody: `Bonjour ${firstname}, nous avons reçu votre message. Notre équipe vous répondra sous 24h. Urgent: WhatsApp +216 26 497 904`,
        };

      default:
        return {
          subject: 'NetyFly',
          htmlBody: base(`<div class="message">Bonjour ${firstname}</div>`),
          textBody: `Bonjour ${firstname}`,
        };
    }
  }
}
