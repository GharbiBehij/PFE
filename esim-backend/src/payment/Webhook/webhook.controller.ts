import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import { PaymentService } from '../payment.service';

/**
 * Receives server-to-server payment status notifications from ClicToPay.
 *
 * ClicToPay posts to this endpoint (configured via CLICTOPAY_WEBHOOK_URL env var)
 * when a payment transitions to any final state (deposited, declined, reversed…).
 *
 * We intentionally do NOT trust the webhook payload's status field — we always
 * re-query ClicToPay via verifyAndProcess() which is already idempotent.
 * This prevents spoofed webhook attacks while staying event-driven.
 *
 * ClicToPay webhook body fields (Sberbank REST v2 format):
 *   mdOrder      — ClicToPay internal orderId (= our gatewayPaymentId)
 *   orderNumber  — our merchant orderNumber (NF-{txId}-{ts})
 *   operation    — deposited | approved | reversed | refunded | declinedByTimeout
 *   status       — 1 success / 0 failure  (we ignore — re-query instead)
 *   checksum     — HmacSHA256 signature    (logged, not yet enforced)
 */
@ApiExcludeController()
@SkipThrottle()
@Controller('payment')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook/clictopay')
  @HttpCode(HttpStatus.OK)
  async handleClicToPayNotification(
    @Body() body: Record<string, any>,
    @Query() query: Record<string, any>,
  ): Promise<void> {
    // ClicToPay sends mdOrder as their internal orderId (= our gatewayPaymentId).
    // Fall back to orderId for environments that send it under that name.
    const mdOrder: string | undefined =
      body.mdOrder ?? query.mdOrder ?? body.orderId ?? query.orderId;

    const operation: string = body.operation ?? query.operation ?? 'unknown';
    const rawStatus: string = String(body.status ?? query.status ?? '');

    this.logger.log(
      `[webhook] received mdOrder=${mdOrder} operation=${operation} status=${rawStatus}`,
    );

    if (!mdOrder) {
      this.logger.warn('[webhook] missing mdOrder — ignoring callback');
      // Return 200 so ClicToPay does not retry indefinitely on a malformed call.
      return;
    }

    // Re-query ClicToPay for the authoritative status rather than trusting payload.
    try {
      const result = await this.paymentService.verifyAndProcess(mdOrder);
      this.logger.log(
        `[webhook] verifyAndProcess mdOrder=${mdOrder} → status=${result.status} txId=${result.transactionId}`,
      );
    } catch (err: any) {
      // Log but swallow — always return 200 so ClicToPay does not keep retrying.
      this.logger.error(
        `[webhook] verifyAndProcess failed mdOrder=${mdOrder}: ${err.message}`,
      );
    }
  }
}
