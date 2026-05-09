import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGatewayAdapter,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class FlouciGateway implements PaymentGatewayAdapter {
  private readonly logger = new Logger(FlouciGateway.name);

  // ── NestJS injects these via constructor DI ──────────────
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  // ── Derived config ───────────────────────────────────────
  private get appUrl(): string {
    return this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  private get authHeader(): string {
    const pub = this.config.get<string>('FLOUCI_PUBLIC_KEY');
    const priv = this.config.get<string>('FLOUCI_PRIVATE_KEY');
    return `Bearer ${pub}:${priv}`;
  }

  // ── createPayment ────────────────────────────────────────
  async createPayment(params: CreatePaymentInput): Promise<CreatePaymentResult> {
    const flouciPayload = {
      amount: String(params.amount * 1000),   // TND → millimes as string
      accept_card: true,
      success_link: 'netyfly://payment/success',
      fail_link: 'netyfly://payment/fail',
      webhook: `${this.appUrl}/payment/webhook`,
      developer_tracking_id: String(params.transactionId),
      client_id: params.firstName ?? '',
      session_timeout_secs: 1200,
    };

    const response = await this.httpService.axiosRef.post(
      'https://developers.flouci.com/api/v2/generate_payment',
      flouciPayload,
      {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.data.result?.success) {
      throw new Error(
        `Flouci payment creation failed: ${response.data.result?.message ?? 'unknown error'}`,
      );
    }

    return {
      gatewayPaymentId: response.data.result.payment_id,
      paymentUrl: response.data.result.link,
      type: 'REDIRECT',
    };
  }

  // ── fetchPaymentStatus ───────────────────────────────────
  async fetchPaymentStatus(
    gatewayPaymentId: string,
  ): Promise<PaymentStatusResult> {
    const response = await this.httpService.axiosRef.get(
      `https://developers.flouci.com/api/v2/verify_payment/${gatewayPaymentId}`,
      {
        headers: {
          Authorization: this.authHeader,
        },
      },
    );

    if (!response.data.success) {
      throw new Error(
        `Flouci verify failed for payment_id=${gatewayPaymentId}`,
      );
    }

    switch (response.data.result.status) {
      case 'SUCCESS':
        return { status: 'SUCCESS' };
      case 'PENDING':
        return { status: 'PENDING' };
      case 'FAILURE':
        return { status: 'FAILED' };
      case 'EXPIRED':
        return { status: 'FAILED' };
      default:
        return { status: 'PENDING' };
    }
  }
}
